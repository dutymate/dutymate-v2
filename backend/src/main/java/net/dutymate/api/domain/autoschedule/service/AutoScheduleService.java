package net.dutymate.api.domain.autoschedule.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.autoschedule.dto.AutoScheduleNurseCountResponseDto;
import net.dutymate.api.domain.autoschedule.dto.AutoScheduleResponseDto;
import net.dutymate.api.domain.autoschedule.util.NurseScheduler;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.request.repository.RequestRepository;
import net.dutymate.api.domain.request.util.UpdateRequestStatuses;
import net.dutymate.api.domain.rule.Rule;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.repository.WardMemberRepository;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;
import net.dutymate.api.domain.wardschedules.repository.WardScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AutoScheduleService {

	private final WardMemberRepository wardMemberRepository;

	private final WardScheduleRepository wardScheduleRepository;
	private final RequestRepository requestRepository;

	private final UpdateRequestStatuses updateRequestStatuses;
	private final NurseScheduler nurseScheduler;

	@Transactional
	public ResponseEntity<?> generateAutoSchedule(YearMonth yearMonth, Member member, boolean force) {
		// TODO 자동 생성 횟수 남아있는지 체크
		Long wardId = member.getWardMember().getWard().getWardId();

		if (member.getAutoGenCnt() <= 0) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(AutoScheduleResponseDto.builder()
					.message("자동 생성 횟수가 부족합니다.")
					.isSuccess(false)
					.build());
		}
		//전월 달 근무 호출
		YearMonth prevYearMonth = yearMonth.prevYearMonth();
		WardSchedule prevWardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(wardId, prevYearMonth.year(), prevYearMonth.month())
			.orElse(null);
		// 전달 듀티표 가져오기
		List<WardSchedule.NurseShift> prevNurseShifts;
		if (prevWardSchedule != null) {
			prevNurseShifts = prevWardSchedule.getDuties().get(prevWardSchedule.getNowIdx()).getDuty();
		} else {
			prevNurseShifts = null;
		}

		Rule rule = member.getWardMember().getWard().getRule();
		List<WardMember> wardMembers = wardMemberRepository.findAllByWard(member.getWardMember().getWard());
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(wardId, yearMonth.year(),
				yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "근무 일정을 찾을 수 없습니다."));

		//나이트 전담 인원
		List<WardMember> nightWardMembers = wardMembers.stream()
			.filter(wm -> wm.getShiftType() == ShiftType.N)
			.toList();

		//주중 Mid 전담 인원
		List<WardMember> midWardMembers = wardMembers.stream()
			.filter(wm -> wm.getShiftType() == ShiftType.M)
			.toList();

		int nightWardMemberCount = nightWardMembers.size();
		int wardMemberCount = wardMembers.size();
		int neededNurseCount = nurseScheduler.neededNurseCount(yearMonth, rule, nightWardMemberCount)
			+ midWardMembers.size();

		if (wardMemberCount < neededNurseCount && !force) {
			AutoScheduleNurseCountResponseDto responseDto = new AutoScheduleNurseCountResponseDto(
				neededNurseCount
			);
			return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
				.body(responseDto);
		}
		Long memberId = member.getMemberId();

		List<Request> acceptedRequests = requestRepository.findAcceptedWardRequestsByYearMonth(
			member.getWardMember().getWard(),
			yearMonth.year(),
			yearMonth.month(),
			RequestStatus.ACCEPTED
		);

		//HN 자동 로직에서 제거
		wardMembers.removeIf(wm -> wm.getShiftType() == ShiftType.D
			|| wm.getShiftType() == ShiftType.M
			|| wm.getShiftType() == ShiftType.N);

		Map<Integer, Integer> dailyNightCount = new HashMap<>();
		List<WardSchedule.NurseShift> newNightNurseShifts = new ArrayList<>();
		if (!nightWardMembers.isEmpty()) {
			for (int rotation = 0; rotation < nightWardMembers.size(); rotation++) {
				WardMember wm = nightWardMembers.get(rotation);
				newNightNurseShifts.add(WardSchedule.NurseShift.builder()
					.memberId(wm.getMember().getMemberId())
					.shifts(
						nurseScheduler.generateNightSchedule(yearMonth.daysInMonth(), rotation, nightWardMembers.size(),
							dailyNightCount))
					.build());
			}
		}

		WardSchedule updateWardSchedule = nurseScheduler.generateSchedule(wardSchedule, rule, wardMembers,
			prevNurseShifts, yearMonth, memberId,
			acceptedRequests, dailyNightCount);


		List<WardSchedule.NurseShift> updatedShifts = new ArrayList<>(updateWardSchedule.getDuties()
			.get(updateWardSchedule.getNowIdx())
			.getDuty());

		for (WardMember wm : midWardMembers) {
			WardSchedule.NurseShift newNurseShift = WardSchedule.NurseShift.builder()
				.memberId(wm.getMember().getMemberId())
				.shifts(nurseScheduler.midShiftBuilder(yearMonth))
				.build();

			updatedShifts.add(newNurseShift);
		}

		//야간 근무자 duty표 생성
		for (WardSchedule.NurseShift newShift : newNightNurseShifts) {
			updatedShifts.add(newShift);
		}

		WardSchedule.Duty currentDuty = updateWardSchedule.getDuties().get(updateWardSchedule.getNowIdx());
		currentDuty.getDuty().clear();

		for (WardSchedule.NurseShift nurseShift : updatedShifts) {
			currentDuty.addNurseShift(nurseShift);
		}

		List<WardSchedule.NurseShift> originalShifts = wardSchedule.getDuties().get(wardSchedule.getNowIdx()).getDuty();

		boolean isChanged = false;
		for (int nurseCnt = 0; nurseCnt < originalShifts.size(); nurseCnt++) {
			if (!originalShifts.get(nurseCnt).getShifts().equals(
				updatedShifts.get(nurseCnt).getShifts()
			)) {
				isChanged = true;
				break;
			}
		}

		if (!isChanged) {
			throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "모든 조건을 만족하는 최적의 근무표입니다.");
		}

		member.updateAutoGenCnt(-1);


		Set<Long> previouslyAcceptedRequestIds = acceptedRequests.stream()
			.map(Request::getRequestId)
			.collect(Collectors.toSet());


		List<Request> allRequests = requestRepository.findAllWardRequestsByYearMonth(member.getWardMember().getWard(),
			yearMonth.year(),
			yearMonth.month());
		//요청 상태 관리
		updateRequestStatuses.updateRequestStatuses(allRequests, updateWardSchedule, yearMonth);

		// 원래 ACCEPTED였지만 자동 생성 후 DENIED로 변경된 요청 찾기
		List<Request> unreflectedRequests = allRequests.stream()
			.filter(req -> previouslyAcceptedRequestIds.contains(req.getRequestId())) // 원래 ACCEPTED였던 요청
			.filter(req -> req.getStatus() == RequestStatus.DENIED) // 현재는 DENIED인 요청
			.toList();



		wardScheduleRepository.save(updateWardSchedule);

		List<AutoScheduleResponseDto.UnreflectedRequestInfo> unreflectedInfo =
			unreflectedRequests.stream()
				.map(req -> AutoScheduleResponseDto.UnreflectedRequestInfo.builder()
					.memberId(req.getWardMember().getMember().getMemberId())
					.memberName(req.getWardMember().getMember().getName())
					.requestDate(req.getRequestDate())
					.requestShift(req.getRequestShift().getValue())
					.build())
				.toList();

		AutoScheduleResponseDto responseDto = AutoScheduleResponseDto.builder()
			.message("자동 생성 완료")
			.isSuccess(true)
			.unreflectedRequestsCount(unreflectedRequests.size())
			.unreflectedRequests(unreflectedInfo)
			.build();

		return ResponseEntity.ok(responseDto);
	}

}
