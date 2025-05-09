package net.dutymate.api.domain.calendar.dto;

import java.time.LocalDateTime;

import net.dutymate.api.domain.calendar.entity.Calendar;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalendarResponseDto {
	private Long calendarId;
	private String title;
	private String place;
	private String color;
	private Boolean isAllDay;
	private LocalDateTime startTime; // nullable
	private LocalDateTime endTime;   // nullable

	public static CalendarResponseDto of(Calendar calendar) {
		return CalendarResponseDto.builder()
			.calendarId(calendar.getCalendarId())
			.title(calendar.getTitle())
			.place(calendar.getPlace())
			.color(calendar.getColor())
			.isAllDay(calendar.getIsAllDay())
			.startTime(calendar.getStartTime())
			.endTime(calendar.getEndTime())
			.build();
	}
}
