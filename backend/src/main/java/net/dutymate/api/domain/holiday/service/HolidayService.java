package net.dutymate.api.domain.holiday.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import net.dutymate.api.domain.holiday.Holiday;
import net.dutymate.api.domain.holiday.dto.HolidayResponseDto;
import net.dutymate.api.domain.holiday.repository.HolidayRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HolidayService {
	private final HolidayRepository holidayRepository;

	public HolidayResponseDto getHolidayByYearAndMonth(Integer year, Integer month) {
		// year나 month가 null인 경우 현재 날짜로 설정
		if (year == null || month == null) {
			LocalDateTime now = LocalDateTime.now();
			year = year != null ? year : now.getYear();
			month = month != null ? month : now.getMonthValue();
		}

		// date 필드를 사용한 조회 메서드 사용
		List<Holiday> holidays = holidayRepository.findHolidaysInMonth(year, month);
		return HolidayResponseDto.from(year, month, holidays);
	}
}
