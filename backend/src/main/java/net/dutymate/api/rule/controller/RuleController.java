package net.dutymate.api.rule.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.entity.Member;
import net.dutymate.api.rule.dto.RuleResponseDto;
import net.dutymate.api.rule.dto.RuleUpdateRequestDto;
import net.dutymate.api.rule.service.RuleService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RuleController {

	private final RuleService ruleService;

	@GetMapping("/ward/rule")
	public ResponseEntity<RuleResponseDto> getRule(@Auth Member member) {
		RuleResponseDto ruleResponseDto = ruleService.getRule(member);
		return ResponseEntity.ok(ruleResponseDto);
	}

	@PutMapping("/ward/rule")
	public ResponseEntity<?> updateRule(@Auth Member member,
		@RequestBody RuleUpdateRequestDto ruleUpdateRequestDto) {
		ruleService.updateRule(ruleUpdateRequestDto, member);
		return ResponseEntity.ok().build();
	}

}
