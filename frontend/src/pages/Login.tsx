import LandingTemplate from "../components/templates/LandingTemplate";
import LoginForm from "../components/organisms/LoginForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { SEO } from "../components/SEO";
import LoginEmailVerificationForm from "@/components/organisms/LoginEmailVerificationForm";
const Login = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState<"login" | "verify">("login");
	const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
	const [pendingEmail, setPendingEmail] = useState<string>("");

	useEffect(() => {
		try {
			// 로그인 페이지로 접근 시, 토큰 삭제
			sessionStorage.removeItem("user-auth-storage");
		} catch (error) {
			console.error("로그인 페이지 접근 실패:", error);
			if (error instanceof Error) {
				if (error.message === "서버 연결 실패") {
					toast.error("잠시 후 다시 시도해주세요.");
					return;
				}
				// if (error.message === "UNAUTHORIZED") {
				// 	// navigate("/login");
				// 	return;
				// }
			}
			if ((error as AxiosError)?.response?.status === 400) {
				toast.error("잘못된 접근입니다.");
				return;
			}
			// 그 외의 모든 에러는 에러 페이지로 이동
			navigate("/error");
		}
	}, [navigate]);

	const handleRequireVerification = (memberId: number, email: string) => {
		setPendingMemberId(memberId);
		setPendingEmail(email);
		setStep("verify");
	};

	const handleVerificationSuccess = () => {
		setStep("login");
	};

	return (
		<>
			<SEO
				title="로그인 | Dutymate"
				description="듀티메이트의 로그인 페이지입니다."
			/>
			<LandingTemplate showIntroText={false}>
				{step === "login" ? (
					<LoginForm onRequireVerification={handleRequireVerification} />
				) : (
					<LoginEmailVerificationForm
						memberId={pendingMemberId!}
						email={pendingEmail}
						onSuccess={handleVerificationSuccess}
					/>
				)}
			</LandingTemplate>
		</>
	);
};

export default Login;
