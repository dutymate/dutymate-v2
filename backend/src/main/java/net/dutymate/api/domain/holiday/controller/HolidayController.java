package net.dutymate.api.domain.holiday.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.holiday.dto.HolidayResponseDto;
import net.dutymate.api.domain.holiday.service.HolidayService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/holiday")
@RequiredArgsConstructor
public class HolidayController {

	private final HolidayService holidayService;

	@GetMapping
	public ResponseEntity<?> getHolidaysByYearAndMonth(
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {

		try {
			HolidayResponseDto response = holidayService.getHolidayByYearAndMonth(year, month);
			return ResponseEntity.ok(response);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(null);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(null);
		}
	}
}
