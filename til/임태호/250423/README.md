# Today I Learned

> 2025년 04월 23일 임태호

## 1. MR 코드 리뷰된 내용 반영

### 제안 내용
1. 자주 사용되는 변수와 매직 넘버를 상수화
2. 천 단위 이상의 숫자는 _로 구분 (ex. 1_000)

### 수정 사항
1. 데모 계정의 경우 아이디는 항상 "~~~@dutymate.demo"로 하는 등 고정적인 값이 들어간다.
2. 그래서 고정적으로 들어가는 아이디 값이나 비밀번호 값 등은 private static final로 최상단에서 상수처리 하였다.

```java
// 기존 코드
public LoginResponseDto demoLogin() {
    final String demoEmail = StringGenerator.generateRandomString() + "@dutymate.demo";
    final String demoPassword = "qwer1234!";
    final String demoName = "데모계정";
    SignUpRequestDto signUpRequestDto = SignUpRequestDto.builder()
        .email(demoEmail)
        .password(demoPassword)
        .passwordConfirm(demoPassword)
        .name(demoName)
        .build();
}
```
```java
// 개선 코드
private static final String DEMO_EMAIL_SUFFIX = "@dutymate.demo";
private static final String DEMO_PASSWORD = "qwer1234!";
private static final String DEMO_NAME = "데모계정";
public LoginResponseDto demoLogin() {
    SignUpRequestDto signUpRequestDto = SignUpRequestDto.builder()
        .email(StringGenerator.generateRandomString() + DEMO_EMAIL_SUFFIX)
        .password(DEMO_PASSWORD)
        .passwordConfirm(DEMO_PASSWORD)
        .name(DEMO_NAME)
        .build();
}
```
3. 레디스로 한번에 가져오는 키의 개수를 기존 1000개였으나 구분자(_) 없이 적었음 -> 가독성 저하 문제가 있었다.
```java
// 기존 코드
ScanOptions options = ScanOptions.scanOptions().match(DEMO_MEMBER_PREFIX + "*").count(1000).build();
```
```java
// 개선 코드
ScanOptions options = ScanOptions.scanOptions().match(DEMO_MEMBER_PREFIX + "*").count(1_000).build();
```

## 2. 특정 상황에서 회원 탈퇴가 안되던 오류 해결

### 문제 상황
- 병동에 본인과 임시 간호사만 있는 경우 -> 탈퇴가 불가능 했음

### 해결 방안
- 병동에 임시 간호사만 있는 경우, 임시 간호사와 본인 모두 탈퇴 처리 하면 해결 가능하다.
- 병동에 임시 간호사만 있는지 확인하기 위해 `hasOtherUser` 변수를 추가하고 사용하였다.

```java
// 기존 코드
if (!hasOtherHN) {
    ward.removeWardMember(member.getWardMember());
    memberRepository.delete(member);
    deleteWardMemberInMongo(member, ward);
}
```
```java
// 수정 코드
// HN이 있으면 나만 병동에서 삭제
if (hasOtherHN) {
    ward.removeWardMember(member.getWardMember());
    memberRepository.delete(member);
    deleteWardMemberInMongo(member, ward);
} else if (hasOtherUser) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 멤버에게 관리자 권한 부여 후, 탈퇴가 가능합니다.");
} else { // !hasOtherHN && !hasOtherUser => 병동에 임시간호사만 있는 경우
    // 임시 간호사 탈퇴 로직
    for (WardMember wardMember : wardMemberList) {
        memberRepository.delete(wardMember.getMember());
    }
    wardScheduleRepository.deleteByWardId(ward.getWardId());
    wardRepository.delete(ward);
}
```
