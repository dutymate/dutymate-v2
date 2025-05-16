package net.dutymate.api.domain.wardschedules.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import net.dutymate.api.domain.calendar.Calendar;
import net.dutymate.api.domain.common.utils.YearMonth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyDutyResponseDto {

	private Integer year;
	private Integer month;
	private String prevShifts;
	private String nextShifts;
	private String shifts;
	private CalendarData calendar;

	public static MyDutyResponseDto of(
		YearMonth yearMonth, String prevShifts, String nextShifts, String shifts, CalendarData calendar) {
		return MyDutyResponseDto.builder()
			.year(yearMonth.year())
			.month(yearMonth.month())
			.prevShifts(prevShifts)
			.nextShifts(nextShifts)
			.shifts(shifts)
			.calendar(calendar)
			.build();
	}

	@Data
	public static class CalendarData {
		private List<CalendarEvent> prevCalendar;
		private List<CalendarEvent> currCalendar;
		private List<CalendarEvent> nextCalendar;

	}

	@Data
	@Builder
	public static class CalendarEvent {
		private LocalDate date;
		private String title;
		private String color;
		private Boolean isAllDay;
		private LocalDateTime startTime;
		private LocalDateTime endTime;

		public static CalendarEvent from(Calendar calendar) {
			return CalendarEvent.builder()
				.date(calendar.getDate())
				.title(calendar.getTitle())
				.color(calendar.getColor())
				.isAllDay(calendar.getIsAllDay())
				.startTime(calendar.getStartTime())
				.endTime(calendar.getEndTime())
				.build();
		}
	}
}
