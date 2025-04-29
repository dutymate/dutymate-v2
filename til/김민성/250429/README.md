# TIL: React의 useEffect와 상태 관리 이해하기

- 오늘 timer 의 시간이 0초가 되었을 때, 새로고침을 해야 모달이 뜨는 현상이 발생했습니다. 해당 내용을 학습하고자 useEffect와 상태관리를 공부하여, 0초가 되었을 때 새로고침 없이 modal 이 뜨도록 설정했습니다.

## 1. useEffect란 무엇인가?

useEffect는 React 훅(Hook)의 하나로, 컴포넌트에서 "부수 효과(side effect)"를 수행할 수 있게 해줍니다. 부수 효과란 데이터 가져오기, 타이머 설정, 이벤트 구독 같은 외부와의 상호작용을 말합니다.

```jsx
useEffect(() => {
  // 실행할 코드
}, [의존성 배열]);
```

## 2. 의존성 배열의 역할

의존성 배열은 useEffect가 언제 실행될지 결정하는 중요한 요소입니다:

- **빈 배열 `[]`**: 컴포넌트가 처음 화면에 나타날 때(마운트될 때)만 한 번 실행됩니다.
  ```jsx
  useEffect(() => {
    console.log("컴포넌트가 화면에 나타났습니다!");
  }, []);
  ```

- **의존성 있는 배열 `[값1, 값2]`**: 컴포넌트가 마운트될 때와 배열 안의 값이 변경될 때마다 실행됩니다.
  ```jsx
  useEffect(() => {
    console.log("count가 변경되었습니다:", count);
  }, [count]);
  ```

- **의존성 배열 생략**: 컴포넌트가 마운트될 때와 업데이트될 때마다 실행됩니다(거의 모든 렌더링마다).
  ```jsx
  useEffect(() => {
    console.log("컴포넌트가 업데이트되었습니다!");
  });
  ```

## 3. 상태(State) 관리와 useState

useState는 컴포넌트에서 변경 가능한 상태를 관리하는 훅입니다:

```jsx
const [timeLeft, setTimeLeft] = useState(600); // 초기값 600초
```

- `timeLeft`: 현재 상태 값
- `setTimeLeft`: 상태를 업데이트하는 함수

## 4. 함수형 업데이트와 prev

상태를 업데이트할 때 이전 상태 값을 기반으로 계산이 필요한 경우, 함수형 업데이트를 사용합니다:

```jsx
// 일반 업데이트
setTimeLeft(timeLeft - 1);

// 함수형 업데이트 (더 안전한 방법)
setTimeLeft(prev => prev - 1);
```

여기서 `prev`는 현재 상태의 최신 값을 나타내는 매개변수입니다. 함수형 업데이트는 이전 상태에 의존하는 업데이트를 여러 번 할 때 더 안정적입니다.

## 5. 타이머 구현 예제 분석

### 문제 상황
타이머가 특정 시간(590초)에 도달했을 때 모달을 표시하려고 하는데, 새로고침을 해야만 모달이 나타나는 문제가 있었습니다.

### 원인
첫 번째 useEffect에서 조건을 확인했지만, 이 useEffect는 컴포넌트 마운트 시에만 실행되기 때문에 타이머가 실시간으로 변할 때 조건을 확인하지 못했습니다.

```jsx
// 문제가 있던 코드
useEffect(() => {
  // 초기 설정 로직
  const remaining = 60 * 10 - elapsedSeconds;
  
  if (remaining <= 590) { // 이 조건은 마운트 시에만 확인됨!
    setShowTimeoutModal(true);
  } else {
    setTimeLeft(remaining);
  }
}, [isDemo]); // isDemo만 의존성으로 가짐
```

### 해결책
실시간으로 타이머 값을 확인하는 두 번째 useEffect 내부의 setTimeLeft 함수에서 조건을 확인하도록 변경했습니다:

```jsx
// 해결된 코드
useEffect(() => {
  if (!isDemo || timeLeft <= 0) return;
  
  const interval = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 590) { // 매초마다 이 조건이 확인됨!
        clearInterval(interval);
        setShowTimeoutModal(true);
        return prev;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(interval);
}, [isDemo, timeLeft]); // timeLeft 변화에 반응
```

## 6. useEffect 정리(Cleanup) 함수

useEffect는 정리 함수를 반환할 수 있습니다. 이 함수는 컴포넌트가 언마운트되거나 다음 이펙트가 실행되기 전에 호출됩니다:

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    // 타이머 로직
  }, 1000);
  
  // 정리 함수: 메모리 누수 방지
  return () => clearInterval(timer);
}, []);
```

정리 함수는 메모리 누수를 방지하는 데 중요합니다. 특히 타이머나 이벤트 리스너와 같은 리소스를 사용할 때 반드시 정리해주어야 합니다.

## 7. 핵심 요약

1. **useEffect 실행 시점**은 의존성 배열에 의해 결정됩니다.
2. **상태 업데이트**는 즉시 일어나지만, 화면 갱신은 다음 렌더링에서 발생합니다.
3. **함수형 업데이트**(`prev => {...}`)는 이전 상태에 의존하는 업데이트를 안전하게 처리합니다.
4. **의존성 배열 설계**는 컴포넌트의 올바른 동작과 성능에 중요합니다.
5. **정리 함수**로 타이머나 이벤트 리스너와 같은 리소스를 해제해야 합니다.

오늘 배운 내용을 통해 React에서 타이머 같은 부수 효과를 다룰 때 useEffect와 상태 관리의 중요성을 이해할 수 있었습니다. 의존성 배열을 올바르게 설정하고 함수형 업데이트를 활용하면 더 안정적인 React 애플리케이션을 구축할 수 있습니다.
