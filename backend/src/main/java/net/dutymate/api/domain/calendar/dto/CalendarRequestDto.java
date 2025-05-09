package net.dutymate.api.domain.calendar.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import net.dutymate.api.domain.calendar.entity.Calendar;
import net.dutymate.api.domain.member.Member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
public class CalendarRequestDto {

	private String title;
	private String place;
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
