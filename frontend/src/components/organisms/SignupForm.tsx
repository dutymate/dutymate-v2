import { EmailInput, PasswordInput, Input } from "../atoms/Input";
// import googleIcon from "../../assets/google.logo.png";  // 제거
// import kakao_logo from "../../assets/kakao_logo.png";  // 제거
import { useState } from "react";
import { toast } from "react-toastify";
import userService from "@/services/userService";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface SignupData {
	email: string;
	password: string;
	passwordConfirm: string;
	name: string;
}

// 이메일 형식 검증
const validateEmail = (email: string) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 비밀번호 검증 (8자 이상, 숫자 및 특수문자 포함)
const validatePassword = (password: string) => {
	return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
		password,
	);
};

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

	const handleKakaoSignup = () => {
		window.location.href = import.meta.env.VITE_KAKAO_LOGIN_URL;
	};

	const handleGoogleSignup = () => {
		window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
	};

	const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		// 입력 값 업데이트
		setSignupData((prevData) => ({
			...prevData,
			[name]: value,
		}));

		let errorMessage = "";

		// 입력 중 실시간 유효성 검사
		if (name === "email") {
			if (!validateEmail(value.trim())) {
				errorMessage = "올바른 이메일 형식이 아닙니다.";
			}
		} else if (name === "password") {
			if (!validatePassword(value.trim())) {
				errorMessage =
					"비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			}
			// 비밀번호가 변경되면 passwordConfirm 재검사
			if (
				signupData.passwordConfirm &&
				value.trim() !== signupData.passwordConfirm.trim()
			) {
				setError((prevError) => ({
					...prevError,
					passwordConfirm: "비밀번호가 일치하지 않습니다.",
				}));
			}
		} else if (name === "passwordConfirm") {
			if (value.trim() !== signupData.password.trim()) {
				errorMessage = "비밀번호가 일치하지 않습니다.";
			}
		}

		// 오류 메시지 업데이트
		setError((prevError) => ({
			...prevError,
			[name]: errorMessage,
		}));
	};

	const handleSignupFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		let isValid = true;

		if (name === "email") {
			isValid = validateEmail(value.trim());
		} else if (name === "password") {
			isValid = validatePassword(value.trim());
		} else if (name === "passwordConfirm") {
			isValid = value.trim() === signupData.password.trim();
		} else if (name === "name") {
			isValid = value.trim().length > 0;
		}

		// 입력값이 유효하면 에러 메시지를 지움
		if (isValid) {
			setError((prevError) => ({
				...prevError,
				[name]: "",
			}));
		}
	};

	const handleSignupSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		let isValid = true;
		let newErrors: typeof error = {};

		// 최종 입력값 검증
		if (!signupData.email.trim()) {
			newErrors.email = "이메일을 입력해 주세요.";
			isValid = false;
		} else if (!validateEmail(signupData.email.trim())) {
			newErrors.email = "올바른 이메일 형식이 아닙니다.";
			isValid = false;
		}

		if (!signupData.password.trim()) {
			newErrors.password = "비밀번호를 입력해주세요.";
			isValid = false;
		} else if (!validatePassword(signupData.password.trim())) {
			newErrors.password =
				"비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			isValid = false;
		}

		if (!signupData.passwordConfirm.trim()) {
			newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
			isValid = false;
		} else if (
			signupData.passwordConfirm.trim() !== signupData.password.trim()
		) {
			newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
			isValid = false;
		}

		if (!signupData.name.trim()) {
			newErrors.name = "이름을 입력해 주세요.";
			isValid = false;
		}

		// 입력값이 하나라도 비어 있으면 회원가입 요청 중단
		if (!isValid) {
			setError(newErrors);
			return;
		}

		// 약관 동의 확인
		if (!isAgreed) {
			toast.error("개인정보 수집 및 이용에 동의해주세요.");
			return;
		}

		try {
			// 1. 이메일 중복 체크 API 호출 실행
			await userService.checkEmail(signupData.email.trim());

			// 2. 이메일이 사용 가능하다면, 회원가입 진행
			await userService.signup({
				email: signupData.email.trim(),
				password: signupData.password.trim(),
				passwordConfirm: signupData.passwordConfirm.trim(),
				name: signupData.name.trim(),
			});

			toast.success("정상적으로 회원가입 되었습니다.");
			navigate("/login");
		} catch (error: any) {
			// Axios 에러인지 확인
			if (axios.isAxiosError(error)) {
				console.error("Axios response error:", error.response);

				if (error.response?.status === 400) {
					setError((prevError) => ({
						...prevError,
						email: "이미 가입된 이메일입니다.",
					}));
				} else {
					toast.error(error.message);
				}
			} else {
				// 네트워크 에러 또는 기타 에러 처리
				toast.error(error.message);
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
						onFocus={handleSignupFocus}
						error={error.email}
						placeholder="이메일"
					/>
					<PasswordInput
						id="signup-password"
						label=""
						name="password"
						value={signupData.password}
						onChange={handleSignupChange}
						onFocus={handleSignupFocus}
						error={error.password}
						placeholder="비밀번호"
					/>
					<PasswordInput
						id="signup-password-confirm"
						label=""
						name="passwordConfirm"
						value={signupData.passwordConfirm}
						onChange={handleSignupChange}
						onFocus={handleSignupFocus}
						error={error.passwordConfirm}
						placeholder="비밀번호 확인"
					/>
					<Input
						id="signup-name"
						name="name"
						label=""
						value={signupData.name}
						onChange={handleSignupChange}
						onFocus={handleSignupFocus}
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
