package net.dutymate.api.domain.wardschedules.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.wardschedules.dto.AllWardDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.EditDutyRequestDto;
import net.dutymate.api.domain.wardschedules.dto.MyDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.TodayDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.WardScheduleResponseDto;
import net.dutymate.api.domain.wardschedules.service.WardScheduleService;
import net.dutymate.api.global.auth.annotation.Auth;
import net.dutymate.api.global.entity.Member;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/duty")
@RequiredArgsConstructor
public class WardScheduleController {

	private final WardScheduleService wardScheduleService;

	@GetMapping
	public ResponseEntity<?> getWardSchedule(
		@Auth Member member,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month,
		@RequestParam(required = false) Integer history) {
		WardScheduleResponseDto wardScheduleResponseDto =
			wardScheduleService.getWardSchedule(member, new YearMonth(year, month), history);
		return ResponseEntity.ok(wardScheduleResponseDto);
	}

	@PutMapping
	public ResponseEntity<?> editWardSchedule(
		@Auth Member member,
		@RequestBody List<EditDutyRequestDto> editDutyRequestDtoList
	) {
		WardScheduleResponseDto wardScheduleResponseDto =
			wardScheduleService.editWardSchedule(member, editDutyRequestDtoList);
		return ResponseEntity.ok(wardScheduleResponseDto);
	}

	@GetMapping("/my")
	public ResponseEntity<?> getMyDuty(
		@Auth Member member,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month
	) {
		MyDutyResponseDto myDutyResponseDto = wardScheduleService.getMyDuty(member, new YearMonth(year, month));
		return ResponseEntity.ok(myDutyResponseDto);
	}

	@GetMapping("/my/date")
	public ResponseEntity<?> getTodayDuty(
		@Auth Member member,
		@RequestParam Integer year,
		@RequestParam Integer month,
		@RequestParam Integer date
	) {
		TodayDutyResponseDto todayDutyResponseDto = wardScheduleService.getTodayDuty(member, year, month, date);
		return ResponseEntity.ok(todayDutyResponseDto);
	}

	@GetMapping("/ward")
	public ResponseEntity<?> getAllWardDuty(@Auth Member member) {
		AllWardDutyResponseDto allWardDutyResponseDto = wardScheduleService.getAllWardDuty(member);
		return ResponseEntity.ok(allWardDutyResponseDto);
	}

	@PostMapping("/reset")
	public ResponseEntity<?> resetWardDuty(@Auth Member member,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		YearMonth yearMonth = new YearMonth(year, month);
		wardScheduleService.resetWardSchedule(member, yearMonth);
		return ResponseEntity.ok().build();
	}
}
