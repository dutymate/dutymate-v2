# Today I Learned

> 2025년 05월 15일

✅ 이름순 / 근무순 정렬 시 깜빡임(Blink) 문제 해결 회고
🔍 문제 상황
GroupDetailPage에서 "이름순" 또는 "근무순" 버튼을 눌러 정렬을 바꿀 때,
화면 전체가 깜빡이듯 다시 렌더링되는 문제가 있었습니다.

원인 분석
정렬 버튼 클릭 시 fetchGroupData()가 두 정렬 방식에서 모두 실행됨

즉, 정렬을 바꿀 때마다 API를 통해 데이터를 다시 요청 →
→ 로딩 상태 전환 + 상태 업데이트로 인한 깜빡임 유발

🔧 해결 전략
이름순 정렬은 최초 서버에서 받은 데이터를 클라이언트에서 정렬하여 사용

근무순 정렬은 데이터 정렬이 복잡하므로 서버에서 받아온 데이터를 사용

📌 즉, 두 정렬 방식 모두 동일한 원본 데이터를 활용하여 깜빡임 없이 클라이언트에서 처리
→ setGroup()으로 상태를 재가공만 하며 재요청 없음



✅ 해결된 코드 구조 요약
1. 원본 데이터를 따로 보관
const [originalData, setOriginalData] = useState({
  shifts: [],
  prevShifts: [],
  nextShifts: [],
});

2. 서버에서 받아온 데이터를 originalData에 저장
setOriginalData({
  shifts: response.shifts ? JSON.parse(JSON.stringify(response.shifts)) : [],
  prevShifts: response.prevShifts ? JSON.parse(JSON.stringify(response.prevShifts)) : [],
  nextShifts: response.nextShifts ? JSON.parse(JSON.stringify(response.nextShifts)) : [],
});

3. 정렬 방식 변경 시 원본 데이터를 기준으로 정렬만 수행
const sortShifts = useCallback(() => {
  if (!originalData.shifts.length) return;

  const sortedCurrentShifts = JSON.parse(JSON.stringify(originalData.shifts));
  const sortedPrevShifts = JSON.parse(JSON.stringify(originalData.prevShifts || []));
  const sortedNextShifts = JSON.parse(JSON.stringify(originalData.nextShifts || []));

  const sortMemberList = (shift: any) => {
    if (sortByName) {
      shift.memberList.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const dutyOrder = { D: 0, M: 1, E: 2, N: 3, O: 4, X: 5 };
      shift.memberList.sort((a, b) => {
        const orderA = dutyOrder[a.duty] ?? 99;
        const orderB = dutyOrder[b.duty] ?? 99;
        return orderA - orderB;
      });
    }
  };

  sortedCurrentShifts.forEach(sortMemberList);
  sortedPrevShifts.forEach(sortMemberList);
  sortedNextShifts.forEach(sortMemberList);

  setGroup((prev) => prev && ({
    ...prev,
    shifts: sortedCurrentShifts,
    prevShifts: sortedPrevShifts,
    nextShifts: sortedNextShifts,
  }));
}, [originalData, sortByName]);

💡 효과
정렬 버튼 클릭 시 매번 서버에서 재요청 → 깜빡임	원본 데이터 기준 클라이언트 정렬 → 무깜빡 렌더링
불필요한 API 요청 2회 발생	초기 1회 요청 후, 클라이언트 내 재정렬만 수행
UX 불안정	UX 부드럽고 빠르게 개선됨

✅ 결론
정렬 방식 전환은 UI의 변경이지 데이터 자체의 변경이 아님
👉 원본 데이터를 기준으로 클라이언트 내에서 정렬만 하면,
성능과 UX를 모두 잡을 수 있습니다.

이러한 접근은 불필요한 네트워크 요청을 줄이고,
React의 상태 업데이트를 최소화하는 데에도 큰 도움이 됩니다.