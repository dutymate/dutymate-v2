package net.dutymate.api.domain.payment.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.payment.dto.AutoGenCntResponseDto;
import net.dutymate.api.domain.payment.service.PaymentService;
import net.dutymate.api.global.auth.annotation.Auth;
import net.dutymate.api.global.entity.Member;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment")
public class PaymentController {

	private final PaymentService paymentService;

	@GetMapping
	public ResponseEntity<?> getAutoGenCnt(@Auth Member member) {

		AutoGenCntResponseDto autoGenCntResponseDto = paymentService.getAutoGenCnt(member);
		return ResponseEntity.ok(autoGenCntResponseDto);
	}

}
