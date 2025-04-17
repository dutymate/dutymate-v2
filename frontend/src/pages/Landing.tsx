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
				<Button
					color="tertiary"
					size="lg"
					width="long"
					onClick={handleStart}
					className="mt-[0.0625rem] lg:mt-[3rem] h-[2.5rem] lg:h-[3rem] bg-primary hover:bg-primary-dark text-white"
				>
					<span className="text-[1.25rem] lg:text-[1rem]">시작하기</span>
				</Button>

				<div className="flex gap-2 p-4">
					사용법이 궁금하다면?
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
				</div>
			</LandingTemplate>
		</>
	);
};

export default Landing;
