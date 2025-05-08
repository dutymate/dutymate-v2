package net.dutymate.api.domain.holiday.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.holiday.dto.HolidayResponseDto;
import net.dutymate.api.domain.holiday.service.HolidayService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/holiday")
@RequiredArgsConstructor
public class HolidayController {

	private final HolidayService holidayService;

	@Value("${api.holiday.secret}")
	private String apiHolidaySecret;

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

	@PutMapping("/update")
	public ResponseEntity<?> updateHolidays(@RequestHeader(value = "X-API-KEY", required = false) String apiKey) {
		if (apiKey == null || !apiKey.equals(apiHolidaySecret)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid API Key");
		}
		final int currentYear = LocalDate.now().getYear();
		holidayService.updateYearHolidays(currentYear);
		holidayService.updateYearHolidays(currentYear + 1);
		return ResponseEntity.ok().build();
	}
}
