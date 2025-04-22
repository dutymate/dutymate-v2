# TIL

날짜 : 2025-04-22 (화)

 <br>

## 이메일 인증 기능을 구현하라

### 1. GOOGLE SMTP 설정하기

1-1) 의존성 추가

<br>

구글 SMTP를 사용하기 위해 의존성을 주입한다.

```gradle
    implementation 'org.springframework.boot:spring-boot-starter-mail'
```

<br>

1-2) application.yaml 파일 설정

구글 계정 설정 -> 앱 비밀번호에서 앱 키 번호를 발급한 뒤, yaml로 설정해준다.

```yaml
# GOOGLE MAIL SMTP 설정
mail:
  host: ${GOOGLE_SMTP_HOST}
  port: ${GOOGLE_SMTP_PORT}
  username: ${GOOGLE_SMTP_USERNAME}
  password: ${GOOGLE_SMTP_PASSWORD}
  properties:
    mail:
      smtp:
        auth: true
        timeout: ${GOOGLE_SMTP_TIMEOUT}
        starttls:
          enable: true
```

env 파일에서 해당 값들을 가져올 경우, bean에서 찾을 수 없다는 에러가 뜨는데 이는 intellij 일부 오류로 확인된다.
이를 해결하기 위해서는 application.yaml 파일에 설정 파일을 추가하여도 된다.

<br><br>

### 2. 이메일로 인증 코드 보내기

Controller를 통해 인증 코드를 보낼 이메일을 받아오면, 해당 메일로 인증코드를 생성하게 보낸다.

```java
// 이메일로 인증 코드 보내기
	public void sendCode(SendCodeRequestDto sendCodeRequestDto) {

		String code = generateCode();
		sendEmail(sendCodeRequestDto.email(), code);
		saveCodeToRedis(sendCodeRequestDto.email(), code);
	}
```

2-1) 이메일로 인증 코드 보내기

- 6자리의 숫자 랜덤 코드 만들기
- 숫자코드를 담아서 메일로 message 보내기

<br>

메세지를 보내기 위해서는 text만 보내는 방식과 html 코드로 보내는 방식이 있다.

<br>

첫 번째 시도로 텍스트로만 메세지를 보내는 방법이 구현해보았다.

`SimpleMailMessage`를 활용하면 텍스트를 담아서 메일을 보낸다.

```java
SimpleMailMessage message = new SimpleMailMessage();

message.setTo(email);
message.setSubject(TITLE);
message.setText(text);
```

하지만 텍스트로만 인증 코드를 전달할 경우, 서비스에 대한 신뢰성이 떨어질 수 있으므로 조금 더 성의 있는 인증 코드 구현 방식을 생각해보았다.

단순 텍스트 메일보다 HTML 형태가 사용자 경험 측면에서 더 신뢰감을 주며, 향후 마케팅 이메일 확장 시에도 유용하다고 판단되어 HTML 형식을 채택하였다.

`MimeMessage`를 활용하여 HTML 코드 형태로 작성하여 HTML 형태 그대로 message를 보내는 방법이다.

```java
// HTML 형태로 메세지 보내기
MimeMessage mimeMessage = mailSender.createMimeMessage();
MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, false, "utf-8");

mimeMessageHelper.setTo(email);
mimeMessageHelper.setSubject(subject);
mimeMessageHelper.setText(htmlContent, true); // true : HTML 메일로 전송

mailSender.send(mimeMessage);
```

이를 통해 보낸 실제 인증 코드 메일은 다음과 같다.

![https://file.notion.so/f/f/b5e9c3b3-b372-4ed7-9136-622c310b6aeb/55284447-1540-4ffd-999b-bb1a5f11de6f/image.png?table=block&id=1dde783c-8bfc-80a1-bf7c-ff8a2142688d&spaceId=b5e9c3b3-b372-4ed7-9136-622c310b6aeb&expirationTimestamp=1745352000000&signature=N4Ms9w4tScvJTg3aWw1X7CdHQcj686Sy1Rzvkwd_BX4&downloadName=image.png](https://file.notion.so/f/f/b5e9c3b3-b372-4ed7-9136-622c310b6aeb/55284447-1540-4ffd-999b-bb1a5f11de6f/image.png?table=block&id=1dde783c-8bfc-80a1-bf7c-ff8a2142688d&spaceId=b5e9c3b3-b372-4ed7-9136-622c310b6aeb&expirationTimestamp=1745352000000&signature=N4Ms9w4tScvJTg3aWw1X7CdHQcj686Sy1Rzvkwd_BX4&downloadName=image.png)

<br>

2-2) Redis에 유효 시간 동안 저장하기

이렇게 생성된 코드는 이메일을 보냄과 동시에 Redis에 저장하고, 유효 시간(5분)이 지난 후 자동으로 삭제한다.

이를 통해 인증 코드가 만료가 되었는지, 일치하지 않은 코드가 들어왔는지 유효성 검증을 진행할 수 있다.

```java
// 유효시간 동안 Redis에 코드 저장하기
	private void saveCodeToRedis(String email, String code) {

		redisTemplate.opsForValue().set(EMAIL_CODE_PREFIX + email, code, EXPIRE_MINUTES, TimeUnit.MINUTES);
	}
```

<br>

인증 코드는 휘발성이 강한 데이터이므로, 빠른 읽기/쓰기와 TTL(Time To Live) 설정이 가능한 Redis를 사용하였다. 인증 코드의 유효 시간은 보안성과 사용자 편의성을 고려하여 5분으로 설정하였으며, 인증 완료 여부는 회원가입 완료까지 확인이 필요하므로 30분 동안 유지되도록 구성하였다.

<br><br>

### 3. 인증 코드 유효성 검사하기

이후 발송된 메일의 인증 코드를 입력하면 코드의 유효성 검사를 진행한다.

```java
public EmailVerificationResult verifyCode(VerifyCodeRequestDto verifyCodeRequestDto) {
		String key = EMAIL_CODE_PREFIX + verifyCodeRequestDto.email();
		String code = redisTemplate.opsForValue().get(key);

		// Redis에 저장된 코드가 없는 경우 == 유효 시간 만료
		if (code == null) {
			return EmailVerificationResult.CODE_EXPIRED;
		}

        // Redis에 저장된 코드와 다른 코드일 경우 == 유효하지 않은 코드
		if (!code.equals(verifyCodeRequestDto.code())) {
			return EmailVerificationResult.CODE_INVALID;
		}

		// 인증 성공 후 Redis에서 삭제 후, -> true 반환
		redisTemplate.delete(key);

		// 인증 완료 상태를 Redis에 저장 -> 회원가입 버튼 클릭 시, Redis에서 인증되었는지 안 되었는지 확인
		String verfiedEmail = "email:verified:" + verifyCodeRequestDto.email();
		redisTemplate.opsForValue().set(verfiedEmail, "true", 30, TimeUnit.MINUTES);

		return EmailVerificationResult.SUCCESS;
	}
```

<br>

인증 코드 검증 과정에서 예외(Exception)를 바로 던지기보다는, `EmailVerificationResult` enum으로 상태를 구분해 명시적으로 처리하였다. 이는 controller에서 다양한 응답 케이스를 명확히 분기하고, 클라이언트 측에서도 결과를 쉽게 구분하여 사용자에게 피드백할 수 있게 하기 위함이다.

<br>

```java
@PostMapping("/email-verification/confirm")
	public ResponseEntity<?> sendCodeToEmailConfirm(@RequestBody VerifyCodeRequestDto verifyCodeRequestDto) {
		EmailVerificationResult result = emailService.verifyCode(verifyCodeRequestDto);

		return switch (result) {
			case SUCCESS -> ResponseEntity.ok().build();
			case CODE_EXPIRED -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "만료된 인증 코드입니다.");
			case CODE_INVALID -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 코드가 일치하지 않습니다");
		};
	}
```
