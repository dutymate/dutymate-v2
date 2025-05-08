package net.dutymate.api.domain.calendar.controller;

import net.dutymate.api.domain.calendar.dto.CalendarRequest;
import net.dutymate.api.domain.calendar.dto.CalendarResponse;
import net.dutymate.api.domain.calendar.service.CalendarService;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/duty/my/calendar")
public class CalendarController {

	private final CalendarService calendarService;

	@GetMapping
	public List<CalendarResponse> getCalendarsByDate(@RequestParam String date) {
		return calendarService.getCalendarsByDate(LocalDate.parse(date));
	}

	@GetMapping("/{calendarId}")
	public CalendarResponse getCalendarById(@PathVariable Long calendarId) {
		return calendarService.getCalendar(calendarId);
	}

	@PostMapping
	public CalendarResponse createCalendar(@RequestBody CalendarRequest request) {
		System.out.println("캘린더 생성 요청 들어옴 : " + request);
		return calendarService.createCalendar(request);
	}

	@PutMapping("/{calendarId}")
	public CalendarResponse updateCalendar(@PathVariable Long calendarId, @RequestBody CalendarRequest request) {
		return calendarService.updateCalendar(calendarId, request);
	}

	@DeleteMapping("/{calendarId}")
	public void deleteCalendar(@PathVariable Long calendarId) {
		calendarService.deleteCalendar(calendarId);
	}
}
