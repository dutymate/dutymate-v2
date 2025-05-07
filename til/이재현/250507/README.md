# Today I Learned

> 2025년 05월 07일 이재현

# 대규모 React 컴포넌트 리팩토링 전략

아래는 클로드에게 내 코드를 주고 분석을 부탁한 결과임. 1000줄이 넘는 ShiftAdminTable 컴포넌트를 어떻게 리팩토링하면 좋을지 물어봤더니 정말 체계적으로 잘 분석해줬음. 1000줄이 넘는 거대한 `ShiftAdminTable` 컴포넌트를 효과적으로 리팩토링하는 방법에 대해 알아보자. 이러한 대형 컴포넌트는 가독성, 유지보수성, 성능 등 여러 측면에서 문제를 일으킬 수 있음.

## 현재 코드의 문제점

- **과도한 코드 길이**: 2000줄이 넘는 코드로 이해하고 유지보수하기 어려움.
- **너무 많은 책임**: 하나의 컴포넌트가 UI 렌더링, 상태 관리, 데이터 처리, 이벤트 핸들링 등 너무 많은 일을 담당함.
- **상태 관리 복잡성**: 여러 상태들이 한 컴포넌트 내에서 관리되어 의존성이 복잡함.
- **중복 코드**: 웹뷰와 모바일뷰에서 반복되는 코드가 많음.
- **퍼포먼스 이슈**: 불필요한 리렌더링이 발생할 가능성이 높음.

## 리팩토링 전략 및 우선순위

### 1. 컴포넌트 분리 (최우선)

- **테이블 헤더/바디/푸터 분리**: 테이블의 각 부분을 별도 컴포넌트로 분리
- **컨트롤 영역 분리**: 상단의 버튼 및 기능 영역을 별도 컴포넌트로 분리
- **모달 컴포넌트 관리**: 모달 관련 로직을 별도 컴포넌트나 hook으로 분리

```jsx
// 예시: 테이블 헤더 컴포넌트 분리
const TableHeader = ({ daysInMonth, getWeekendStyle }) => (
  <thead>
    <tr className="text-xs text-gray-600 border-b border-gray-200">
      <th className="p-0 text-center w-[90px] sm:w-24 border-r border-gray-200">
        <span className="block text-xs sm:text-sm px-0.5">이름</span>
      </th>
      {/* 나머지 헤더 셀 */}
    </tr>
  </thead>
);
```

### 2. 커스텀 훅 추출 (높은 우선순위)

- **상태 관리 로직 분리**: 관련 상태들과 핸들러를 커스텀 훅으로 분리
- **데이터 페칭 로직 분리**: API 호출 및 데이터 처리 로직을 분리

```jsx
// 예시: 근무 변경 관련 커스텀 훅
function useShiftManagement(year, month, dutyData) {
  const [duties, setDuties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // API 호출 및 디바운스 로직
  const sendBatchRequest = useCallback(
    debounce(async (requests) => {
      // 구현...
    }, 1000),
    [year, month]
  );

  // 근무 변경 핸들러
  const handleShiftChange = useCallback(
    (nurseIndex, dayIndex, shift) => {
      // 구현...
    },
    [
      /* 의존성 */
    ]
  );

  return { duties, handleShiftChange };
}
```

### 3. 유틸리티 함수 분리 (중간 우선순위)

- **헬퍼 함수 분리**: 날짜 포맷팅, 데이터 변환 등의 유틸리티 함수를 별도 파일로 이동
- **UI 헬퍼 함수 분리**: 스타일 계산 등의 함수 분리

```jsx
// 예시: utils/tableHelpers.js
export const isHighlighted = (selectedCell, row, col) => {
  if (!selectedCell) return '';

  const baseHighlight = 'transition-all duration-100';

  if (row === selectedCell.row && col === selectedCell.col) {
    return `${baseHighlight} bg-duty-off-bg ring-2 ring-primary ring-offset-1 z-[0]`;
  }

  // 나머지 로직...
  return '';
};
```

### 4. 웹/모바일 뷰 로직 분리 (중간 우선순위)

- **반응형 로직 분리**: 뷰포트에 따른 렌더링 로직을 별도 컴포넌트로 분리
- **공통 컴포넌트 재사용**: 공통 UI 요소는 재사용 가능한 컴포넌트로 분리

### 5. Context API 또는 상태 관리 라이브러리 도입 (낮은 우선순위)

- **글로벌 상태 분리**: 여러 컴포넌트에서 공유하는 상태는 Context나 외부 상태 관리로 이동
- **상태 업데이트 로직 중앙화**: 복잡한 상태 업데이트 로직을 리듀서 패턴으로 구현

## 리팩토링 진행 순서

1. **컴포넌트 맵 그리기**: 기존 코드의 구조와 책임을 분석하여 새로운 컴포넌트 구조 설계
2. **작은 단위부터 추출**: DutyCell 같은 이미 분리된 작은 컴포넌트에서 시작하여 점진적으로 확장
3. **테스트 코드 작성**: 각 분리 단계마다 기능이 유지되는지 테스트
4. **점진적 리팩토링**: 한 번에 모든 것을 변경하지 않고 단계적으로 진행

## 리팩토링 시 주의사항

1. **기존 기능 유지**: 리팩토링은 코드 구조 변경이지 기능 변경이 아님을 기억할 것
2. **컴포넌트 간 의존성 관리**: props drilling을 최소화하되 과도한 추상화도 피할 것
3. **성능 고려**: React.memo, useMemo, useCallback을 적절히 사용하여 불필요한 리렌더링 방지
4. **단계적 접근**: 한 번에 모든 것을 바꾸려 하지 말고 작은 단위로 나누어 진행
5. **일관된 네이밍**: 분리된 컴포넌트와 훅에 일관된 네이밍 패턴 적용
6. **코드 리뷰**: 각 단계마다 다른 개발자의 코드 리뷰를 받아 품질 유지

## 예상되는 리팩토링 효과

- **코드 가독성 향상**: 각 컴포넌트가 명확한 단일 책임을 가짐
- **유지보수성 개선**: 버그 수정이나 기능 추가가 더 쉬워짐
- **성능 최적화**: 불필요한 리렌더링 감소
- **재사용성 증가**: 작은 컴포넌트는 다른 곳에서도 재사용 가능
- **협업 효율성**: 여러 개발자가 서로 다른 컴포넌트에서 동시에 작업 가능
