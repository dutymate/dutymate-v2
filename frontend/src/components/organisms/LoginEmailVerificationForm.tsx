import { toast } from "react-toastify";

import { AuthCodeInput, EmailInput } from "@/components/atoms/Input";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import userService from "@/services/userService";

interface Props {
	memberId: number;
	email: string;
	onSuccess: () => void;
}

const LoginEmailVerificationForm = ({ memberId, onSuccess }: Props) => {
	const {
		email: emailInput,
		setEmail,
		authCode,
		setAuthCode,
		authCodeSent,
		authCodeStatus,
		isVerified,
		timer,
		emailError,
		isSending,
		sendCode,
		verifyCode,
	} = useEmailVerification("login");

	const handleBackToLogin = async () => {
		if (!isVerified) {
			toast.error("이메일 인증이 완료되지 않았습니다.");
			return;
		}

		try {
			await userService.verifyEmailUpdate(memberId, emailInput.trim());
			toast.success("성공적으로 이메일 인증 되었습니다. 다시 로그인 해주세요.");
			onSuccess();
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
					onChange={(e) => setEmail(e.target.value)}
					error={emailError}
					placeholder="이메일"
					autoComplete="username"
					rightElement={
						<button
							type="button"
							className="text-xs bg-primary-20 text-primary-dark px-3 py-2 rounded"
							onClick={sendCode}
							disabled={isSending}
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
						onVerifyClick={verifyCode}
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
						autoComplete="one-time-code"
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
