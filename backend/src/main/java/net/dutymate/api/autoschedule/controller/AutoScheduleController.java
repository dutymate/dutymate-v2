package net.dutymate.api.autoschedule.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.autoschedule.service.AutoScheduleService;
import net.dutymate.api.entity.Member;
import net.dutymate.api.records.YearMonth;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/duty/auto-create")
@RequiredArgsConstructor
public class AutoScheduleController {

	private final AutoScheduleService autoScheduleService;

	@GetMapping
	public ResponseEntity<?> autoCreate(
		@RequestParam(value = "year", required = false) Integer year,
		@RequestParam(value = "month", required = false) Integer month,
		@Auth Member member) {

		return autoScheduleService.generateAutoSchedule(new YearMonth(year, month), member);
	}

}
