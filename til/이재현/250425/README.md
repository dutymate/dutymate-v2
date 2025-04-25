# Today I Learned

> 2025년 04월 25일 이재현

# 웹 개발의 코드 구조화와 비동기 처리 방법

---

## 1. 효율적인 코드 구조: 레이어별 역할 분담

코드의 유지보수성과 확장성을 위해 각 레이어별로 다음과 같이 역할을 분리하는 것이 좋다.

### 서비스 레이어: API 통신 담당

- API 통신과 관련된 순수한 데이터 요청/응답 처리를 담당한다.
- 기본적인 에러 핸들링 (401, 404 등 HTTP 에러)을 처리한다.
- 타입 정의 및 인터페이스 관리를 한다.

### 컴포넌트 레이어: UI 로직 담당

- UI 관련 validation (필수 입력 확인, 형식 검증 등)을 처리한다.
- 사용자 인터랙션에 대한 즉각적인 피드백을 제공한다.
- 재사용 가능한 UI 로직을 포함한다.

### 페이지 레이어: 비즈니스 로직 담당

- 복잡한 비즈니스 로직을 구현한다.
- 여러 컴포넌트간의 상태 관리를 담당한다.
- 페이지 수준의 데이터 조작 및 가공을 처리한다.
- 라우팅 관련 로직을 다룬다.

## 2. 코드 예시: 역할 분리의 실제 구현

```tsx
// pages/TeamShift.tsx - 복잡한 비즈니스 로직 처리
const TeamShift = () => {
  const handleDutyUpdate = async (data: DutyUpdateRequest) => {
    // 데이터 가공 및 validation
    if (!isValidDutyData(data)) {
      return;
    }

    try {
      await dutyService.updateDuty(data);
      // 성공 처리
    } catch (error) {
      // 에러 처리
    }
  };

  return <TeamShiftTable onUpdate={handleDutyUpdate} />;
};

// components/organisms/TeamShiftTable.tsx - UI 관련 처리
const TeamShiftTable = ({ onUpdate }) => {
  // UI 관련 validation
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!value.match(/^[DENO]$/)) {
      setError('올바른 근무 타입을 입력해주세요');
      return;
    }
    // 처리 로직
  };

  return (/* UI 컴포넌트 */);
};

// services/dutyService.ts - API 요청 처리
export const dutyService = {
  updateDuty: (data: DutyUpdateRequest) => {
    return axiosInstance.put("/duty", data)
      .then(response => response.data)
      .catch(handleApiError);
  }
};
```

## 3. 역할 분리의 주요 이점

1. **관심사의 분리로 인한 유지보수성 향상**
   - 각 레이어가 자신의 책임에 집중한다.
   - 코드의 유지보수성이 향상된다.
   - 테스트가 용이해진다.

2. **컴포넌트 재사용성 증가**
   - 컴포넌트 레벨의 validation은 여러 페이지에서 재사용할 수 있다.
   - 서비스 로직은 여러 컴포넌트에서 일관되게 사용할 수 있다.

3. **새로운 기능 추가의 용이성**
   - 새로운 기능 추가가 용이하다.
   - 각 레이어별 독립적인 확장이 가능하다.

4. **문제 해결의 효율성**
   - 문제 발생 시 해당 레이어만 확인하면 된다.
   - 명확한 책임 분리로 버그 추적이 쉽다.

---

## 4. Promise: 현대적 비동기 처리의 핵심

Promise는 자바스크립트에서 비동기 작업을 처리하는 객체다. 미래에 완료될 작업의 결과를 나타내며, 성공(resolve)하거나 실패(reject)할 수 있다. "약속"이라고 생각하면 된다 - "나중에 이 작업이 끝나면 결과를 줄게요"라는 약속이다.

### Promise 기반 API 호출 예시

```tsx
// Promise를 반환하는 방식
getMyDuty: (year?: number, month?: number) => {
    return axiosInstance.get("/duty/mobile/my-duty", { params: { year, month } })
        .then(response => response.data)  // 성공하면 이 데이터를 줄게요
        .catch(error => {                 // 실패하면 이렇게 처리할게요
            if (error.response?.status === 401) {
                window.location.href = '/login';
            }
            throw error;
        });
}

// 사용하는 쪽 (컴포넌트)에서
// 방법 1: then/catch 사용
dutyService.getMyDuty(2024, 3)
    .then(data => {
        console.log("근무 데이터:", data);  // 성공했을 때
    })
    .catch(error => {
        console.error("에러 발생:", error);  // 실패했을 때
    });

// 방법 2: async/await 사용 (더 깔끔한 방식)
async function loadDutyData() {
    try {
        const data = await dutyService.getMyDuty(2024, 3);
        console.log("근무 데이터:", data);  // 성공했을 때
    } catch (error) {
        console.error("에러 발생:", error);  // 실패했을 때
    }
}
```

### 전통적 콜백 vs 현대적 Promise 비교

```tsx
// 콜백 방식
getMyDuty: (
    year: number,
    month: number,
    success: (data: any) => void,  // 성공시 실행할 함수
    fail: (error: any) => void     // 실패시 실행할 함수
) => {
    axiosInstance.get("/duty/mobile/my-duty", { params: { year, month } })
        .then(success)
        .catch(fail);
}

// 사용하는 쪽에서
dutyService.getMyDuty(
    2024,
    3,
    (data) => console.log("근무 데이터:", data),    // 성공 콜백
    (error) => console.error("에러 발생:", error)   // 실패 콜백
);
```

### 복잡한 비동기 처리: 콜백 지옥 vs Promise 체인

여러 비동기 작업을 순차적으로 처리할 때 차이가 뚜렷하게 나타난다:

```tsx
// 1. 콜백 방식 (콜백 지옥)
dutyService.getMyDuty(2024, 3,
    (dutyData) => {
        wardService.getWardInfo(
            (wardData) => {
                userService.submitAdditionalInfo(
                    { grade: 1, gender: "F", role: "RN" },
                    (userInfo) => {
                        // 너무 깊어지고 복잡해짐
                    },
                    (error) => console.error(error)
                );
            },
            (error) => console.error(error)
        );
    },
    (error) => console.error(error)
);

// 2. Promise 방식 (async/await 사용)
async function loadAllData() {
    try {
        const dutyData = await dutyService.getMyDuty(2024, 3);
        const wardData = await wardService.getWardInfo();
        const userInfo = await userService.submitAdditionalInfo({
            grade: 1,
            gender: "F",
            role: "RN"
        });
        // 훨씬 깔끔하고 읽기 쉬움
    } catch (error) {
        console.error("에러 발생:", error);
    }
}
```

## 5. Promise가 콜백보다 나은 이유

1. **가독성: 코드 흐름을 명확하게 표현**
   - 비동기 작업의 흐름을 선형적으로 표현할 수 있어 읽기가 쉽다.
   - 콜백 중첩으로 인한 "콜백 지옥"을 피할 수 있다.

2. **에러 처리: 중앙집중식 예외 관리**
   - 중앙집중식 에러 처리가 가능하다.
   - try/catch 구문을 통해 동기 코드와 유사한 방식으로 에러를 처리할 수 있다.

3. **제어 흐름: 복잡한 비동기 흐름 관리**
   - `Promise.all()`을 사용하여 여러 비동기 작업을 병렬로 실행할 수 있다.
   - `Promise.race()`를 사용하여 여러 작업 중 가장 빨리 완료되는 작업을 처리할 수 있다.

4. **문법 개선: async/await으로 동기식 코드처럼**
   - 비동기 작업을 동기 코드처럼 읽고 쓸 수 있어 직관적이다.
   - 비동기 코드의 복잡성을 줄여 디버깅이 쉬워진다.

5. **타입 안정성: TypeScript와의 뛰어난 호환성**
   - Promise는 제네릭 타입을 지원하여 비동기 작업의 결과 타입을 정확히 지정할 수 있다.
   - 예: `Promise<User[]>`와 같이 반환 타입을 명확하게 정의할 수 있다.
   - 콜백 기반 API에 비해 타입 추론이 더 정확하게 작동한다.
   - 콜백에서는 각 콜백 함수의 매개변수 타입을 개별적으로 정의해야 하지만, Promise는 체인 전체에서 타입 정보가 유지된다.

이러한 이유로 현대 웹 개발에서는 콜백보다 Promise 패턴을 사용하는 것이 권장된다.

