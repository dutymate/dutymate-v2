import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BiTimer } from "react-icons/bi";
// import useUserAuthStore from "@/store/userAuthStore";

const TimeOut = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// ESC 키 방지
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") e.preventDefault();
		};
		window.addEventListener("keydown", handler, true);

		// 뒤로가기 방지
		const preventNavigation = (e: PopStateEvent) => {
			e.preventDefault();
			window.history.pushState(null, "", location.pathname);
		};
		window.history.pushState(null, "", location.pathname);
		window.addEventListener("popstate", preventNavigation);

		// 터치 이벤트 방지
		const preventTouch = (e: TouchEvent) => {
			e.preventDefault();
		};
		document.addEventListener("touchmove", preventTouch, { passive: false });

		// 스크롤 방지
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", handler, true);
			window.removeEventListener("popstate", preventNavigation);
			document.removeEventListener("touchmove", preventTouch);
			document.body.style.overflow = "auto";
		};
	}, [location.pathname]);

	// 포커스 트랩 등은 필요시 추가

	return (
		<div
			className="fixed inset-0 z-[9999] min-h-screen flex items-center justify-center bg-black/50"
			onClick={(e) => e.stopPropagation()}
			onTouchMove={(e) => e.stopPropagation()}
		>
			<div
				className="bg-white rounded-xl p-4 sm:p-4 w-full max-w-[24rem] sm:max-w-[22rem] flex flex-col items-center shadow-md m-4"
				onClick={(e) => e.stopPropagation()}
				onTouchMove={(e) => e.stopPropagation()}
			>
				<div className="flex flex-col items-center mb-3 sm:mb-3 mt-1">
					<div className="bg-[#F9A98E] rounded-full w-[3.5rem] h-[3.5rem] sm:w-14 sm:h-14 flex items-center justify-center mb-2 sm:mb-2">
						<BiTimer size={32} className="sm:size-8" color="#fff" />
					</div>
					<h2 className="text-lg sm:text-lg font-bold text-[#444] mb-3 sm:mb-3 text-center">
						서비스 맛보기 시간 종료
					</h2>
					<div className="text-[#444] text-sm sm:text-sm text-center leading-relaxed">
						저희 서비스 어떠셨나요{" "}
						<span className="inline-block">|•'-'•)ง✧</span>
						<br />더 많은 기능과 사용을 원하시면 회원가입을 진행해주세요.
					</div>
				</div>
				<button
					className="mt-4 sm:mt-4 w-full bg-[#F9A98E] text-white text-base sm:text-base font-bold rounded-lg py-2 sm:py-2 transition hover:bg-[#f88c62] focus:outline-none"
					onClick={() => navigate("/sign-up")}
				>
					회원가입 하러가기
				</button>
			</div>
		</div>
	);
};

export default TimeOut;
