package net.dutymate.api.domain.autoschedule.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.request.repository.RequestRepository;
import net.dutymate.api.domain.rule.Rule;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.WorkIntensity;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;
import net.dutymate.api.domain.wardschedules.repository.WardScheduleRepository;

import lombok.Builder;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleGenerateService {

	private final WardScheduleRepository wardScheduleRepository;
	private final RequestRepository requestRepository;

	public void generateSchedule(YearMonth yearMonth, Member member) {

		Ward ward = member.getWardMember().getWard();
		Rule rule = ward.getRule();
		Map<Long, String> prevSchedule = getPrevMonthShiftPatterns(ward.getWardId(), yearMonth);
		List<WardMember> wardMemberList = ward.getWardMemberList();
		List<NurseInfo> targetNurseList = convertToNurse(wardMemberList, prevSchedule);

		List<Request> shiftRequests = requestRepository.findAcceptedWardRequestsByYearMonth(
			ward,yearMonth.year(), yearMonth.month(), RequestStatus.ACCEPTED);

	}

	/**
	 * 이전 달의 근무 스케줄에서 마지막 4일간의 근무 패턴을 조회합니다.
	 * 연속된 근무 패턴을 고려한 스케줄 생성에 활용됩니다.
	 *
	 * @param wardId 병동 ID
	 * @param yearMonth 현재 연월 정보
	 * @return 간호사 ID를 키로, 이전 달 마지막 4일간의 근무 패턴을 값으로 하는 맵
	 */
	private Map<Long, String> getPrevMonthShiftPatterns(Long wardId, YearMonth yearMonth) {
		Map<Long, String> result = new HashMap<>();
		YearMonth prevYearMonth = yearMonth.prevYearMonth();

		// 이전 달 스케줄 조회
		WardSchedule prevWardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
				wardId, prevYearMonth.year(), prevYearMonth.month())
			.orElse(null);

		// 이전 달 스케줄이 없는 경우 빈 맵 반환
		if (prevWardSchedule == null) {
			return result;
		}

		int idx = prevWardSchedule.getNowIdx();
		List<WardSchedule.NurseShift> shifts = prevWardSchedule.getDuties().get(idx).getDuty();
		int days = prevYearMonth.daysInMonth();

		for (WardSchedule.NurseShift shift : shifts) {

			String shiftPattern = shift.getShifts();
			result.put(shift.getMemberId(), shiftPattern.substring(shiftPattern.length() - 4));

		}

		return result;
	}

	private List<NurseInfo> convertToNurse(List<WardMember> wardMembers, Map<Long, String> prevSchedule) {

		return wardMembers.stream()
			.map(wm -> {
				Long memberId = wm.getMember().getMemberId();
				String prevShifts = prevSchedule == null
					? "XXXX" : prevSchedule.getOrDefault(memberId, "XXXX");

				return NurseInfo.builder()
					.memberId(memberId)
					.prevShifts(prevShifts)
					.shiftFlags(wm.getShiftFlags())
					.workIntensity(wm.getWorkIntensity())
					.build();
			})
			.toList();
	}

	@Builder
	private static class NurseInfo {

		private Long memberId;
		private String prevShifts;
		private Integer shiftFlags;
		private WorkIntensity workIntensity;

	}

}
