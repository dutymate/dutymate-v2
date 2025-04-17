package net.dutymate.api.records;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public record YearMonth(Integer year, Integer month) {
	// 레코드 생성 시 year 또는 month가 null이면 현재 날짜 기준으로 레코드가 생성
	public YearMonth(Integer year, Integer month) {
		if (year == null || month == null) {
			LocalDateTime now = LocalDateTime.now();
			this.year = now.getYear();
			this.month = now.getMonthValue();
		} else {
			this.year = year;
			this.month = month;
		}
	}

	public int daysInMonth() {
		return java.time.YearMonth.of(year, month).lengthOfMonth();
	}

	public String initializeShifts() {
		return "X".repeat(daysInMonth());
	}

	public YearMonth prevYearMonth() {
		int prevYear = (month == 1) ? year - 1 : year;
		int prevMonth = (month == 1) ? 12 : month - 1;
		return new YearMonth(prevYear, prevMonth);
	}

	public YearMonth nextYearMonth() {
		int nextYear = (month == 12) ? year + 1 : year;
		int nextMonth = (month == 12) ? 1 : month + 1;
		return new YearMonth(nextYear, nextMonth);
	}

	public static YearMonth nowYearMonth() {
		LocalDateTime now = LocalDateTime.now();
		return new YearMonth(now.getYear(), now.getMonthValue());
	}

	//주말 여부 판단 메서드
	public Map<Integer, Boolean> getWeekendDays() {
		// 해당 월의 첫날 구하기
		LocalDate firstDay = LocalDate.of(year, month, 1);

		// 해당 월의 마지막 날 구하기
		LocalDate lastDay = firstDay.withDayOfMonth(
			firstDay.lengthOfMonth()
		);

		// 결과를 저장할 Map (날짜 -> 주말여부)
		Map<Integer, Boolean> weekendMap = new HashMap<>();

		// 첫날부터 마지막날까지 순회
		LocalDate currentDate = firstDay;
		while (!currentDate.isAfter(lastDay)) {
			DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
			boolean isWeekend = dayOfWeek == DayOfWeek.SATURDAY
				|| dayOfWeek == DayOfWeek.SUNDAY;

			weekendMap.put(currentDate.getDayOfMonth(), isWeekend);
			currentDate = currentDate.plusDays(1);
		}

		return weekendMap;
	}

	public int weekDaysInMonth() {
		int weekDaysInMonth = 0;
		for (int day = 1; day <= daysInMonth(); day++) {
			if (getWeekendDays().get(day)) {
				continue;
			}
			weekDaysInMonth++;
		}
		return weekDaysInMonth;
	}

	public boolean isWeekend(int day) {
		return getWeekendDays().get(day);
	}

	public int weekendDaysInMonth() {
		return daysInMonth() - weekDaysInMonth();
	}
}
