## 회원 유형별 초기값 관리

## 문제 상황: 데이터베이스 NOT NULL 제약조건 오류

오늘 프로젝트에서 회원가입 기능을 구현하던 중 다음과 같은 오류가 발생했습니다:

```
2025-04-25T11:13:37.852+09:00 ERROR 34984 --- [nio-8080-exec-4] o.h.engine.jdbc.spi.SqlExceptionHelper : Column 'auto_gen_cnt' cannot be null
```

이는 데이터베이스의 `auto_gen_cnt` 컬럼에 NULL 값이 허용되지 않는데, NULL 값을 삽입하려고 했기 때문에 발생한 오류입니다.

## 원인 분석

코드를 분석해보니 다음과 같은 문제가 있었습니다:

1. `Member` 엔티티의 `auto_gen_cnt` 컬럼이 `@Column(nullable = false)`로 설정되어 있었습니다.
2. `SignUpRequestDto` 클래스에서 `autoGenCnt` 필드에 대한 명확한 기본값 설정이 없었습니다.
3. 특히 데모 로그인에서는 명시적으로 값을 3으로 설정했지만, 일반 로그인에서는 NULL이 될 가능성이 있었습니다.

## 해결 방법

### 1. DTO에서 상수를 사용한 기본값 설정

```java
@Data
@Builder
public class SignUpRequestDto {
    // 상수로 기본값 정의
    private static final Integer DEFAULT_AUTO_GEN_CNT = 5;
    
    // 필드들...
    
    public Member toMember(String defaultProfileImg) {
       return Member.builder()
          // ...
          .autoGenCnt(DEFAULT_AUTO_GEN_CNT)  // 항상 기본값 사용
          .build();
    }
}
```

### 2. 소셜 로그인(구글, 카카오 등)에서도 동일한 패턴 적용

```java
@Data
public class GoogleUserResponseDto {
    // 필드들...
    
    private static final Integer DEFAULT_AUTO_GEN_CNT = 5;
    
    public Member toMember(String defaultProfileImage) {
       return Member.builder()
          // ...
          .autoGenCnt(DEFAULT_AUTO_GEN_CNT)
          .build();
    }
}
```

### 3. 특수 케이스 처리 (데모 계정)

데모 계정은 별도의 상수를 사용하여 다른 값(3)을 설정했습니다:

```java
private static final Integer DEMO_AUTO_GEN_CNT = 3;

@Transactional
public LoginResponseDto demoLogin() {
    SignUpRequestDto signUpRequestDto = SignUpRequestDto.builder()
        // ...
        .autoGenCnt(DEMO_AUTO_GEN_CNT)  // 데모 계정은 3으로 설정
        .build();
    
    // ...
}
```

## 학습 포인트

1. **Null 안전성(Null Safety)**: 데이터베이스의 NOT NULL 제약조건과 Java 객체의 null 값 처리 간의 불일치는 런타임 오류를 발생시킬 수 있습니다. 이를 방지하기 위해 기본값을 명확히 설정하는 것이 중요합니다.

2. **상수 사용의 이점**:
   - 코드 가독성 향상 (매직 넘버 제거)
   - 일관성 유지
   - 유지보수 용이성 (한 곳에서 값을 변경하면 모든 곳에 적용)

3. **계층 간 데이터 변환 시 검증**: DTO에서 엔티티로 변환할 때 필수 필드에 대한 값이 제대로 설정되었는지 확인하는 것이 중요합니다.


## 결론

상태 관리는 애플리케이션의 안정성과 예측 가능성을 높이는 데 중요한 역할을 합니다. 특히 데이터베이스와 상호작용하는 부분에서는 null 값 처리와 기본값 설정에 주의해야 합니다. 

회원 유형별로 다른 초기값을 설정할 때는:
1. 유형별 값을 중앙에서 관리하여 일관성 유지
2. 설정 파일이나 상수를 활용하여 변경 시 유지보수 용이성 확보
3. 열거형이나 전략 패턴 등 객체지향적 접근법 고려

이러한 방법을 통해 코드의 가독성, 유지보수성을 높이고, 데이터의 무결성을 보장할 수 있습니다.