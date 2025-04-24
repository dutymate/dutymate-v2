import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EmailInput, AuthCodeInput } from "../atoms/Input";
import userService from "@/services/userService";

interface Props {
	memberId: number;
	email: string;
	onSuccess: () => void;
}

const validateEmail = (email: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginEmailVerificationForm = ({ memberId, email, onSuccess }: Props) => {
	const [emailInput, setEmailInput] = useState("");
	const [authCode, setAuthCode] = useState("");
	const [authCodeSent, setAuthCodeSent] = useState(false);
	const [authCodeStatus, setAuthCodeStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [isVerified, setIsVerified] = useState(false);
	const [timer, setTimer] = useState(300);
	const [authCodeExpired, setAuthCodeExpired] = useState(false);
	const [emailError, setEmailError] = useState<string | undefined>(undefined);
	const [isSending, setIsSending] = useState(false); // 메일이 발송되었는지

	useEffect(() => {
		if (!authCodeSent || timer <= 0) return;
		const interval = setInterval(() => {
			setTimer((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					setAuthCodeExpired(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [authCodeSent, timer]);

	const handleSendAuthCode = async () => {
		if (!validateEmail(emailInput.trim())) {
			setEmailError("올바른 이메일 형식이 아닙니다.");

			setTimeout(() => setEmailError(undefined), 3000); // 3초 뒤 자동 제거
			return;
		}

		try {
			// 상태 초기화
			setAuthCode("");
			setAuthCodeStatus("idle");
			setIsVerified(false);

			setIsSending(true); // 로딩 시작
			await userService.sendEmailAuthCode(emailInput.trim(), "login");
			setAuthCodeSent(true);
			setTimer(300);
			setAuthCodeExpired(false);
			setEmailError(undefined);
			toast.success("인증번호가 발송되었습니다.");
		} catch (err) {
			toast.error("인증번호 발송에 실패했습니다.");
			setEmailError(undefined);
		} finally {
			setIsSending(false); // 로딩 종료
		}
	};

	const handleVerifyCode = async () => {
		if (authCodeExpired) {
			toast.error("인증 코드가 만료되었습니다.");
			return;
		}

		try {
			const res = await userService.verifyEmailCode({
				email: emailInput.trim(),
				code: authCode.trim(),
			});

			if (res.status === 200) {
				setAuthCodeStatus("success");
				setIsVerified(true);
				setTimer(0);
				toast.success("이메일 인증이 완료되었습니다.");
			} else {
				setAuthCodeStatus("error");
				setIsVerified(false);
			}
		} catch (err) {
			setAuthCodeStatus("error");
			setIsVerified(false);
			setTimer(0);
			setAuthCode("");
			toast.error("인증 코드가 올바르지 않습니다.");
		}
	};

	const handleBackToLogin = async () => {
		if (!isVerified) {
			toast.error("이메일 인증이 완료되지 않았습니다.");
			return;
		}
		try {
			await userService.verifyEmailUpdate(memberId, emailInput.trim());
			onSuccess();
			toast.success("성공적으로 이메일 인증 되었습니다. 다시 로그인 해주세요.");
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow px-6 py-8 w-[20rem] sm:w-[25rem] lg:w-[28rem]">
			<h1 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-4">
				이메일 인증
			</h1>
			<p className="text-center text-sm text-gray-700 mb-6">
				로그인을 위해 이메일 인증이 필요합니다. <br />
				이메일을 입력 후 인증번호를 요청해주세요.
			</p>

			<div className="space-y-2">
				<EmailInput
					id="verify-email"
					label=""
					name="email"
					value={emailInput}
					onChange={(e) => setEmailInput(e.target.value)}
					error={emailError}
					placeholder="이메일"
					rightElement={
						<button
							type="button"
							className="text-xs bg-primary-20 text-primary-dark px-3 py-2 rounded"
							onClick={handleSendAuthCode}
						>
							{isSending ? "발송 중..." : "인증번호 발송"}
						</button>
					}
				/>

				{authCodeSent && (
					<AuthCodeInput
						id="auth-code"
						name="authCode"
						value={authCode}
						onChange={(e) => setAuthCode(e.target.value)}
						timer={timer}
						onVerifyClick={handleVerifyCode}
						isVerified={isVerified}
						status={authCodeStatus}
						error={
							authCodeStatus === "error"
								? "인증 코드가 일치하지 않습니다."
								: undefined
						}
						successText={
							authCodeStatus === "success" ? "인증되었습니다." : undefined
						}
					/>
				)}
			</div>

			<p className="text-center text-sm text-gray-500 my-6">
				※ 인증 메일이 도착하지 않았다면, 스팸 메일함도 확인해보세요!
			</p>

			<button
				onClick={handleBackToLogin}
				className="w-full bg-base-black text-white py-3 rounded-md font-semibold hover:bg-neutral-900 transition disabled:opacity-50"
			>
				로그인하러 가기
			</button>
		</div>
	);
};

export default LoginEmailVerificationForm;
