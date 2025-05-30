package net.dutymate.api.domain.payment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.payment.dto.AddAutoGenCntResponseDto;
import net.dutymate.api.domain.payment.dto.AutoGenCntResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

	private static final int DEFAULT_ADD_GEN_COUNT = 100;

	public AutoGenCntResponseDto getAutoGenCnt(Member member) {
		return new AutoGenCntResponseDto(member.getAutoGenCnt());
	}

	public AddAutoGenCntResponseDto addAutoGenCnt(Member member) {
		member.updateAutoGenCnt(DEFAULT_ADD_GEN_COUNT);
		return new AddAutoGenCntResponseDto(member.getAutoGenCnt());
	}
}
