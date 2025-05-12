# Today I Learned

> 2025년 05월 12일

# MySHift.tsx Blink 오류 방지 처리 

#  `MyShift.tsx`에서 blink(깜빡임) 오류 방지 전략

근무표 페이지에서 데이터를 비동기로 불러오는 과정에서 UI가 깜빡이거나 렌더링이 깨져 보이는 문제를 막기 위해 `MyShift.tsx`에서는 다음과 같은 두 가지 방식으로 blink 오류를 방지하고 있습니다.


## 1. `setLoading(false)`로 비동기 상태 명확화

비동기로 월간 근무 데이터를 불러오는 `fetchMyDuty` 함수에서, 로딩 상태를 명확히 관리하여 깜빡이는 UI를 방지합니다.

###  관련 코드

```tsx
useLoadingStore.getState().setLoading(true);

try {
  const data = await dutyService.getMyDuty(...);
  setMyDutyData(data);
  // ...
  useLoadingStore.getState().setLoading(false);
} catch (error) {
  useLoadingStore.getState().setLoading(false);
  navigate('/error');
}
```

### 설명

* 데이터를 요청할 때 `setLoading(true)`로 로딩 상태를 시작합니다.
* 데이터를 모두 불러온 후 `setLoading(false)`로 상태를 초기화하여,
* **데이터가 준비되지 않은 상태에서 UI가 먼저 렌더링되는 것을 방지**합니다.


## 2. 조건부 렌더링으로 불완전한 렌더 방지

날짜 선택 후 상세 근무표 모달(`TodayShiftModal`)은 다음 조건을 만족할 때만 렌더링됩니다.

###  관련 코드

```tsx
{selectedDate && dayDutyData ? (
  <TodayShiftModal ... />
) : (
  <div className="...">날짜를 클릭하면 상세 근무표가 표시됩니다.</div>
)}
```

###  설명
* `selectedDate`와 `dayDutyData`가 모두 존재해야만 모달을 렌더링합니다.
* 이 조건을 통해:

  * 불완전한 데이터로 인한 깜빡임을 방지하고,
  * 사용자 경험(UX)을 안정적으로 유지할 수 있습니다.



