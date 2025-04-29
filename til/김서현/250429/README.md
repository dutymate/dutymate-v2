# Today I Learned

> 2025년 04월 29일

시작 시각 저장 : sesseionStorage
남은 시간 계산 : 현재 시각과 비교
남은 시간 표시 : hh:mm:ss
1초마다 업데이트 : setInterval로 남은 시간 1초씩 감소
시간 만료 처리 : Timeout 모달 회원가입 유도

타이머는 setInterval과 상태관리(useState)를 함께 사용해야 자연스럽게 시간 감소가 가능하다.
사용자가 새로고침하거나 이동해도 시간을 유지하려면 sessionStorage 같은 브라우저 저장소를 적절히 활용해야 한다는 점을 배웠다.
시간 관리가 필요한 기능에서는 **시간 경과에 따른 예외 처리(로그아웃, 강제 이동)**까지 신경써야 한다.

1. SessionStorage를 이용한 시작 시각 저장 및 불러오기
   데모 계정 시작 시점의 타임스탬프(demo-start-time)를 sessionStorage에 저장해 둔다.
   컴포넌트가 mount 될 때(useEffect), sessionStorage에서 시작 시각을 불러와서 현재 시각(Date.now())과 비교하여 경과 시간을 계산한다.
   총 이용 가능 시간(예: 10분 = 600초)에서 경과 시간을 빼서 남은 시간을 계산한다.

2. 남은 시간 계산
   현재 시각(Date.now())과 시작 시각(startTimestamp)의 차이를 구해 경과된 초 단위 시간을 얻는다.
   const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
   const remaining = 600 - elapsedSeconds; // (600초 = 10분)

3. 1초마다 감소하는 타이머 구현 (setInterval)
   setInterval을 사용해서 1초마다 남은 시간(timeLeft)을 1초씩 줄이기 시작한다.
   남은 시간이 1초 이하가 되면:
   인터벌을 clearInterval로 종료하고,
   다시 로그아웃 및 리다이렉션을 진행한다.

const interval = setInterval(() => {
setTimeLeft((prev) => {
if (prev <= 1) {
clearInterval(interval);
useUserAuthStore.getState().logout();
window.location.href = "/";
return 0;
}
return prev - 1;
});
}, 1000);
