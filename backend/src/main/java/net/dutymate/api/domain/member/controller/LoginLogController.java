package net.dutymate.api.domain.member.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.service.LoginLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/log")
public class LoginLogController {

	private final LoginLogService loginLogService;

	@Value("${api.secret.key}")
	private String apiLogSecret;

	// 어제 날짜의 로그인 로그를 S3에 저장 - 매일 자정 실행
	@PostMapping("/login")
	public ResponseEntity<?> batchLoginLogs(@RequestHeader(value = "X-API-KEY", required = false) String apiKey) {
		if (apiKey == null || !apiKey.equals(apiLogSecret)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid API Key");
		}
		String uploadedUrl = loginLogService.batchLoginLogs();
		return ResponseEntity.ok(uploadedUrl);
	}
}
