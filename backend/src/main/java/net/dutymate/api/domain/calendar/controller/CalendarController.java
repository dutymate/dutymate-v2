package net.dutymate.api.domain.calendar.controller;

import net.dutymate.api.domain.calendar.dto.CalendarRequestDto;
import net.dutymate.api.domain.calendar.dto.CalendarResponseDto;
import net.dutymate.api.domain.calendar.service.CalendarService;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.auth.annotation.Auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/duty/my/calendar")
@RequiredArgsConstructor
public class CalendarController {

	private final CalendarService calendarService;

	@GetMapping
	public ResponseEntity<?> getCalendarsByDate(@Auth Member member, @RequestParam LocalDate date) {
		List<CalendarResponseDto> calendarResponsDtos = calendarService.getCalendarsByDate(member, date);
		return ResponseEntity.ok(calendarResponsDtos);
	}

	@GetMapping("/{calendarId}")
	public ResponseEntity<?> getCalendarById(@Auth Member member, @PathVariable Long calendarId) {
		CalendarResponseDto calendarResponseDto = calendarService.getCalendar(member, calendarId);
		return ResponseEntity.ok(calendarResponseDto);
	}

	@PostMapping
	public ResponseEntity<?> createCalendar(@Auth Member member, @RequestBody CalendarRequestDto request) {
		calendarService.createCalendar(member, request);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/{calendarId}")
	public ResponseEntity<?> updateCalendar(
		@Auth Member member, @PathVariable Long calendarId, @RequestBody CalendarRequestDto request) {
		calendarService.updateCalendar(member, calendarId, request);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{calendarId}")
	public void deleteCalendar(@Auth Member member, @PathVariable Long calendarId) {
		calendarService.deleteCalendar(member, calendarId);
	}
}
