# Today I Learned

> 2025년 05월 12일 이재현

## 간호사 부족 상황에 대한 UX 개선

### 1. 문제 인식과 초기 접근

근무표 자동생성 기능을 개발하면서 가장 큰 고민거리 중 하나는 "간호사 인력이 부족한 상황"이었다. 알고리즘은 주어진 제약조건(병동 규칙, 간호사 수 등) 내에서 최적의 해를 찾아야 하는데, 인력이 부족하면 당연히 좋은 결과를 내기 어렵다.

```typescript
// 기존 코드: 단순한 모달 표시
const handleAutoGenerate = async () => {
  try {
    const response = await dutyService.autoCreateDuty(year, month);
    // ... 성공 처리
  } catch (error) {
    if (error.response?.status === 406) {
      // 단순히 모달만 보여주고 끝
      setIsNurseShortageModalOpen(true);
    }
  }
};
```

이런 상황에서 사용자에게 "간호사가 부족합니다. 병동관리로 이동하시겠습니까?"라는 모달만 보여주는 것은 UX 관점에서 좋지 않았다. 사용자는:

1. 병동관리 페이지로 이동
2. 임시 간호사 추가
3. 다시 근무표 관리 페이지로 돌아와서
4. 자동생성 버튼을 다시 클릭

이런 불편한 과정을 거쳐야 했다.

### 2. 첫 번째 개선: 사전 알림 배너

사용자가 자동생성을 시도하기 전에 미리 부족 상황을 인지할 수 있도록 배너를 추가했다.

```typescript
// NurseShortageAlert.tsx
const NurseShortageAlert = ({
  shortage,
  onRuleButtonClick,
}: NurseShortageAlertProps) => {
  if (shortage <= 0) return null;

  return (
    <div className="bg-duty-evening-bg/20 border border-duty-evening-dark/20 rounded-xl p-3 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="alert" size={18} className="text-duty-evening-dark" />
          <span className="text-sm font-medium text-gray-800">
            현재 병동 규칙으로는 간호사{' '}
            <span className="font-bold text-duty-evening-dark">
              {shortage}명
            </span>{' '}
            부족
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" color="evening" onClick={handleAddNurse}>
            간호사 추가
          </Button>
          <Button size="sm" color="primary" onClick={handleRuleEdit}>
            규칙 수정
          </Button>
        </div>
      </div>
    </div>
  );
};
```

이를 위해 프론트엔드에서도 간호사 부족을 계산할 수 있어야 했다. 백엔드의 계산 로직을 프론트엔드로 가져와서 `useNurseShortageCalculation` 훅을 만들었다:

```typescript
// useNurseShortageCalculation.ts
const useNurseShortageCalculation = ({
  year,
  month,
  nursesCount,
  initialWardRules = null,
}: UseNurseShortageCalculationProps) => {
  const [shortage, setShortage] = useState(0);
  const [wardRules, setWardRules] = useState<WardRule | null>(initialWardRules);

  const calculateRequiredNurses = useCallback(() => {
    if (!wardRules) return 0;

    // 현재 월의 일 수 및 평일/주말 일 수 계산
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekendDays = Array.from(
      { length: daysInMonth },
      (_, i) => i + 1
    ).filter(
      (day) =>
        isSaturdayDay(year, month, day) ||
        isSundayDay(year, month, day) ||
        isHoliday(year, month, day)
    ).length;
    const weekdayDays = daysInMonth - weekendDays;

    // 평일/주말 필요 근무 수 계산
    const weekdayShifts =
      wardRules.wdayDCnt + wardRules.wdayECnt + wardRules.wdayNCnt;
    const weekendShifts =
      wardRules.wendDCnt + wardRules.wendECnt + wardRules.wendNCnt;

    // 총 필요 근무 수 계산
    const totalRequiredShifts =
      weekdayShifts * weekdayDays + weekendShifts * weekendDays;

    let nurseCount = 1;
    while (
      nurseCount * (daysInMonth - getDefaultOffDays(year, month)) <
      totalRequiredShifts
    ) {
      nurseCount++;
    }

    return Math.max(0, nurseCount - nursesCount);
  }, [wardRules, year, month, nursesCount]);

  // ... useEffect 등 추가 로직
};
```

### 3. 두 번째 개선: 원활한 임시 간호사 추가

사용자가 페이지를 이동하지 않고도 임시 간호사를 추가할 수 있도록 모달을 개선했다:

```typescript
// NurseShortageModal.tsx
const NurseShortageModal = ({
  isOpen,
  onClose,
  onForceGenerate,
  onAddTemporaryNurses,
  neededNurseCount,
  currentNurseCount,
}: NurseShortageModalProps) => {
  const [tempNurseCount, setTempNurseCount] = useState(0);
  const [addedNurses, setAddedNurses] = useState(0);
  const [uiMode, setUiMode] = useState<'shortage' | 'complete'>('shortage');

  const handleAddTemporary = async () => {
    if (tempNurseCount <= 0) return;

    try {
      await onAddTemporaryNurses(tempNurseCount);
      const newTotal = addedNurses + tempNurseCount;
      setAddedNurses(newTotal);
      setTempNurseCount(0);

      // UI 모드 업데이트
      if (newTotal >= neededNurseCount) {
        setUiMode('complete');
      }
    } catch (error) {
      console.error('임시 간호사 추가 실패:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-[22.5rem]">
        {/* ... 모달 UI 구현 ... */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium mb-3">임시 간호사 추가</h3>
          <div className="flex items-center justify-center gap-4 mb-2">
            <button
              onClick={() => setTempNurseCount(Math.max(0, tempNurseCount - 1))}
            >
              -
            </button>
            <span className="text-xl font-medium w-12 text-center">
              {tempNurseCount}
            </span>
            <button
              onClick={() =>
                setTempNurseCount(
                  Math.min(neededNurseCount - addedNurses, tempNurseCount + 1)
                )
              }
            >
              +
            </button>
          </div>
          {/* ... 추가 UI 요소들 ... */}
        </div>
      </div>
    </div>
  );
};
```

### 4. 개발 과정에서의 고민들

1. **실시간 계산 vs API 호출**

   - 초기에는 API를 통해 간호사 부족을 계산하려 했음
   - 하지만 사용자 경험을 위해 프론트엔드에서도 계산할 수 있도록 결정
   - 백엔드 로직을 정확히 복제하여 일관성 유지

2. **UI/UX 디자인 고민**

   - 모바일/데스크톱 환경에서 모두 좋은 경험을 제공해야 함
   - 배너는 눈에 띄되 방해되지 않도록 디자인
   - 모달의 카운터 UI는 직관적이고 사용하기 쉽게 구현

3. **상태 관리의 복잡성**
   - 간호사 부족 계산 결과를 여러 컴포넌트에서 공유해야 했음
     - NurseShortageAlert: 배너 표시용
     - NurseShortageModal: 모달 내 표시용
     - ShiftAdminTable: 자동생성 로직에서 사용
   - 이를 위해 useNurseShortageCalculation 훅을 만들어 상태 로직을 분리
   - wardRules 변경 시 shortage 재계산이 필요한데, 이를 useEffect로 처리
   - 임시 간호사 추가 시 UI 상태(shortage/complete)와 실제 데이터 동기화가 중요했음

### 5. 결과와 교훈

이번 개선을 통해 얻은 교훈들:

1. **사용자 중심 사고의 중요성**

   - 기술적 구현보다 사용자 경험이 우선되어야 함
   - 불편함을 인지하고 개선하는 것이 중요

2. **점진적 개선의 가치**

   - 한 번에 모든 것을 해결하려 하지 않고 단계적으로 개선
   - 각 단계에서 사용자 피드백을 수렴하여 다음 단계 계획

### 6. 향후 개선 방향

1. **성능 최적화**

   - 간호사 부족 계산 로직의 성능 개선
   - 불필요한 재계산 방지

2. **사용자 피드백 수집**

   - 새로운 UX에 대한 사용자 피드백 수집
   - 추가 개선 포인트 발굴

3. **테스트 강화**
   - 다양한 시나리오에 대한 테스트 케이스 작성
   - 엣지 케이스 처리 개선
