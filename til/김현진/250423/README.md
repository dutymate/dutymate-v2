# TIL

날짜 : 2025-04-23 (수)

 <br>

## 기존 회원 가입 시, 이메일 인증 기능 로직을 추가하라

### 1. `isVerified` 컬럼 추가 (Entity + DB)

기존에 이메일 회원가입을 진행하였던 회원들의 경우, 이메일 인증 없이 서비스에 가입하는 문제가 있었다.
따라서 이 회원들이 가상의 이메일 (ex, qwer1234@gmail.com)과 같은 메일로 가입을 할 경우 실제 서비스를 이용하는 회원인지를 판단하기에 어려움이 있었다.
<br>
이를 해결하고자 기존 회원 데이터는 그대로 살려두되, 실제 사용자임을 판단하기 위해 추가로 이메일 인증을 받는 식으로 기능을 구현하였다.

#### 1-1) `Member` Entity 수정

```java
@Column(nullable = false)
private Boolean isVerified;
```

기본값은 false로 설정되므로, DB에 추가할 때도 이를 반영한다.

>

---

#### 1-2) SQL로 마이그레이션

사용자 member table에 이 유저가 이메일 인증이 된 유저인지 아닌지를 판단하기 위한 컬럼을 추가하였다.

```sql
ALTER TABLE member ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT FALSE;
```

---

<br>

### 2. 기존 사용자 데이터 업데이트

#### 2-1) provider 기반 업데이트 쿼리

이미 로그인한 사용자 중 Oauth 로그인을 진행한 사용자는 `true`로, 일반 이메일 로그인을 진행한 사용자는 `false`로 처리한다.

```sql
-- 이메일 인증된 SSO 로그인 사용자 처리
UPDATE member SET is_verified = TRUE WHERE provider IN ('KAKAO', 'GOOGLE');

-- 일반 가입자는 인증되지 않은 상태로 처리
UPDATE member SET is_verified = FALSE WHERE provider = 'NONE';
```

---

<br>

### 3. 회원가입 시 `isVerified` 자동 설정

#### 3-1) `@PrePersist`에 기본값 설정 추가

```java
@PrePersist
public void prePersist() {
	this.nickname = NicknameGenerator.generateNickname();
	this.createdAt = new Timestamp(System.currentTimeMillis());
	this.isActive = true;
	this.isVerified = true; // 신규 회원은 이메일 인증 완료 상태로 간주
}
```

---

<br>

### 4. 로그인 시 이메일 인증 상태 체크

#### 4-1) 일반 로그인 흐름에서 `isVerified` 검사 추가

```java
if (!member.getIsVerified()) {
	throw new EmailNotVerifiedException("이메일 인증을 진행해주세요", member.getMemberId());
}
```

> EmailNotVerifiedException 같은 커스텀 예외를 만들어서 memberId를 포함하고, 응답 바디에서 메시지와 함께 memberId를 리턴할 수도 있습니다.

<br>

#### 4-2) EmailNotVerifiedException 예외 처리

이메일 인증이 되었는지를 확인할 수 있는 예외처리 handler를 추가하고, 이를 `GlobalExceptionHandler`에 추가합니다.

```java
@Getter
public class EmailNotVerifiedException extends RuntimeException {
	private final Long memberId;

	public EmailNotVerifiedException(String message, Long memberId) {
		super(message);
		this.memberId = memberId;
	}
}
```

```java
// 이메일 인증 예외처리
	@ExceptionHandler(EmailNotVerifiedException.class)
	protected ResponseEntity<?> handleEmailNotVerifiedException(EmailNotVerifiedException ex) {
		final StackTraceElement source = getFirstRelevantStackTrace(ex);
		final String methodName = source.getMethodName();
		final String className = getSimpleClassName(source.getClassName());
		final String status = HttpStatus.UNAUTHORIZED.name();
		final String message = ex.getMessage();

		log.error(LINE_SEPARATOR);
		log.error(ERROR_LOG_START, methodName);
		log.error(CLASS_FORMAT, className);
		log.error(STATUS_FORMAT, status);
		log.error(MESSAGE_FORMAT, message);

		Map<String, Object> body = new HashMap<>();
		body.put(TIMESTAMP_KEY, LocalDateTime.now());
		body.put(STATUS_KEY, status);
		body.put(MESSAGE_KEY, message);
		body.put("memberId", ex.getMemberId());

		return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
	}
```

---

#### 4-3) 예외 응답 구조

```json
{
  "message": "이메일 인증을 진행해주세요.",
  "timestamp": "2025-04-23T12:32:12.7214542",
  "status": "UNAUTHORIZED",
  "memberId": 73
}
```

---

## 5. 인증 후 isVerified 변경 (PUT)

### 5-1) PUT API 예시

```

PUT /api/member/email-verification/{memberId}
```

```json
Request:
{
  "email": "koujie11@gmail.com", // 변경된 이메일로 업데이트 요청
}

```

### 5-2) Service 로직

```java
	// 인증된 이메일로 업데이트하기
	@Transactional
	public void verifyAndUpdateEmail(Long memberId,
		UpdateEmailVerificationRequestDto updateEmailVerificationRequestDto) {

        // 인증 완료 여부 확인하기
		String redisKey = "email:verified:" + updateEmailVerificationRequestDto.email();
		String verified = redisTemplate.opsForValue().get(redisKey);

		if (!"true".equals(verified)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증이 완료되지 않았습니다.");
		}

		// DB에 업데이트하기
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));

		// 인증된 이메일과 isVerified -> true로 update
		member.updateVerifiedEmail(updateEmailVerificationRequestDto.email());

		// 인증 상태 Redis에서 삭제하기
		redisTemplate.delete(redisKey);
	}
```

<br><br>

---

## 전체 흐름 요약

| 단계 | 설명                                                      |
| ---- | --------------------------------------------------------- |
| 1    | `is_verified` 컬럼 추가 + 마이그레이션                    |
| 2    | 기존 회원 데이터 업데이트 (provider 기반)                 |
| 3    | 회원가입 시 isVerified 기본값 설정                        |
| 4    | 로그인 시 `isVerified == false` 이면 에러 + memberId 응답 |
| 5    | 인증 완료 후 PUT 요청으로 상태 업데이트                   |

---

<br><br>

## 제안한 설계가 좋은 이유 by GPT

### 1. **기존 사용자 보존**

- 기존 회원 데이터를 삭제하지 않고 `isVerified`로 인증 상태만 구분하므로, **데이터 유실 없이** 점진적으로 이메일 인증 전환이 가능합니다.
- 마이그레이션 시에도 단순 `UPDATE` 쿼리로 처리되어 위험이 적습니다.

### 2. **SSO(provider) 구분 처리**

- `kakao`, `google`은 자체 인증을 거치므로 `isVerified = true`로 간주하는 것은 매우 타당합니다.
- `none`은 이메일 로그인 방식으로, 인증 과정을 별도로 요구하는 것도 올바른 판단입니다.

### 3. **로그인 흐름에 자연스럽게 녹아듦**

- 로그인 시 `isVerified`가 false면 인증 요구 → 사용자 입장에서 납득 가능
- 인증 후 다시 로그인 유도 → 보안적·UX적 측면 모두 괜찮음

### 4. **응답 구조도 실용적**

- `memberId`를 함께 넘기는 것은 나중에 이메일 인증 완료 요청(`PUT`) 때 다시 사용자 정보를 요청하지 않아도 되게 하기 때문에 **불필요한 DB 조회를 줄이고 UX도 부드럽습니다.**

---

<br><br>

## 추가로 고려해볼 수 있는 점 (선택 사항)

### 1. **비밀번호 없는 회원 처리**

- 혹시 SSO 회원 중 `password`가 null 또는 무의미한 값이면, 로그인 시 검증 로직에서 예외 처리가 필요합니다.
- 또는 SSO 회원에 대해 `password` 필드를 사용하지 않는 별도 구조도 고려할 수 있습니다.

### 2. **Redis 대신 DB 플래그로 인증 완료 체크**

- 지금은 Redis에 `"email:verified:{email}" = true"`로 저장하고 인증 완료를 임시로 판단하고 있는데,
- 인증이 완료되면 `Member.isVerified`만 true로 바꾸고, Redis는 사용하지 않아도 됩니다.

> isVerified가 완전히 이메일 인증 상태를 대체하면, Redis는 인증 코드 검증까지만 사용하는 구조로 충분합니다.

### 3. **인증 코드 만료나 실패 시 보안 대응**

- 인증 코드가 5회 이상 틀리면 잠금 등 추가 보안 정책 고려도 가능합니다 (ex: brute force 대응)
