package net.dutymate.api.domain.rule.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.rule.dto.RuleResponseDto;
import net.dutymate.api.domain.rule.dto.RuleUpdateRequestDto;
import net.dutymate.api.domain.rule.service.RuleService;
import net.dutymate.api.global.auth.annotation.Auth;
import net.dutymate.api.global.entity.Member;

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
