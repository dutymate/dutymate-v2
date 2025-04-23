# Today I Learned

> 2025년 04월 22일

✅ 문제 요약
데모 로그인 시 useState(60 * 60) 또는 setTimeLeft(60 * 60)으로 타이머를 1시간으로 고정 초기화
새로고침 하거나 다른 페이지로 이동할대마다 시간이 초기화 되어버리는 문제 발생생

✅ 해결 전략
로그인 시각을 sessionStorage에 저장하고,
컴포넌트가 렌더링될 때마다 그로부터 얼마나 시간이 흘렀는지 계산해서 남은 시간을 구한다.

✅ 적용 코드
1. Landing.tsx — 데모 로그인 성공 시 현재 시각 저장
sessionStorage.setItem("demo-start-time", Date.now().toString());

2. Profile.tsx (또는 타이머 사용하는 컴포넌트) — 남은 시간 계산
const [timeLeft, setTimeLeft] = useState<number>(0);
const isDemo = userInfo?.isDemo;

useEffect(() => {
	if (!isDemo) return;

	const startTime = sessionStorage.getItem("demo-start-time");
	if (!startTime) return;

	const startTimestamp = parseInt(startTime, 10);
	const now = Date.now();

	const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
	const remaining = 60 * 60 - elapsedSeconds;

	if (remaining <= 0) {
		useUserAuthStore.getState().logout();
		window.location.href = "/";
	} else {
		setTimeLeft(remaining);
	}
}, [isDemo]);

3. 1초마다 타이머 줄이기 (Profile.tsx 이어서)
useEffect(() => {
	if (!isDemo || timeLeft <= 0) return;

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

	return () => clearInterval(interval);
}, [isDemo, timeLeft]);


- 핵심 정리 
1. sessionStorage : 데모 로그인 시각을 저장하여 새로고침 시 참조 
2. useEffect : 렌더링 시마다 로그인 시각 기준으로 남은 시간 계산 

+++...
내가 작성한 코드에만 문제가 있다 생각하고 
모든 페이지에 console을 찍고 다녔는데 
db에 새로운 변수가 추가되어 발생한 문제 였다. 

entity를 수정한 파일을 
git stash 
git checkout develop
git pull 
git checkout 현재 수정 브랜치 
git rebase develop
git stash pop 해주니 다시 제대로 작동했다 
