package net.dutymate.api.domain.calendar.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarRequest {
	private String title;
	private String place;
	private String color;
	private Boolean isAllDay;
	private LocalDateTime startTime; // nullable
	private LocalDateTime endTime;   // nullable

	// Getter/Setter, 생성자 등
}
