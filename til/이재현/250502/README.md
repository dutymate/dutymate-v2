# Today I Learned

> 2025년 05월 02일 이재현

# 프론트엔드 개발에 적용하는 SOLID 원칙

오늘은 우리 듀티메이트 프로젝트의 프론트엔드 코드를 SOLID 원칙 관점에서 분석해봤다. SOLID는 객체지향 프로그래밍에서 중요한 5가지 설계 원칙의 약자인데, 프론트엔드 개발에도 충분히 적용할 수 있는 원칙이다.

## SOLID 원칙 개요

### 1. SRP (Single Responsibility Principle, 단일 책임 원칙)

- 하나의 컴포넌트나 함수는 하나의 책임만 가져야 한다.
- 변경 이유가 오직 하나여야 한다.

### 2. OCP (Open-Closed Principle, 개방-폐쇄 원칙)

- 확장에는 열려 있어야 하고, 수정에는 닫혀 있어야 한다.
- 기존 코드를 수정하지 않고 기능을 추가할 수 있어야 한다.

### 3. LSP (Liskov Substitution Principle, 리스코프 치환 원칙)

- 하위 타입(컴포넌트)은 상위 타입(컴포넌트)으로 대체 가능해야 한다.
- 예: 부모 컴포넌트가 기대하는 동작을 자식 컴포넌트가 준수해야 한다.

### 4. ISP (Interface Segregation Principle, 인터페이스 분리 원칙)

- 클라이언트는 자신이 사용하지 않는 인터페이스에 의존하지 않아야 한다.
- 컴포넌트에 필요한 props만 전달해야 한다.

### 5. DIP (Dependency Inversion Principle, 의존성 역전 원칙)

- 고수준 모듈은 저수준 모듈에 의존하지 않아야 한다. 둘 다 추상화에 의존해야 한다.
- 구체적인 구현보다 인터페이스/추상화에 의존해야 한다.

## 프로젝트 분석: 잘 적용된 부분

### 1. SRP (단일 책임 원칙)

**컴포넌트 구조 (Atomic Design Pattern)**

우리 프로젝트는 components 폴더 내에 atoms, organisms, templates 등으로 구분되어 있어 각 컴포넌트의 책임을 명확히 분리했다:

```
frontend/src/components/
├── atoms/       - 기본 UI 요소 (Button, Input 등)
├── organisms/   - 복잡한 컴포넌트 그룹
└── templates/   - 페이지 레이아웃
```

특히 `atoms` 폴더의 컴포넌트들은 한 가지 역할만 수행한다:

```tsx
// Button.tsx - 버튼 컴포넌트만 담당
interface ButtonProps {
  size?: ButtonSize;
  width?: ButtonWidth;
  color?: ButtonColor;
  children: React.ReactNode;
  onClick?: () => void;
  // ...
}
```

**Custom Hook으로 로직 분리**

`useEmailVerification.ts` 훅은 이메일 인증 관련 로직만 담당한다:

```tsx
export const useEmailVerification = (mode: 'login' | 'signup') => {
  // 이메일 인증 관련 상태와 로직
  return {
    email,
    setEmail,
    authCode /* ... */,
    sendCode,
    verifyCode /* ... */,
  };
};
```

### 2. OCP (개방-폐쇄 원칙)

**컴포넌트 확장성**

`ToggleButton` 컴포넌트는 `variant` prop을 통해 다양한 스타일을 지원하도록 설계되었다:

```tsx
interface ToggleButtonProps {
  options: Array<{ text: string; icon?: string }>;
  selectedIndex: number;
  onChange: (index: number) => void;
  variant?: 'gender' | 'nurse' | 'request' | 'default';
}
```

이렇게 하면 컴포넌트 내부 코드를 수정하지 않고도 새로운 스타일을 추가할 수 있다.

### 3. ISP (인터페이스 분리 원칙)

**PropTypes 분리**

Input 컴포넌트에서 EmailInput은 필요한 props만 받도록 설계되었다:

```tsx
export const EmailInput = (props: Omit<InputProps, 'type'>) => {
  return (
    <Input
      {...props}
      type="email"
      placeholder={props.placeholder || 'example@domain.com'}
    />
  );
};
```

`type`을 제외한 나머지 props만 받아 필요한 인터페이스만 사용한다.

### 4. DIP (의존성 역전 원칙)

**서비스 레이어 활용**

서비스 레이어(services 폴더)를 통해 API 호출 로직을 분리하고, 컴포넌트는 구체적인 구현보다 추상화된 인터페이스에 의존한다:

```tsx
// dutyService.ts에서 인터페이스 정의
export interface DutyInfo {
  /* ... */
}

// 컴포넌트에서 사용
const { dutyInfo, loading, error, fetchDutyInfo } = useShiftStore();
```

## 개선이 필요한 부분

### 1. SRP 위반: ShiftAdminTable.tsx

`ShiftAdminTable.tsx`는 1914줄의 매우 큰 파일로, 여러 가지 책임을 가지고 있다:

```tsx
// ShiftAdminTable.tsx에서 발견된 여러 책임
const handleKeyDown = (e: KeyboardEvent) => {
  /* ... */
};
const handleCellClick = (row: number, col: number) => {
  /* ... */
};
const handlePrevMonth = () => {
  /* ... */
};
const handleNextMonth = () => {
  /* ... */
};
const handleResetDuty = async () => {
  /* ... */
};
const handleAutoCreate = async () => {
  /* ... */
};
const handleDownloadWardSchedule = async () => {
  /* ... */
};
const handleExportToExcel = () => {
  /* ... */
};
// ... 등 다양한 기능
```

**개선 방안**: 이 컴포넌트를 더 작은 컴포넌트로 분리하고, 로직을 커스텀 훅으로 추출해야 한다.

```tsx
// 이렇게 분리할 수 있다
const useShiftNavigation = (year, month) => {
  const handlePrevMonth = () => {
    /* ... */
  };
  const handleNextMonth = () => {
    /* ... */
  };
  return { handlePrevMonth, handleNextMonth };
};

const useShiftExport = (dutyData, year, month) => {
  const handleDownloadWardSchedule = async () => {
    /* ... */
  };
  const handleExportToExcel = () => {
    /* ... */
  };
  return { handleDownloadWardSchedule, handleExportToExcel };
};
```

### 2. OCP 위반: 하드코딩된 조건문

`shiftStore.ts`에서 발견된 하드코딩된 정렬 로직:

```tsx
duty: data.duty.sort((a, b) => {
  // HN should always be at the top
  if (a.role === 'HN' && b.role !== 'HN') return -1;
  if (a.role !== 'HN' && b.role === 'HN') return 1;
  return 0;
});
```

**개선 방안**: 정렬 전략을 설정할 수 있는 옵션을 제공하여 확장성을 높일 수 있다.

```tsx
// 이런 방식으로 개선할 수 있다
const sortDuty = (duties, sortOption = 'roleFirst') => {
  switch (sortOption) {
    case 'roleFirst':
      return duties.sort((a, b) => {
        if (a.role === 'HN' && b.role !== 'HN') return -1;
        if (a.role !== 'HN' && b.role === 'HN') return 1;
        return 0;
      });
    case 'name':
      return duties.sort((a, b) => a.name.localeCompare(b.name));
    // ... 다른 정렬 옵션
    default:
      return duties;
  }
};
```

### 3. ISP 위반: 너무 많은 Props 전달

`ShiftAdminTable`은 너무 많은 props를 받아 인터페이스가 복잡하다:

```tsx
interface ShiftAdminTableProps {
  dutyData: {
    /* ... */
  }[];
  invalidCnt: number;
  year: number;
  month: number;
  onUpdate: (year: number, month: number, historyIdx?: number) => Promise<void>;
  issues: {
    /* ... */
  }[];
}
```

**개선 방안**: props를 더 작은 단위로 그룹화하여 인터페이스를 분리할 수 있다.

```tsx
// 이렇게 개선할 수 있다
interface DutyDataProps {
  data: {
    /* ... */
  }[];
  issues: {
    /* ... */
  }[];
  invalidCnt: number;
}

interface DateContextProps {
  year: number;
  month: number;
}

interface ShiftAdminTableProps {
  dutyData: DutyDataProps;
  dateContext: DateContextProps;
  onUpdate: (year: number, month: number, historyIdx?: number) => Promise<void>;
}
```

### 4. DIP 위반: 직접적인 서비스 호출

컴포넌트에서 직접 서비스를 호출하는 경우가 있다:

```tsx
// ShiftAdminTable.tsx 내부
const data = await dutyService.getDuty(params);
```

**개선 방안**: 컴포넌트는 hooks나 context를 통해 간접적으로 서비스에 접근해야 한다.

```tsx
// 이렇게 개선할 수 있다
const { fetchDutyData } = useDutyContext();
// ...
await fetchDutyData(params);
```

## 오버엔지니어링 방지를 위한 3가지 원칙

SOLID 원칙을 적용하는 것도 중요하지만, 과도한 추상화나 복잡성을 피하기 위해 다음 3가지 원칙도 함께 고려해야 한다:

![Coding Principles: YAGNI, KISS, DRY](https://raw.githubusercontent.com/albertobasalo/albertobasalo/main/docs/img/coding-principles.png)

### 1. YAGNI (You Aren't Gonna Need It, 필요한 것만 구현하라)

- **Do the NEEDED**: 지금 당장 필요한 기능만 구현하고, 미래에 필요할 것 같은 기능은 미리 구현하지 말자.
- 우리 프로젝트에서는 처음부터 모든 기능을 갖춘 복잡한 컴포넌트를 만들기보다, 필요한 기능을 점진적으로 추가하는 접근 방식이 더 효과적이었다.
- 예: `ShiftAdminTable`에서 필요한 기능만 먼저 구현하고, 추가 기능은 필요할 때 확장했다면 코드가 더 깔끔했을 것이다.

### 2. KISS (Keep It Simple, Stupid, 단순하게 유지하라)

- **Do it SIMPLE**: 복잡한 해결책보다 단순한 해결책을 선호하자.
- 불필요한 추상화는 코드를 이해하기 어렵게 만든다.
- 예: `dutyService.ts`에서 API 호출 부분이 단순하고 명확하게 구현되어 있어 이해하기 쉽다.
- 반면 `shiftStore.ts`의 배치 처리 로직은 복잡하여 이해하기 어려운 부분이 있다.

### 3. DRY (Don't Repeat Yourself, 반복하지 마라)

- **Do it ONCE**: 같은 코드를 여러 곳에 복사-붙여넣기하지 말고, 재사용 가능한 함수나 컴포넌트로 추출하자.
- 예: 우리 프로젝트에서 `components/atoms` 폴더의 컴포넌트들은 재사용성이 높아 DRY 원칙을 잘 지키고 있다.
- 하지만 일부 페이지 컴포넌트에서는 유사한 로직이 반복되는 부분이 있어 개선이 필요하다.

## 결론: 뭣이 중한디.

SOLID 원칙은 프론트엔드 개발에도 충분히 적용 가능하고, 코드의 유지보수성과 확장성을 높이는 데 큰 도움이 된다. 하지만 원칙을 맹목적으로 따르기보다는 YAGNI, KISS, DRY 원칙과 균형을 맞추어 실용적인 코드를 작성하는 것이 중요하다. 중요한 것은 균형이다. 프로젝트의 규모와 요구사항에 맞게 적절한 수준의 추상화와 구조화를 적용해야 한다.

이미 많은 부분에서 좋은 설계 원칙을 따르고 있지만, 특히 `ShiftAdminTable.tsx`와 같은 대형 컴포넌트는 개선이 필요하다. 이를 더 작은 컴포넌트로 분리하고 로직을 커스텀 훅으로 추출하면서도, 불필요한 추상화를 피하는 것이 중요할 것이다.

앞으로 새로운 기능을 개발할 때는 처음부터 완벽하게 설계하려고 하기보다는, 필요한 기능부터 구현하고 점진적으로 리팩토링하는 접근 방식을 택해야겠다. 이렇게 하면 설계 원칙을 지키면서도 오버엔지니어링을 피할 수 있을 것이다.
