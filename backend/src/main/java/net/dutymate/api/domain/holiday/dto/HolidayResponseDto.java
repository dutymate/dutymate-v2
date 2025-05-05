package net.dutymate.api.domain.holiday.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import net.dutymate.api.domain.holiday.Holiday;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HolidayResponseDto {
	private int year;
	private int month;
	private List<HolidayDto> holidays;

	@Getter
	@Builder
	public static class HolidayDto {
		private int day;
		private String name;
		private LocalDate date;

		public static HolidayDto from(Holiday holiday) {
			return HolidayDto.builder()
				.day(holiday.getDay())
				.name(holiday.getName())
				.date(holiday.getDate())
				.build();
		}
	}

	public static HolidayResponseDto from(int year, int month, List<Holiday> holidays) {
		return HolidayResponseDto.builder()
			.year(year)
			.month(month)
			.holidays(holidays.stream()
				.map(HolidayDto::from)
				.collect(Collectors.toList()))
			.build();
	}
}
