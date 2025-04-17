package net.dutymate.api.rule.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Rule;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.rule.dto.RuleResponseDto;
import net.dutymate.api.rule.dto.RuleUpdateRequestDto;
import net.dutymate.api.rule.repository.RuleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuleService {

	private final RuleRepository ruleRepository;

	@Transactional
	public RuleResponseDto getRule(Member member) {

		WardMember wardMember = Optional.ofNullable(member)
			.map(Member::getWardMember)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속하지 않은 회원입니다."));

		return RuleResponseDto.of(wardMember.getWard().getRule());
	}

	@Transactional
	public void updateRule(RuleUpdateRequestDto ruleUpdateRequestDto, Member member) {

		WardMember wardMember = Optional.ofNullable(member)
			.map(Member::getWardMember)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속하지 않은 회원입니다."));

		Rule rule = wardMember.getWard().getRule();

		if (rule == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "규칙이 존재하지 않습니다.");
		}

		rule.update(ruleUpdateRequestDto);
	}
}
