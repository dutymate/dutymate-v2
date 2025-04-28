//데모버전 타이머 (모바일버전)
// components/atoms/DemoTimer.tsx
import { useEffect, useState } from "react";
import useUserAuthStore from "@/store/userAuthStore";

const DemoTimer = () => {
	const { userInfo } = useUserAuthStore();
	const isDemo = userInfo?.isDemo;
	const [timeLeft, setTimeLeft] = useState<number>(0);

	const formatTime = (sec: number) => {
		const h = String(Math.floor(sec / 3600)).padStart(2, "0");
		const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
		const s = String(sec % 60).padStart(2, "0");
		return `${h}:${m}:${s}`;
	};

	useEffect(() => {
		if (!isDemo) return;

		const startTime = sessionStorage.getItem("demo-start-time");
		if (!startTime) return;

		const startTimestamp = parseInt(startTime, 10);
		const now = Date.now();
		const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
		const remaining = 60 * 10 - elapsedSeconds;

		if (remaining <= 0) {
			useUserAuthStore.getState().logout();
			window.location.href = "/";
		} else {
			setTimeLeft(remaining);
		}
	}, [isDemo]);

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

	if (!isDemo || timeLeft <= 0) return null;

	return (
		<div className="fixed top-7 right-3 z-50 text-black px-3 py-1 rounded shadow-sm text-sm w-[5rem]">
			{formatTime(timeLeft)}
		</div>
	);
};

export default DemoTimer;
