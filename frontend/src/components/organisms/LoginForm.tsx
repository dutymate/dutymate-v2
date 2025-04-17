import { EmailInput, PasswordInput } from "../atoms/Input";
// import googleIcon from "../../assets/google.logo.png";  // 제거
// import kakao_logo from "../../assets/kakao_logo.png";  // 제거
import { useState } from "react";
import userService from "@/services/userService";
import { toast } from "react-toastify";
import useUserAuthStore from "@/store/userAuthStore";
import { useNavigate, Link } from "react-router-dom";

interface LoginData {
	email: string;
	password: string;
}

// 이메일 형식 검증
const validateEmail = (email: string) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const LoginForm = () => {
	const navigate = useNavigate();
	const userAuthStore = useUserAuthStore();

	const [loginData, setLoginData] = useState<LoginData>({
		email: "",
		password: "",
	});

	const [error, setError] = useState<{ email?: string; password?: string }>({});

	const handleKakaoLogin = () => {
		window.location.href = import.meta.env.VITE_KAKAO_LOGIN_URL;
	};

	const handleGoogleLogin = () => {
		window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
	};

	const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setLoginData((preData) => ({
			...preData,
			[name]: value,
		}));

		// 입력 변경 시, 에러 메세지 초기화
		setError((preError) => ({
			...preError,
			[name]: "",
		}));
	};

	const handleLoginBtn = async (e: React.FormEvent) => {
		e.preventDefault();

		const trimEmail = loginData.email.trim();
		const trimpassword = loginData.password.trim();
		let isValid = true;

		// 이메일 검증
		if (!trimEmail) {
			setError((prevError) => ({
				...prevError,
				email: "이메일을 입력해 주세요.",
			}));
			isValid = false;
		} else if (!validateEmail(trimEmail)) {
			setError((prevError) => ({
				...prevError,
				email: "올바른 이메일 형식이 아닙니다.",
			}));
			isValid = false;
		}

		// 패스워드 검증
		if (!trimpassword) {
			setError((prevError) => ({
				...prevError,
				password: "비밀번호를 입력해주세요.",
			}));
			isValid = false;
		}

		if (!isValid) {
			return;
		}

		try {
			const data = await userService.login({
				email: trimEmail,
				password: trimpassword,
			});
			const { role, existAdditionalInfo, existMyWard } = data;

			userAuthStore.setUserInfo(data);
			toast.success("정상적으로 로그인되었습니다.");

			// 로그인 후 이동 로직
			if (!existAdditionalInfo) {
				navigate("/extra-info");
			} else if (!existMyWard) {
				if (role === "HN") {
					navigate("/create-ward");
				} else {
					navigate("/enter-ward");
				}
			} else {
				if (role === "HN") {
					navigate("/shift-admin");
				} else {
					navigate("/my-shift");
				}
			}
		} catch (error) {
			toast.error("이메일 또는 비밀번호가 일치하지 않습니다.");
			navigate("/login");
		}
	};

	return (
		<div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem]">
			<form className="lg:block">
				<div className="space-y-[0.375rem] sm:space-y-[0.5rem] ">
					<EmailInput
						id="login-email"
						name="email"
						label="이메일"
						placeholder="ssafynurse@dutymate.com"
						value={loginData.email}
						onChange={handleLoginChange}
						error={error.email}
					/>

					<PasswordInput
						id="login-password"
						name="password"
						label="비밀번호"
						value={loginData.password}
						onChange={handleLoginChange}
						error={error.password}
					/>
				</div>
				<div className="mt-[1.5rem]">
					<button
						type="submit"
						className="w-full px-[0.75rem] py-[0.5rem] text-[0.875rem] font-medium text-white bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black"
						onClick={handleLoginBtn}
					>
						로그인
					</button>
				</div>
				<div className="mt-[2rem] space-y-[0.75rem]">
					<button
						type="button"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-[#000000] bg-[#FEE500] rounded-md hover:bg-[#FDD835] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] relative"
						onClick={handleKakaoLogin}
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
						onClick={handleGoogleLogin}
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
				<span className="text-gray-600">계정이 없으신가요? </span>
				<Link to="/sign-up" className="text-primary-dark hover:underline">
					회원가입
				</Link>
			</div>
		</div>
	);
};

export default LoginForm;
