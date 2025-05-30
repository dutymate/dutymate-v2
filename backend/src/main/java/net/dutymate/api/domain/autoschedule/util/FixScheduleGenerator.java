package net.dutymate.api.domain.autoschedule.util;

import java.util.Map;

import org.springframework.stereotype.Component;

import net.dutymate.api.domain.common.utils.YearMonth;

@Component
public class FixScheduleGenerator {

	/**
	 * 중간(Mid) 근무 일정을 생성합니다. 주말은 휴무(O)로, 평일은 M으로 설정합니다.
	 *
	 * @param yearMonth 연월 정보
	 * @return 생성된 중간 근무 일정 문자열
	 */
	public String midShiftBuilder(YearMonth yearMonth) {
		StringBuilder schedule = new StringBuilder();
		int daysInMonth = yearMonth.daysInMonth();

		for (int day = 1; day <= daysInMonth; day++) {
			schedule.append(yearMonth.isWeekend(day) ? 'O' : 'M');
		}

		return schedule.toString();
	}
}
