package net.dutymate.api.domain.member.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.member.service.LoginLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/log")
public class LoginLogController {

	private final LoginLogService loginLogService;

	// 어제 날짜의 로그인 로그를 S3에 저장 - 매일 자정 실행
	@PostMapping("/login")
	public ResponseEntity<?> batchLoginLogs() {
		String uploadedUrl = loginLogService.batchLoginLogs();
		return ResponseEntity.ok(uploadedUrl);
	}
}
