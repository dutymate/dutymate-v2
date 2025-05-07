package net.dutymate.api.domain.wardschedules.util;

import java.util.ArrayList;
import java.util.List;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;

public class PreviousScheduleGenerator {

	/**
	 * 이전 달의 마지막 4일에 대한 근무 일정을 생성합니다.
	 *
	 * @param ward 병동 정보
	 * @param wardMembers 병동 소속 간호사 리스트
	 * @param prevYearMonth 이전 달 년월 정보
	 * @return 생성된 이전 달 근무 일정
	 */
	public static WardSchedule createPreviousMonthSchedule(Ward ward,
		List<WardMember> wardMembers, YearMonth prevYearMonth) {
		int daysInMonth = prevYearMonth.daysInMonth();
		int startDay = daysInMonth - 4; // 마지막 4일 (마지막 날 포함)

		List<WardSchedule.NurseShift> nurseShifts = new ArrayList<>();

		// 각 간호사별 근무 일정 생성
		for (WardMember wardMember : wardMembers) {
			char[] shifts = prevYearMonth.initializeShifts().toCharArray();

			// 마지막 4일에 대한 근무 패턴 설정
			// 간호사 ID에 따라 다양한 패턴 부여
			Long memberId = wardMember.getMember().getMemberId();
			ShiftType shiftType = wardMember.getShiftType();

			if (shiftType == ShiftType.N) {
				// 야간 전담 간호사 패턴 (9, 10번 간호사)
				if (memberId % 2 == 0) {
					// 짝수 ID: NOOO
					shifts[startDay] = 'N';
					shifts[startDay + 1] = 'O';
					shifts[startDay + 2] = 'O';
					shifts[startDay + 3] = 'O';
				} else {
					// 홀수 ID: ONNN
					shifts[startDay] = 'O';
					shifts[startDay + 1] = 'N';
					shifts[startDay + 2] = 'N';
					shifts[startDay + 3] = 'N';
				}
			} else if (shiftType == ShiftType.M) {
				// 수간호사 근무 패턴 (평일 주간, 주말 휴무)
				for (int i = 0; i < 4; i++) {
					int day = startDay + i;
					shifts[day] = prevYearMonth.isWeekend(day + 1) ? 'O' : 'M';
				}
			} else {
				// 일반 간호사 패턴 - 간호사 ID에 따라 다양한 패턴 부여
				switch (memberId.intValue() % 8) {
					case 0: // DEEO
						shifts[startDay] = 'D';
						shifts[startDay + 1] = 'E';
						shifts[startDay + 2] = 'E';
						shifts[startDay + 3] = 'O';
						break;
					case 1: // OEOD
						shifts[startDay] = 'O';
						shifts[startDay + 1] = 'E';
						shifts[startDay + 2] = 'O';
						shifts[startDay + 3] = 'D';
						break;
					case 2: // NNOE
						shifts[startDay] = 'N';
						shifts[startDay + 1] = 'N';
						shifts[startDay + 2] = 'O';
						shifts[startDay + 3] = 'E';
						break;
					case 3: // EONN
						shifts[startDay] = 'E';
						shifts[startDay + 1] = 'O';
						shifts[startDay + 2] = 'N';
						shifts[startDay + 3] = 'N';
						break;
					case 4: // OOEE
						shifts[startDay] = 'O';
						shifts[startDay + 1] = 'O';
						shifts[startDay + 2] = 'E';
						shifts[startDay + 3] = 'E';
						break;
					case 5: // ODDD
						shifts[startDay] = 'O';
						shifts[startDay + 1] = 'D';
						shifts[startDay + 2] = 'D';
						shifts[startDay + 3] = 'D';
						break;
					case 6: // DDOO
						shifts[startDay] = 'D';
						shifts[startDay + 1] = 'D';
						shifts[startDay + 2] = 'O';
						shifts[startDay + 3] = 'O';
						break;
					case 7: // EODO
						shifts[startDay] = 'E';
						shifts[startDay + 1] = 'O';
						shifts[startDay + 2] = 'D';
						shifts[startDay + 3] = 'O';
						break;
				}
			}

			// NurseShift 객체 생성 및 리스트 추가
			nurseShifts.add(WardSchedule.NurseShift.builder()
				.memberId(memberId)
				.shifts(new String(shifts))
				.build());
		}

		// 히스토리 생성
		WardSchedule.History history = WardSchedule.History.builder()
			.memberId(0L) // 시스템에 의해 생성됨을 의미
			.name("system")
			.before("X")
			.after("X")
			.modifiedDay(0)
			.isAutoCreated(true)
			.build();

		// 이전 달 듀티 생성
		WardSchedule.Duty prevDuty = WardSchedule.Duty.builder()
			.idx(0) // 첫 번째 듀티
			.duty(nurseShifts)
			.history(history)
			.build();

		List<WardSchedule.Duty> duties = new ArrayList<>();
		duties.add(prevDuty);

		// 이전 달 스케줄 생성 및 반환
		return WardSchedule.builder()
			.wardId(ward.getWardId())
			.year(prevYearMonth.year())
			.month(prevYearMonth.month())
			.nowIdx(0) // 현재 인덱스는 0
			.duties(duties)
			.build();
	}
}
