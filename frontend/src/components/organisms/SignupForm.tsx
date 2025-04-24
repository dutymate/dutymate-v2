import {
	EmailInput,
	PasswordInput,
	Input,
	AuthCodeInput,
} from "../atoms/Input";
import { useState } from "react";
import { toast } from "react-toastify";
import userService from "@/services/userService";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEmailVerification } from "@/hooks/useEmailVerification";

interface SignupData {
	email: string;
	password: string;
	passwordConfirm: string;
	name: string;
}

const validateEmail = (email: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string) =>
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

const SignupForm = () => {
	const navigate = useNavigate();
	const [signupData, setSignupData] = useState<SignupData>({
		email: "",
		password: "",
		passwordConfirm: "",
		name: "",
	});
	const [isAgreed, setIsAgreed] = useState(false);

	const [error, setError] = useState<{
		email?: string;
		password?: string;
		passwordConfirm?: string;
		name?: string;
	}>({});

	const {
		// email,
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
	} = useEmailVerification("signup");

	const handleKakaoSignup = () => {
		window.location.href = import.meta.env.VITE_KAKAO_LOGIN_URL;
	};
	const handleGoogleSignup = () => {
		window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
	};

	const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setSignupData((prevData) => ({ ...prevData, [name]: value }));

		let errorMessage = "";
		if (name === "email") {
			setEmail(value);
			if (!validateEmail(value.trim()))
				errorMessage = "올바른 이메일 형식이 아닙니다.";
		} else if (name === "password") {
			if (!validatePassword(value.trim()))
				errorMessage = "8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			if (
				signupData.passwordConfirm &&
				value.trim() !== signupData.passwordConfirm.trim()
			) {
				setError((prev) => ({
					...prev,
					passwordConfirm: "비밀번호가 일치하지 않습니다.",
				}));
			}
		} else if (name === "passwordConfirm") {
			if (value.trim() !== signupData.password.trim())
				errorMessage = "비밀번호가 일치하지 않습니다.";
		}
		setError((prevError) => ({ ...prevError, [name]: errorMessage }));
	};

	const handleSignupSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		let isValid = true;
		let newErrors: typeof error = {};

		if (!signupData.email.trim() || !validateEmail(signupData.email.trim())) {
			newErrors.email = !signupData.email.trim()
				? "이메일을 입력해 주세요."
				: "올바른 이메일 형식이 아닙니다.";
			isValid = false;
		}
		if (
			!signupData.password.trim() ||
			!validatePassword(signupData.password.trim())
		) {
			newErrors.password = !signupData.password.trim()
				? "비밀번호를 입력해주세요."
				: "비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			isValid = false;
		}
		if (
			!signupData.passwordConfirm.trim() ||
			signupData.passwordConfirm.trim() !== signupData.password.trim()
		) {
			newErrors.passwordConfirm = !signupData.passwordConfirm.trim()
				? "비밀번호 확인을 입력해주세요."
				: "비밀번호가 일치하지 않습니다.";
			isValid = false;
		}
		if (!signupData.name.trim()) {
			newErrors.name = "이름을 입력해 주세요.";
			isValid = false;
		}
		if (!isAgreed) {
			toast.error("개인정보 수집 및 이용에 동의해주세요.");
			return;
		}
		if (!isValid) {
			setError(newErrors);
			return;
		}

		try {
			await userService.checkEmail(signupData.email.trim());
			await userService.signup({
				email: signupData.email.trim(),
				password: signupData.password.trim(),
				passwordConfirm: signupData.passwordConfirm.trim(),
				name: signupData.name.trim(),
			});
			toast.success("정상적으로 회원가입 되었습니다.");
			navigate("/login");
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 400) {
					setError((prev) => ({ ...prev, email: "이미 가입된 이메일입니다." }));
				} else {
					toast.error(error.message);
				}
			} else {
				toast.error(error.message, { autoClose: 1000 });
			}
		}
	};

	return (
		<div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem]">
			<form onSubmit={handleSignupSubmit} className="lg:block">
				<span className="font-medium text-gray-900 text-base sm:text-lg">
					회원가입
				</span>
				<div className="space-y-[0.25rem] sm:space-y-[0.5rem]">
					<EmailInput
						id="signup-email"
						label=""
						name="email"
						value={signupData.email}
						onChange={handleSignupChange}
						error={emailError || error.email}
						placeholder="이메일"
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
					<p className="text-xs text-gray-500 pb-1">
						*인증번호를 받기 위해 정확한 이메일 주소를 입력하세요.
					</p>
					{authCodeSent && (
						<div className="flex items-center space-x-2">
							<AuthCodeInput
								id="signup-authcode"
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
							/>
						</div>
					)}
					<PasswordInput
						id="signup-password"
						label=""
						name="password"
						value={signupData.password}
						onChange={handleSignupChange}
						error={error.password}
						placeholder="비밀번호"
					/>
					<PasswordInput
						id="signup-password-confirm"
						label=""
						name="passwordConfirm"
						value={signupData.passwordConfirm}
						onChange={handleSignupChange}
						error={error.passwordConfirm}
						placeholder="비밀번호 확인"
					/>
					<Input
						id="signup-name"
						name="name"
						label=""
						value={signupData.name}
						onChange={handleSignupChange}
						error={error.name}
						placeholder="이름"
					/>
				</div>
				<div className="mt-[1rem] sm:mt-[1.5rem] flex justify-center">
					<div className="flex items-center">
						<input
							type="checkbox"
							id="signup-agreement"
							checked={isAgreed}
							onChange={(e) => setIsAgreed(e.target.checked)}
							className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] text-primary-dark"
						/>
						<label
							htmlFor="signup-agreement"
							className="ml-[0.375rem] text-[0.75rem] sm:text-[0.875rem] text-gray-600"
						>
							개인정보 수집 및 이용에 동의합니다.
						</label>
					</div>
				</div>
				<div className="mt-[0.75rem] sm:mt-[1rem] space-y-[0.375rem] sm:space-y-[0.5rem]">
					<button
						type="submit"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-white bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black font-bold"
					>
						회원가입
					</button>
					<div className="flex items-center">
						<div className="flex-grow h-[0.0625rem] bg-gray-200"></div>
						<span className="px-[0.75rem] text-[0.75rem] sm:text-[0.875rem] text-gray-500">
							또는
						</span>
						<div className="flex-grow h-[0.0625rem] bg-gray-200"></div>
					</div>
					<button
						type="button"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-[#000000] bg-[#FEE500] rounded-md hover:bg-[#FDD835] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] relative"
						onClick={handleKakaoSignup}
					>
						<img
							src="/images/kakao_logo.png"
							alt="카카오 아이콘"
							className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] absolute left-[1.05rem] sm:left-[1.05rem] top-1/2 transform -translate-y-1/2"
						/>
						<span className="w-full text-center">카카오 계정으로 시작하기</span>
					</button>
					<button
						type="button"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-[#000000] bg-[#F2F2F2] rounded-md hover:bg-[#E6E6E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F2F2F2] relative"
						onClick={handleGoogleSignup}
					>
						<img
							src="/images/google.logo.png"
							alt="구글 아이콘"
							className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] absolute left-[1.05rem] sm:left-[1.05rem] top-1/2 transform -translate-y-1/2"
						/>
						<span className="w-full text-center">구글 계정으로 시작하기</span>
					</button>
				</div>
			</form>
			<div className="text-center mt-[1rem]">
				<span className="text-gray-600">이미 계정이 있으신가요? </span>
				<Link to="/login" className="text-primary-dark hover:underline">
					로그인
				</Link>
			</div>
		</div>
	);
};

export default SignupForm;
