import LandingTemplate from "../components/templates/LandingTemplate";
import { Button } from "../components/atoms/Button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../styles/animations.css";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { SEO } from "../components/SEO";

const Landing = () => {
	const navigate = useNavigate();

	useEffect(() => {
		// 랜딩 페이지로 접근 시, 토큰 삭제
		sessionStorage.removeItem("user-auth-storage");
	}, []);

	const handleStart = async () => {
		try {
			navigate("/login");
		} catch (error) {
			console.error("페이지 이동 실패:", error);
			if (error instanceof Error) {
				if (error.message === "서버 연결 실패") {
					toast.error("잠시 후 다시 시도해주세요.");
					return;
				}
				if (error.message === "UNAUTHORIZED") {
					navigate("/login");
					return;
				}
			}
			if ((error as AxiosError)?.response?.status === 400) {
				toast.error("잘못된 접근입니다.");
				return;
			}
			// 그 외의 모든 에러는 에러 페이지로 이동
			navigate("/error");
		}
	};

	const handleGoToTutorial = () => {
		try {
			window.open(import.meta.env.VITE_TUTORIAL_URL, "_blank");
		} catch (error) {
			navigate("/error");
		}
	};

	const handleGoToYoutube = () => {
		try {
			window.open(import.meta.env.VITE_YOUTUBE_URL, "_blank");
		} catch (error) {
			navigate("/error");
		}
	};

	return (
		<>
			<SEO
				title="랜딩 | Dutymate"
				description="듀티메이트의 랜딩 페이지입니다."
			/>
			<LandingTemplate showIntroText={true}>
				<div className="flex flex-col items-center gap-4 w-full">
					{/* 모바일: 세로 스택, 데스크탑: 가로 배치 */}
					<div className="flex flex-col sm:flex-row gap-3 w-full max-w-[23.2rem]">
						<Button
							color="secondary"
							size="lg"
							className="w-full h-[3.5rem] sm:h-[3rem] bg-white border border-gray-300 hover:text-black"
							onClick={() => toast.info("준비 중입니다.")}
						>
							<span className="text-[1rem]">Google Play</span>
						</Button>

						<Button
							color="secondary"
							size="lg"
							className="w-full h-[3.5rem] sm:h-[3rem] bg-white border border-gray-300 hover:text-black"
							onClick={() => toast.info("준비 중입니다.")}
						>
							<span className="text-[1rem]">App Store</span>
						</Button>
					</div>

					<Button
						color="secondary"
						size="lg"
						width="long"
						className="h-[3.5rem] sm:h-[3rem] bg-[#fff4ee] text-[#f47056] border-[0.5px] border-[#f47056] hover:bg-primary w-full max-w-[23.2rem]"
						onClick={() => navigate("/intro")}
					>
						<span className="text-[1rem]">간편하게 기능 살펴보기</span>
					</Button>

					<Button
						color="tertiary"
						size="lg"
						width="long"
						onClick={handleStart}
						className="h-[3.5rem] sm:h-[3rem] bg-primary hover:bg-primary-dark text-white w-full max-w-[23.2rem] mt-1 shadow-md"
					>
						<span className="text-[1rem]">시작하기</span>
					</Button>

					<div className="w-full max-w-[23.2rem] mt-4 pt-4 border-t border-gray-200">
						<p className="text-center text-gray-600">
							사용법이 궁금하다면?{" "}
							<span
								className="text-primary-dark cursor-pointer font-semibold"
								onClick={handleGoToTutorial}
							>
								튜토리얼
							</span>{" "}
							|{" "}
							<span
								className="text-primary-dark cursor-pointer font-semibold"
								onClick={handleGoToYoutube}
							>
								소개영상
							</span>
						</p>
					</div>
				</div>
			</LandingTemplate>
		</>
	);
};

export default Landing;
