# Today I Learned

> 2025년 04월 22일 이재현

## 스파게티 코드의 리팩토링 전략: ShiftAdminTable 컴포넌트 분석

### 스파게티 코드란?
스파게티 코드는 구조가 복잡하고 얽혀있어 이해하기 어려운 코드를 의미한다. 마치 스파게티 면처럼 코드의 흐름이 엉켜있어 유지보수와 확장이 어려워지는 특징을 가진다. 대규모 애플리케이션이나 시간이 지남에 따라 여러 개발자가 관여한 프로젝트에서 흔히 발생한다.

### ShiftAdminTable 컴포넌트 분석
ShiftAdminTable 컴포넌트는 간호사 근무표를 관리하는 복잡한 UI를 구현했다. 이 컴포넌트는 다음과 같은 스파게티 코드의 특징을 보여준다:

1. **과도한 길이**: 1700줄이 넘는 코드로 한 파일에 너무 많은 기능이 포함되어 있다.
2. **상태 관리의 복잡성**: 여러 상태값이 서로 얽혀 있어 데이터 흐름을 추적하기 어렵다.
3. **반복되는 코드**: 비슷한 패턴의 코드가 여러 곳에서 중복된다.
4. **조건부 렌더링의 중첩**: 복잡한 조건부 렌더링으로 UI 로직이 이해하기 어렵다.

### 스파게티 코드 해결 전략

#### 1. 컴포넌트 분리 (Component Extraction)
현재 코드에서 이미 시도한 방법으로, `DutyCell` 컴포넌트를 별도로 분리했다. 이를 더 확장하여 다음과 같이 컴포넌트를 분리할 수 있다:

```jsx
// 더 작은 단위로 컴포넌트 분리 예시
const TableHeader = ({ daysInMonth, year, month }) => { /* ... */ };
const NurseRow = ({ nurse, duties, selected, /* ... */ }) => { /* ... */ };
const StatisticsRow = ({ dutyCounts, type, /* ... */ }) => { /* ... */ };
```

이렇게 하면:
- 각 컴포넌트의 책임이 명확해진다
- 코드 가독성이 향상된다
- 테스트와 유지보수가 용이해진다

#### 2. 커스텀 훅 사용 (Custom Hooks)
상태 관리 로직을 커스텀 훅으로 분리하여 관심사를 분리할 수 있다:

```jsx
// 상태 관리 로직을 훅으로 분리
function useDutyManagement(initialData, year, month) {
  const [duties, setDuties] = useState([]);
  // 근무 변경, 데이터 로딩 등의 로직...
  
  return { duties, handleShiftChange, /* ... */ };
}

// 키보드 이벤트 관리를 위한 훅
function useKeyboardNavigation(selectedCell, setSelectedCell, handleShiftChange) {
  useEffect(() => {
    // 키보드 이벤트 처리 로직...
  }, [selectedCell, handleShiftChange]);
}
```

#### 3. 상태 관리 라이브러리 활용
현재 코드는 이미 `useShiftStore`를 사용하고 있지만, 일부 로컬 상태가 많이 사용되고 있다. 더 많은 상태를 전역 저장소로 이동시키면 컴포넌트 간 데이터 흐름이 단순해진다.

#### 4. 모바일/데스크톱 뷰 분리
현재 코드는 모바일과 데스크톱 뷰를 조건부 렌더링으로 관리하고 있어 코드가 복잡해진다. 이를 별도 컴포넌트로 분리하면 더 관리하기 쉬워진다:

```jsx
const ShiftAdminTable = (props) => {
  // 공통 로직, 상태 등...
  
  return (
    <>
      <MobileView {...commonProps} />
      <DesktopView {...commonProps} />
    </>
  );
};
```

#### 5. 유틸리티 함수 분리
반복되는 로직을 별도의 유틸리티 함수로 분리한다:

```jsx
// util/shiftUtils.js
export const calculateDutyCounts = (duties) => {
  // 근무 카운트 계산 로직...
};

export const getHighlightClass = (row, col, selectedCell) => {
  // 셀 하이라이트 로직...
};
```

### 리팩토링 후 얻을 수 있는 이점

1. **코드 가독성 향상**: 각 컴포넌트와 함수가 단일 책임을 갖게 되어 코드의 흐름을 쉽게 이해할 수 있다.
2. **유지보수성 개선**: 기능별로 코드가 분리되어 특정 부분만 수정하기 쉬워진다.
3. **재사용성 증가**: 추출된 컴포넌트와 함수를 다른 부분에서도 활용할 수 있다.
4. **테스트 용이성**: 작은 단위로 분리된 코드는 테스트하기 쉽다.
5. **협업 효율성**: 여러 개발자가 동시에 다른 컴포넌트를 작업할 수 있다.

### 결론
스파게티 코드는 시간이 지남에 따라 자연스럽게 발생할 수 있다. 중요한 것은 코드가 복잡해질 때 적절한 시점에 리팩토링을 통해 구조를 개선하는 것이다. 컴포넌트 분리, 커스텀 훅 활용, 유틸리티 함수 추출 등의 방법으로 코드의 품질을 지속적으로 관리할 수 있다.
ShiftAdminTable 컴포넌트의 사례를 통해 복잡한 UI 컴포넌트를 어떻게 더 관리하기 쉬운 구조로 개선할 수 있는지 배웠다.