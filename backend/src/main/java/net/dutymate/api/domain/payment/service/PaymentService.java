package net.dutymate.api.domain.payment.service;

import org.springframework.stereotype.Service;

import net.dutymate.api.domain.payment.dto.AutoGenCntResponseDto;
import net.dutymate.api.global.entity.Member;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

	public AutoGenCntResponseDto getAutoGenCnt(Member member) {

		int autoGenCnt = member.getAutoGenCnt();

		return new AutoGenCntResponseDto(autoGenCnt);
	}

}
