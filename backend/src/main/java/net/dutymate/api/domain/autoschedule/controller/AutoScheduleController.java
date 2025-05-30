package net.dutymate.api.domain.autoschedule.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.autoschedule.dto.ReAutoScheduleRequestDto;
import net.dutymate.api.domain.autoschedule.service.AutoScheduleService;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.auth.annotation.Auth;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/duty")
@RequiredArgsConstructor
public class AutoScheduleController {

	private final AutoScheduleService autoScheduleService;

	@GetMapping("/auto-create")
	public ResponseEntity<?> autoCreate(
		@RequestParam(value = "year", required = false) Integer year,
		@RequestParam(value = "month", required = false) Integer month,
		@RequestParam(value = "force", required = false) boolean force,
		@Auth Member member) {

		return autoScheduleService.generateAutoSchedule(new YearMonth(year, month), member, force, null);
	}

	@PostMapping("/re-auto-create")
	public ResponseEntity<?> reAutoCreate(@Auth Member member,
		@RequestBody ReAutoScheduleRequestDto reAutoScheduleRequestDto) {

		return autoScheduleService.generateAutoSchedule(new YearMonth(reAutoScheduleRequestDto.getYear(),
				reAutoScheduleRequestDto.getMonth()), member,
			true, reAutoScheduleRequestDto.getRequestIds());
	}

}
