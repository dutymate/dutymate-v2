package net.dutymate.api.domain.calendar.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import net.dutymate.api.domain.calendar.entity.Calendar;
import net.dutymate.api.domain.member.Member;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CalendarRequestDto {

	@Size(max = 30, message = "일정은 최대 30자까지만 입력 가능합니다.")
	private String title;
	private String place;
	@Size(max = 6, message = "색상코드는 6자리까지만 입력 가능합니다.")
	private String color;
	private Boolean isAllDay;
	private LocalDate date;
	private LocalDateTime startTime; // nullable
	private LocalDateTime endTime;   // nullable

	public Calendar toCalendar(Member member) {
		return Calendar.builder()
			.member(member)
			.title(title)
			.place(place)
			.color(color)
			.isAllDay(isAllDay)
			.date(date)
			.startTime(startTime)
			.endTime(endTime)
			.build();
	}
}
