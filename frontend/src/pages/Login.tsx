import { useEffect, useState } from "react";

import LoginEmailVerificationForm from "@/components/organisms/LoginEmailVerificationForm";
import LoginForm from "@/components/organisms/LoginForm";
import LandingTemplate from "@/components/templates/LandingTemplate";
import { SEO } from "@/components/SEO";
import { useLoginStepStore } from "@/stores/useLoginStepStore";

const Login = () => {
	const { step, setStep } = useLoginStepStore();
	const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
	const [pendingEmail, setPendingEmail] = useState<string>("");

	useEffect(() => {
		setStep("login");
		// 일반 로그인 페이지 진입 시만 토큰 삭제
		sessionStorage.removeItem("user-auth-storage");
	}, []);

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
