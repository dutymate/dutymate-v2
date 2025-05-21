# TIL: 브라우저 탭 전환 시 React 타이머가 멈추는 문제 해결하기

## 문제 상황

React 애플리케이션에서 `setInterval`을 사용한 타이머 기능을 구현했는데, 사용자가 브라우저 탭을 전환하면 타이머가 멈추는 문제가 발생했다. 이 타이머는 이메일 인증 코드의 유효 시간을 표시하는 용도로 사용되는데, 백엔드 Redis에 해당 인증 토큰이 5분간 저장되기 때문에 프론트엔드의 타이머도 정확하게 작동할 필요가 있었다.

```javascript
// 문제가 있는 코드
useEffect(() => {
  if (!authCodeSent || timer <= 0) return;
  const interval = setInterval(() => {
    setTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setAuthCodeExpired(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, [authCodeSent, timer]);
```

## 원인

브라우저는 성능 최적화와 배터리 절약을 위해 백그라운드 탭(비활성 탭)에서 JavaScript 타이머 함수의 실행 주기를 조절한다. 특히 Chrome 같은 브라우저는 비활성 탭에서 `setInterval`과 `setTimeout`의 최소 간격을 1초 이상으로 제한하거나 실행을 지연시킨다.

이러한 브라우저의 동작으로 인해 단순히 1초마다 카운트를 감소시키는 방식의 타이머는 백그라운드 탭에서 정확하게 작동하지 않는다.

## 해결 방법

실제 경과 시간을 `Date.now()`로 계산하는 방식으로 타이머 로직을 변경한다:

```javascript
useEffect(() => {
  if (!authCodeSent || timer <= 0) return;
  
  const startTime = Date.now();
  const expectedEndTime = startTime + timer * 1000;
  
  const interval = setInterval(() => {
    const currentTime = Date.now();
    const remainingTime = Math.max(0, Math.ceil((expectedEndTime - currentTime) / 1000));
    
    setTimer(remainingTime);
    
    if (remainingTime <= 0) {
      clearInterval(interval);
      setAuthCodeExpired(true);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [authCodeSent, timer]);
```

## 핵심 개선 사항

1. **실제 시간 기반 계산**: 단순한 카운트다운 대신 실제 경과 시간을 계산하여 타이머 값을 설정
2. **시작 시간 저장**: 타이머가 시작될 때의 시간을 저장하고, 현재 시간과의 차이를 계산
3. **예상 종료 시간 계산**: 시작 시간 + 초기 타이머 값으로 정확한 종료 시간을 계산

## 주의사항

React의 의존성 규칙에 따라 `timer` 변수를 useEffect의 의존성 배열에 포함시키는 것이 중요하다. 의존성에서 제외하면 타이머가 0이 되었을 때의 로직이 제대로 실행되지 않을 수 있다.

## 대안적인 방법

`requestAnimationFrame`을 사용하는 방법도 있지만, 여기서는 `setInterval`과 실제 시간 기반 계산 방식이 더 간단하고 적합했다.

## 배운 점

1. 브라우저는 백그라운드 탭에서 타이머 함수의 동작을 최적화한다
2. 정확한 시간 측정이 필요한 경우 상대적인 카운트다운보다 절대적인 시간 계산 방식이 더 신뢰할 수 있다
3. React에서 타이머를 구현할 때는 실제 경과 시간을 기준으로 계산하는 것이 좋다
4. React의 의존성 규칙을 잘 이해하고 올바르게 적용하는 것이 중요하다
5. 백엔드 시스템(이 경우 Redis)의 타임아웃 설정과 프론트엔드의 타이머를 일관되게 유지하는 것이 중요하다