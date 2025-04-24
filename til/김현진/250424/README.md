# TIL

날짜 : 2025-04-24 (목)

 <br>

## Login 페이지 step 상태 관리 및 에러 응답 처리 개선

### 📌 배경

로그인 페이지에서 인증되지 않은 사용자가 로그인 시도 시, 이메일 인증을 요구하는 LoginEmailVerificationForm으로 전환하고 싶었음

이때 step 상태를 전역 상태(Zustand)로 관리하고, 해당 상태에 따라 LoginForm ↔ LoginEmailVerificationForm을 조건 렌더링하려고 시도함

```ts
{
  step === "login" ? (
    <LoginForm onRequireVerification={handleRequireVerification} />
  ) : (
    <LoginEmailVerificationForm
      memberId={pendingMemberId!}
      email={pendingEmail}
      onSuccess={handleVerificationSuccess}
    />
  );
}
```

<br>

### 기존 문제

❗ 증상
LoginEmailVerificationForm → 인증 성공 → 다시 LoginForm으로 돌아오는 구조에서,

Login 페이지가 두 번 마운트되면서 step 값이 "login"으로 초기화되어 버리는 현상 발생

<br>

### 🔍 원인 분석

```ts
// 공통 axios 인터셉터 코드
(error) => {
  switch (error.response?.status) {
    case 401:
      localStorage.removeItem("token");
      window.location.href = "/login";
      break;
  }
};
```

백엔드에서 인증되지 않은 사용자에 대해 401 Unauthorized 응답을 주고 있었고,

클라이언트에서는 401 응답 시 `window.location.href = "/login"`으로 전체 페이지 리로드를 유발함

이로 인해 useEffect(() => setStep("login"))가 다시 실행되며 step 상태가 "login"으로 덮어쓰기되어 버림

<br>

### 해결 방법

#### 백엔드 수정

401 대신 400 Bad Request로 응답하도록 백엔드 로직을 수정:

인증되지 않은 계정(이메일 미인증)에 대해서는 BAD_REQUEST (400) 응답을 주고,

에러 메시지를 통해 클라이언트는 "verify"로 상태를 전환함

<br>

#### 클라이언트 로직 유지

```ts
const handleRequireVerification = (memberId: number, email: string) => {
  setPendingMemberId(memberId);
  setPendingEmail(email);
  setStep("verify"); // 이메일 인증 폼으로 전환
};

const handleVerificationSuccess = () => {
  setStep("login"); // 인증 성공 후 로그인 폼으로 복귀
};
```

페이지를 리로드하지 않고 상태만 전환함으로써 마운트 이슈 해결

<br>

### 📈 얻은 교훈

1. 상태 기반 페이지 전환 시 location.href를 직접 호출하는 것보다는 상태 전환 방식(useState/Zustand/Router)을 활용하는 것이 안정적이다.

2. 서버에서 보내는 응답 코드는 클라이언트의 동작에 큰 영향을 줄 수 있으므로, 정확한 의미의 HTTP 상태 코드 사용이 중요하다.
