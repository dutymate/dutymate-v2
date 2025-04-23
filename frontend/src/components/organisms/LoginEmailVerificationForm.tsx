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
	const [authCode, setAuthCode] = useState("");
	const [authCodeSent, setAuthCodeSent] = useState(false);
	const [authCodeStatus, setAuthCodeStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [isVerified, setIsVerified] = useState(false);
	const [timer, setTimer] = useState(300);
	const [authCodeExpired, setAuthCodeExpired] = useState(false);

	const [emailError, setEmailError] = useState<string | undefined>(undefined);

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
		if (!validateEmail(email)) {
			setEmailError("올바른 이메일 형식이 아닙니다.");
			return;
		}

		try {
			await userService.sendEmailAuthCode(email.trim());
			setAuthCodeSent(true);
			setTimer(300);
			setAuthCodeExpired(false);
			setEmailError(undefined);
			toast.success("인증번호가 발송되었습니다.");
		} catch (err) {
			toast.error("인증번호 발송에 실패했습니다.");
		}
	};

	const handleVerifyCode = async () => {
		if (authCodeExpired) {
			toast.error("인증 코드가 만료되었습니다.");
			return;
		}

		try {
			const res = await userService.verifyEmailCode({
				email: email.trim(),
				code: authCode.trim(),
			});

			if (res.status === 200) {
				setAuthCodeStatus("success");
				setIsVerified(true);
				setTimer(0);

				// await userService.verifyEmailUpdate(memberId); // 인증 상태 업데이트

				toast.success("이메일 인증이 완료되었습니다.");
				onSuccess();
			} else {
				setAuthCodeStatus("error");
				setIsVerified(false);
			}
		} catch (err) {
			setAuthCodeStatus("error");
			setIsVerified(false);
			setAuthCode("");
			toast.error("인증 코드가 올바르지 않습니다.");
		}
	};

	return (
		<div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem]">
			<h1 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-4">
				이메일 인증 진행
			</h1>
			<p className="text-center text-sm text-gray-700 mb-6">
				보다 안전하고 정확한 서비스 이용을 위해 이메일 인증을 진행하고 있습니다.{" "}
				<br />
				이메일로 전송된 인증 코드를 입력해주세요.
			</p>

			<div className="space-y-[0.25rem] sm:space-y-[0.5rem]">
				<EmailInput
					id="verify-email"
					label=""
					name="email"
					value={email}
					onChange={() => {}} // 고정된 이메일이므로 수정 비활성화
					error={emailError}
					disabled
					placeholder="이메일"
					rightElement={
						<button
							type="button"
							className="text-xs bg-primary-20 text-primary-dark px-3 py-2 rounded"
							onClick={handleSendAuthCode}
						>
							인증번호 발송
						</button>
					}
				/>
				<p className="text-xs text-gray-500 pb-1">
					*인증번호를 받기 위해 정확한 이메일 주소를 입력하세요.
				</p>

				{authCodeSent && (
					<div className="flex items-center space-x-2">
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
					</div>
				)}
			</div>

			<p className="text-center text-sm text-gray-500 my-10">
				※ 인증 메일이 보이지 않으신가요? 스팸 메일함도 확인해보세요!
			</p>

			<button
				onClick={onSuccess}
				className="w-full bg-base-black text-white py-3 rounded-md font-semibold hover:bg-neutral-900 transition"
			>
				로그인하러 가기
			</button>
		</div>
	);
};

export default LoginEmailVerificationForm;
