package net.dutymate.api.domain.member.service;

import java.util.Optional;
import java.util.Random;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.EmailVerificationResult;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.Provider;
import net.dutymate.api.domain.member.dto.PasswordResetRequestDto;
import net.dutymate.api.domain.member.dto.SendCodeRequestDto;
import net.dutymate.api.domain.member.dto.VerifyCodeRequestDto;
import net.dutymate.api.domain.member.repository.MemberRepository;

import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

	private static final long EXPIRE_MINUTES = 5;
	private static final String EMAIL_CODE_PREFIX = "email:code:";
	private static final String TITLE = "[듀티메이트] 이메일 인증 코드 발송 안내";
	private final JavaMailSender mailSender;
	private final RedisTemplate<String, String> redisTemplate;
	private final MemberRepository memberRepository;

	// 이메일로 인증 코드 보내기
	public void sendCode(SendCodeRequestDto sendCodeRequestDto, String path) {
		String email = sendCodeRequestDto.email();
		// 이메일이 @dutymate.demo로 끝나는지 확인
		if (email.toLowerCase().endsWith(MemberService.DEMO_EMAIL_SUFFIX)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 이메일은 사용할 수 없습니다.");
		}

		Optional<Member> optionalMember = memberRepository.findMemberByEmail(email);

		if (optionalMember.isPresent()) {
			Member existingMember = optionalMember.get();
			Provider provider = existingMember.getProvider();
			boolean isVerified = existingMember.getIsVerified();

			// 로그인 요청인 경우
			if ("login".equals(path)) {
				if (provider == Provider.NONE && !isVerified) {
					// 일반 로그인 + 인증되지 않음 → 인증 코드 전송 허용
					// → 그냥 통과 (아래 코드 전송 로직으로 진행)
					// return;
				} else {
					// 인증이 이미 된 일반 사용자 or 소셜 로그인 사용자
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 인증된 계정입니다. 로그인해주세요.");
				}
			} else if ("signup".equals(path)) {
				// 회원가입 요청인 경우
				// 이미 있는 사용자의 경우
				String message = switch (provider) {
					case KAKAO -> "카카오 계정으로 회원가입된 이메일입니다. 카카오 로그인을 이용해주세요.";
					case GOOGLE -> "구글 계정으로 회원가입된 이메일입니다. 구글 로그인을 이용해주세요.";
					case NONE -> "이미 가입된 이메일입니다.";
				};
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);

			} else if ("reset".equals(path)) {

				if (provider == Provider.GOOGLE) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "구글 계정으로 회원가입된 이메일입니다.");
				} else if (provider == Provider.KAKAO) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카카오 계정으로 회원가입된 이메일입니다.");
				}

			} else {
				// 예외: path 값이 login/signup이 아닌 경우
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 요청입니다.");
			}
		}

		// 인증 코드 생성 및 전송
		String code = generateCode();
		sendEmail(email, code);
		saveCodeToRedis(email, code);
	}

	private String generateCode() {
		Random random = new Random();
		return String.format("%06d", random.nextInt(1000000)); // 6자리 랜덤 숫자 만들기
	}

	private void sendEmail(String email, String code) {
		String subject;
		String htmlContent;

		subject = "듀티메이트 이메일 인증";
		htmlContent = """
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>듀티메이트 이메일 인증</title>
			</head>
			<body style="margin: 0; padding: 20px; background-color: #f9f9f9;
			font-family: 'Apple SD Gothic Neo', sans-serif;">
				<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 500px;
				margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 10px;">
					<tr>
						<td style="padding: 30px; text-align: center;">
							<h2 style="color: #333333; font-size: 20px;">이메일 인증 요청</h2>
							<p style="color: #555555; font-size: 16px;">듀티메이트 회원가입을 위해 아래 인증코드를
							입력해주세요.</p>
							<div style="margin: 30px auto; padding: 20px; background-color: #f0f8ff;
							border-radius:8px;
							border: 2px #4a90e2; display: inline-block;">
								<span style="font-size: 24px; font-weight: bold; color: #4a90e2;">%s</span>
							</div>
							<p style="color: #999999; font-size: 12px; margin-top: 20px;">인증 코드는 발송 시점부터 5분간
							유효합니다.</p>
							<p style="color: #999999; font-size: 12px;">만약 본인이 요청한 것이 아니라면 이 이메일을
							무시하셔도
							됩니다.</p>
							<p style="color: #bbbbbb; font-size: 12px; margin-top: 20px;">&copy; Dutymate.</p>
						</td>
					</tr>
				</table>
			</body>
			</html>
			""".formatted(code);

		try {
			// HTML 형태로 메세지 보내기
			MimeMessage mimeMessage = mailSender.createMimeMessage();
			MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, false, "utf-8");

			mimeMessageHelper.setTo(email);
			mimeMessageHelper.setSubject(subject);
			mimeMessageHelper.setText(htmlContent, true); // true : HTML 메일로 전송

			mailSender.send(mimeMessage);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메일 전송 실패");
		}
	}

	// 유효시간 동안 Redis에 코드 저장하기
	private void saveCodeToRedis(String email, String code) {
		redisTemplate.opsForValue().set(EMAIL_CODE_PREFIX + email, code, EXPIRE_MINUTES, TimeUnit.MINUTES);
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

		// 인증 완료 상태를 Redis에 저장 -> 회원가입 버튼 클릭 시, Redis에서 인증되었는지 안 되었는지 확인
		String verfiedEmail = "email:verified:" + verifyCodeRequestDto.email();
		redisTemplate.opsForValue().set(verfiedEmail, "true", 30, TimeUnit.MINUTES);

		return EmailVerificationResult.SUCCESS;
	}

	public void resetPassword(@Valid PasswordResetRequestDto passwordResetRequestDto) {
		String email = passwordResetRequestDto.email();

		// 회원 조회
		Member member = memberRepository.findMemberByEmail(email)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 이메일로 등록된 계정이 없습니다."));

		// 비밀번호 업데이트
		member.updatePassword(passwordResetRequestDto.password());
		memberRepository.save(member);
	}
}
