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
import net.dutymate.api.domain.autoschedule.util.FixScheduleGenerator;
import net.dutymate.api.domain.autoschedule.util.NurseScheduler;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.request.repository.RequestRepository;
import net.dutymate.api.domain.rule.Rule;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.WorkIntensity;
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

	private final NurseScheduler nurseScheduler;
	private final FixScheduleGenerator fixScheduleGenerator;

	@Transactional
	public ResponseEntity<?> generateAutoSchedule(YearMonth yearMonth, Member member, boolean force,
		List<Long> reinforcementRequestIds) {
		Long wardId = member.getWardMember().getWard().getWardId();

		// 잔여 자동 횟수 체크
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
			.filter(wm -> wm.getShiftFlags() == ShiftType.N.getFlag())
			.toList();

		//주중 Mid 전담 인원
		List<WardMember> midWardMembers = wardMembers.stream()
			.filter(wm -> wm.getShiftFlags() == ShiftType.M.getFlag())
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
		wardMembers.removeIf(wm -> wm.getShiftFlags() == ShiftType.D.getFlag()
			|| wm.getShiftFlags() == ShiftType.M.getFlag()
			|| wm.getShiftFlags() == ShiftType.N.getFlag());

		Map<Integer, Integer> dailyNightCount = new HashMap<>();
		List<WardSchedule.NurseShift> newNightNurseShifts = new ArrayList<>();
		Map<Long, String> prevSchedulesMap = nurseScheduler.getPreviousMonthSchedules(prevNurseShifts);

		if (!nightWardMembers.isEmpty()) {
			for (int rotation = 0; rotation < nightWardMembers.size(); rotation++) {
				WardMember wm = nightWardMembers.get(rotation);
				String prevShifts = prevSchedulesMap.get(wm.getMember().getMemberId());

				//기존 generateNightSchedule 사용
				String shifts;
				if (prevShifts == null || prevShifts.isEmpty() || "XXXX".equals(prevShifts)) {
					shifts = fixScheduleGenerator.generateNightSchedule(
						yearMonth.daysInMonth(),
						rotation,
						nightWardMembers.size(),
						dailyNightCount
					);
				} else {
					// 유효한 이전 달 패턴이 있는 경우 연속성을 고려한 메서드 사용
					shifts = fixScheduleGenerator.generateContinuousNightSchedule(
						yearMonth.daysInMonth(),
						prevShifts,
						dailyNightCount
					);
				}

				WardSchedule.NurseShift newNurseShift = WardSchedule.NurseShift.builder()
					.memberId(wm.getMember().getMemberId())
					.shifts(shifts)
					.build();

				newNightNurseShifts.add(newNurseShift);
			}
		}
		Map<Long, WorkIntensity> workIntensities = wardMembers.stream()
			.collect(Collectors.toMap(
				wm -> wm.getMember().getMemberId(),
				WardMember::getWorkIntensity,
				(a, b) -> a // 중복 키가 있을 경우 첫 번째 값 유지
			));

		WardSchedule updateWardSchedule = nurseScheduler.generateSchedule(
			wardSchedule, rule, wardMembers,
			prevNurseShifts, yearMonth, memberId,
			acceptedRequests, dailyNightCount,
			reinforcementRequestIds, workIntensities // 워크 인텐시티 추가
		);

		List<WardSchedule.NurseShift> updatedShifts = new ArrayList<>(updateWardSchedule.getDuties()
			.get(updateWardSchedule.getNowIdx())
			.getDuty());

		for (WardMember wm : midWardMembers) {
			WardSchedule.NurseShift newNurseShift = WardSchedule.NurseShift.builder()
				.memberId(wm.getMember().getMemberId())
				.shifts(fixScheduleGenerator.midShiftBuilder(yearMonth))
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

		// 원래 ACCEPTED였지만 자동 생성 후 실제 스케줄과 다른 요청 찾기
		List<Request> unreflectedRequests = acceptedRequests.stream()
			.filter(req -> {
				// 요청한 날짜의 실제 근무 찾기
				String actualShift = findActualShift(
					updateWardSchedule,
					req.getWardMember().getMember().getMemberId(),
					req.getRequestDate()
				);

				// 요청한 근무와 실제 배정된 근무가 다른 경우
				String requestedShift = req.getRequestShift().getValue();
				return !actualShift.equals(requestedShift);
			})
			.toList();

		List<AutoScheduleResponseDto.UnreflectedRequestInfo> unreflectedInfo =
			unreflectedRequests.stream()
				.map(req -> AutoScheduleResponseDto.UnreflectedRequestInfo.builder()
					.requestId(req.getRequestId())
					.memberId(req.getWardMember().getMember().getMemberId())
					.memberName(req.getWardMember().getMember().getName())
					.requestDate(req.getRequestDate())
					.requestShift(req.getRequestShift().getValue())
					.actualShift(findActualShift(
						updateWardSchedule,
						req.getWardMember().getMember().getMemberId(),
						req.getRequestDate()
					))
					.requestMemo(req.getMemo())
					.build())
				.toList();

		AutoScheduleResponseDto responseDto = AutoScheduleResponseDto.builder()
			.message("자동 생성 완료")
			.isSuccess(true)
			.unreflectedRequestsCount(unreflectedRequests.size())
			.unreflectedRequests(unreflectedInfo)
			.build();

		wardScheduleRepository.save(updateWardSchedule);

		return ResponseEntity.ok(responseDto);
	}

	private String findActualShift(WardSchedule wardSchedule, Long memberId, java.sql.Date requestDate) {
		// java.sql.Date를 LocalDate로 변환하고 일(day) 추출
		int day = requestDate.toLocalDate().getDayOfMonth();

		// 최신 스케줄 가져오기
		WardSchedule.Duty currentDuty = wardSchedule.getDuties().get(wardSchedule.getNowIdx());

		// 해당 멤버의 스케줄 찾기
		for (WardSchedule.NurseShift nurseShift : currentDuty.getDuty()) {
			if (nurseShift.getMemberId().equals(memberId)) {
				String shifts = nurseShift.getShifts();
				// day는 1부터 시작하지만, shifts 문자열의 인덱스는 0부터 시작하므로 -1 필요
				if (day <= shifts.length()) {
					return String.valueOf(shifts.charAt(day - 1));
				}
			}
		}

		// 정보를 찾을 수 없는 경우
		return "X";
	}
}
