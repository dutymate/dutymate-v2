package net.dutymate.api.domain.member.service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.dto.SendCodeRequestDto;
import net.dutymate.api.domain.member.dto.VerifyCodeRequestDto;
import net.dutymate.api.global.enums.EmailVerificationResult;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

	private final JavaMailSender mailSender;

	private final RedisTemplate<String, String> redisTemplate;

	private static final long EXPIRE_MINUTES = 5;
	private static final String EMAIL_CODE_PREFIX = "email:code:";
	private static final String TITLE = "[듀티메이트] 이메일 인증 코드 발송 안내";
	private static final String TEXT_PREFIX = "아래 인증 코드를 복사 후 입력해주세요. \n인증코드:  ";

	// 이메일로 인증 코드 보내기
	public void sendCode(SendCodeRequestDto sendCodeRequestDto) {
		String code = generateCode();
		sendEmail(sendCodeRequestDto.email(), code);
		saveCodeToRedis(sendCodeRequestDto.email(), code);
	}

	private String generateCode() {
		Random random = new Random();
		return String.format("%06d", random.nextInt(1000000)); // 6자리 랜덤 숫자 만들기
	}

	private void sendEmail(String email, String code) {
		String text = TEXT_PREFIX + code;

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(email);
		message.setSubject(TITLE);
		message.setText(text);
		try {
			mailSender.send(message);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메일 전송 실패");
		}
	}

	// 유효시간 동안 Redis에 코드 저장하기
	private void saveCodeToRedis(String email, String code) {
		redisTemplate.opsForValue().set(
			EMAIL_CODE_PREFIX + email,
			code,
			EXPIRE_MINUTES,
			TimeUnit.MINUTES
		);
	}

	public EmailVerificationResult verifyCode(VerifyCodeRequestDto verifyCodeRequestDto) {
		String key = EMAIL_CODE_PREFIX + verifyCodeRequestDto.email();
		String code = redisTemplate.opsForValue().get(key);

		// Redis에 저장된 코드가 없거나 다르면 false 반환
		if (code == null) {
			return EmailVerificationResult.CODE_EXPIRED;
		}

		if (!code.equals(verifyCodeRequestDto.code())) {
			return EmailVerificationResult.CODE_INVALID;
		}

		// 인증 성공 후 Redis에서 삭제 후 true 반환
		redisTemplate.delete(key);
		return EmailVerificationResult.SUCCESS;
	}
}
