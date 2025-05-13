package net.dutymate.api.domain.calendar;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import net.dutymate.api.domain.calendar.dto.CalendarRequestDto;
import net.dutymate.api.domain.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Calendar {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long calendarId;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "member_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Member member;

	@Column(nullable = false)
	private String title;

	private String place;

	@Column(nullable = false)
	private String color;

	@Column(nullable = false)
	private Boolean isAllDay;

	@Column(nullable = false)
	private LocalDate date;

	private LocalDateTime startTime;
	private LocalDateTime endTime;

	public void updateCalendar(CalendarRequestDto calendarRequestDto) {
		this.title = calendarRequestDto.getTitle();
		this.place = calendarRequestDto.getPlace();
		this.color = calendarRequestDto.getColor();
		this.isAllDay = calendarRequestDto.getIsAllDay();
		this.date = calendarRequestDto.getDate();
		this.startTime = calendarRequestDto.getStartTime();
		this.endTime = calendarRequestDto.getEndTime();
	}

}
