package net.dutymate.api.domain.autoschedule.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

		// 전월 달 근무 호출
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
		List<WardMember> allWardMembers = wardMemberRepository.findAllByWard(member.getWardMember().getWard());
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(wardId, yearMonth.year(),
				yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "근무 일정을 찾을 수 없습니다."));

		// Mid 전담 인원만 따로 분리 (자동생성에서 제외)
		List<WardMember> midWardMembers = allWardMembers.stream()
			.filter(wm -> wm.getShiftFlags().equals(ShiftType.M.getFlag()))
			.toList();

		// 자동 생성에 포함될 간호사들 (Mid 제외한 모든 간호사)
		List<WardMember> regularWardMembers = new ArrayList<>(allWardMembers);
		regularWardMembers.removeIf(wm -> wm.getShiftFlags().equals(ShiftType.M.getFlag()));

		int wardMemberCount = allWardMembers.size();

		int nightNurseCnt = allWardMembers.stream()
			.filter(wm -> wm.getShiftFlags().equals(ShiftType.N.getFlag()))
			.toList().size();

		// Night 전담 간호사 수는 따로 계산하지 않음 (통합 로직에 포함됨)
		int neededNurseCount = nurseScheduler.neededNurseCount(yearMonth, rule, nightNurseCnt)
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

		Map<Integer, Integer> dailyNightCount = new HashMap<>();
		nurseScheduler.getPreviousMonthSchedules(prevNurseShifts);

		// 각 간호사의 ShiftFlags를 Map으로 변환하여 전달
		Map<Long, Integer> nurseShiftFlags = regularWardMembers.stream()
			.collect(Collectors.toMap(
				wm -> wm.getMember().getMemberId(),
				WardMember::getShiftFlags
			));

		// 간호사들의 WorkIntensity 정보 수집
		Map<Long, WorkIntensity> workIntensities = regularWardMembers.stream()
			.collect(Collectors.toMap(
				wm -> wm.getMember().getMemberId(),
				WardMember::getWorkIntensity,
				(a, b) -> a  // 중복 키 처리
			));

		// 통합된 자동 스케줄 생성 (Night 근무자 포함)
		WardSchedule updateWardSchedule = nurseScheduler.generateSchedule(
			wardSchedule, rule, regularWardMembers,
			prevNurseShifts, yearMonth, memberId,
			acceptedRequests, dailyNightCount,
			reinforcementRequestIds, workIntensities,
			nurseShiftFlags  // 새로 추가된 파라미터
		);

		List<WardSchedule.NurseShift> updatedShifts = new ArrayList<>(updateWardSchedule.getDuties()
			.get(updateWardSchedule.getNowIdx())
			.getDuty());

		// Mid 전담 간호사들만 별도 처리
		for (WardMember wm : midWardMembers) {
			WardSchedule.NurseShift newNurseShift = WardSchedule.NurseShift.builder()
				.memberId(wm.getMember().getMemberId())
				.shifts(fixScheduleGenerator.midShiftBuilder(yearMonth))
				.build();

			updatedShifts.add(newNurseShift);
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

		requestRepository.findAllWardRequestsByYearMonth(member.getWardMember().getWard(),
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
