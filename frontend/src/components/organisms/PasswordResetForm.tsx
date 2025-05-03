import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { EmailInput, PasswordInput } from "@/components/atoms/Input";
import userService from "@/services/userService";

interface ResetPasswordData {
	email: string;
	code: string;
	password: string;
	passwordConfirm: string;
}

const validateEmail = (email: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string) =>
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

const PasswordResetForm = () => {
	const navigate = useNavigate();
	const [resetData, setResetData] = useState<ResetPasswordData>({
		email: "",
		code: "",
		password: "",
		passwordConfirm: "",
	});

	const [error, setError] = useState<{
		email?: string;
		code?: string;
		password?: string;
		passwordConfirm?: string;
	}>({});

	// 이메일 인증 관련 상태
	const [authCodeSent, setAuthCodeSent] = useState(false);
	const [isVerified, setIsVerified] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [timer, setTimer] = useState(300); // 5분 타이머
	const [timerActive, setTimerActive] = useState(false);
	const [authCodeStatus, setAuthCodeStatus] = useState<
		"idle" | "success" | "error"
	>("idle");

	const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setResetData((prevData) => ({ ...prevData, [name]: value }));

		let errorMessage = "";
		if (name === "email") {
			if (!validateEmail(value.trim()))
				errorMessage = "올바른 이메일 형식이 아닙니다.";
		} else if (name === "code") {
			if (value.trim().length !== 6) errorMessage = "인증 코드는 6자리입니다.";
		} else if (name === "password") {
			if (!validatePassword(value.trim()))
				errorMessage = "8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			if (
				resetData.passwordConfirm &&
				value.trim() !== resetData.passwordConfirm.trim()
			) {
				setError((prev) => ({
					...prev,
					passwordConfirm: "비밀번호가 일치하지 않습니다.",
				}));
			}
		} else if (name === "passwordConfirm") {
			if (value.trim() !== resetData.password.trim())
				errorMessage = "비밀번호가 일치하지 않습니다.";
		}
		setError((prevError) => ({ ...prevError, [name]: errorMessage }));
	};

	// 인증 코드 발송 함수
	const handleSendCode = async () => {
		if (!validateEmail(resetData.email.trim())) {
			setError((prev) => ({
				...prev,
				email: "올바른 이메일 형식이 아닙니다.",
			}));
			return;
		}

		try {
			setIsSending(true);
			await userService.requestPasswordReset(resetData.email.trim());

			setAuthCodeSent(true);
			setTimerActive(true);
			setTimer(300); // 5분 타이머 리셋
			toast.success("인증 코드가 발송되었습니다.");
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				const errorMessage =
					error.response?.data?.message || "인증 코드 발송에 실패했습니다.";
				toast.error(errorMessage);
				setError((prev) => ({ ...prev, email: errorMessage }));
			} else {
				toast.error("인증 코드 발송에 실패했습니다.");
			}
		} finally {
			setIsSending(false);
		}
	};

	// 인증 코드 확인 함수
	const handleVerifyCode = async () => {
		if (resetData.code.length !== 6) {
			setError((prev) => ({ ...prev, code: "인증 코드는 6자리입니다." }));
			return;
		}

		try {
			setIsVerifying(true);
			await userService.verifyEmailCode({
				email: resetData.email.trim(),
				code: resetData.code.trim(),
			});

			setIsVerified(true);
			setTimerActive(false);
			setAuthCodeStatus("success");
			toast.success("인증되었습니다.");
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				setAuthCodeStatus("error");
				toast.error(
					error.response?.data?.message || "인증 코드 확인에 실패했습니다.",
				);
				setError((prev) => ({
					...prev,
					code: "인증 코드가 일치하지 않습니다.",
				}));
			} else {
				setAuthCodeStatus("error");
				toast.error("인증 코드 확인에 실패했습니다.");
			}
		} finally {
			setIsVerifying(false);
		}
	};

	// 비밀번호 재설정 함수
	const handleResetSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		let isValid = true;
		let newErrors: typeof error = {};

		if (!resetData.email.trim() || !validateEmail(resetData.email.trim())) {
			newErrors.email = !resetData.email.trim()
				? "이메일을 입력해 주세요."
				: "올바른 이메일 형식이 아닙니다.";
			isValid = false;
		}

		if (!isVerified) {
			toast.error("이메일 인증이 필요합니다.");
			isValid = false;
		}

		if (
			!resetData.password.trim() ||
			!validatePassword(resetData.password.trim())
		) {
			newErrors.password = !resetData.password.trim()
				? "비밀번호를 입력해주세요."
				: "비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.";
			isValid = false;
		}

		if (
			!resetData.passwordConfirm.trim() ||
			resetData.passwordConfirm.trim() !== resetData.password.trim()
		) {
			newErrors.passwordConfirm = !resetData.passwordConfirm.trim()
				? "비밀번호 확인을 입력해주세요."
				: "비밀번호가 일치하지 않습니다.";
			isValid = false;
		}

		if (!isValid) {
			setError(newErrors);
			return;
		}

		try {
			await userService.resetPassword({
				email: resetData.email.trim(),
				password: resetData.password.trim(),
			});
			toast.success("비밀번호가 성공적으로 재설정되었습니다.");
			navigate("/login");
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				toast.error(
					error.response?.data?.message || "비밀번호 재설정에 실패했습니다.",
				);
			} else {
				toast.error("비밀번호 재설정에 실패했습니다.");
			}
		}
	};

	// 타이머 효과
	useEffect(() => {
		let intervalId: NodeJS.Timeout;

		if (timerActive && timer > 0) {
			intervalId = setInterval(() => {
				setTimer((prevTimer) => prevTimer - 1);
			}, 1000);
		} else if (timer === 0 && timerActive) {
			setAuthCodeSent(false);
			setTimerActive(false);
			setResetData((prev) => ({ ...prev, code: "" }));
			toast.error("인증 시간이 만료되었습니다. 다시 시도해주세요.");
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [timer, timerActive]);

	// 타이머 포맷팅 함수
	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
	};

	return (
		<div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem]">
			<form onSubmit={handleResetSubmit} className="lg:block">
				<span className="font-medium text-gray-900 text-base sm:text-lg">
					비밀번호 재설정
				</span>
				<div className="space-y-[0.25rem] sm:space-y-[0.5rem]">
					<EmailInput
						id="reset-email"
						label=""
						name="email"
						value={resetData.email}
						onChange={handleResetChange}
						error={error.email}
						placeholder="이메일"
						disabled={authCodeSent || isVerified}
					/>

					{!authCodeSent && !isVerified && (
						<button
							type="button"
							className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] bg-primary-20 text-primary-dark rounded"
							onClick={handleSendCode}
							disabled={isSending || !resetData.email || !!error.email}
						>
							{isSending ? "발송 중..." : "인증번호 발송"}
						</button>
					)}

					{authCodeSent && !isVerified && (
						<div className="space-y-[0.25rem]">
							<div className="relative">
								<input
									id="reset-code"
									type="text"
									name="code"
									value={resetData.code}
									onChange={handleResetChange}
									className={`w-full p-[0.6rem] sm:p-[0.5rem] text-[0.75rem] sm:text-[0.875rem] border rounded-md ${
										error.code || authCodeStatus === "error"
											? "border-red-500"
											: authCodeStatus === "success"
												? "border-green-500"
												: "border-gray-300"
									}`}
									placeholder="인증번호 6자리"
									maxLength={6}
									disabled={isVerified}
								/>
								{timerActive && (
									<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[0.75rem] text-primary-dark">
										{formatTime(timer)}
									</span>
								)}
							</div>

							{error.code && (
								<p className="text-red-500 text-[0.675rem] sm:text-[0.75rem]">
									{error.code}
								</p>
							)}

							{authCodeStatus === "error" && !error.code && (
								<p className="text-red-500 text-[0.675rem] sm:text-[0.75rem]">
									인증 코드가 일치하지 않습니다.
								</p>
							)}

							{authCodeStatus === "success" && (
								<p className="text-green-500 text-[0.675rem] sm:text-[0.75rem]">
									인증되었습니다.
								</p>
							)}

							<div className="flex items-center space-x-2">
								<button
									type="button"
									className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] bg-primary-20 text-primary-dark rounded"
									onClick={handleVerifyCode}
									disabled={
										isVerifying || resetData.code.length !== 6 || isVerified
									}
								>
									{isVerifying ? "확인 중..." : "인증 확인"}
								</button>
							</div>
						</div>
					)}

					{isVerified && (
						<div>
							<PasswordInput
								id="reset-password"
								label=""
								name="password"
								value={resetData.password}
								onChange={handleResetChange}
								error={error.password}
								placeholder="새 비밀번호"
							/>
							<PasswordInput
								id="reset-password-confirm"
								label=""
								name="passwordConfirm"
								value={resetData.passwordConfirm}
								onChange={handleResetChange}
								error={error.passwordConfirm}
								placeholder="새 비밀번호 확인"
							/>
						</div>
					)}
				</div>

				<div className="mt-[0.75rem] sm:mt-[1rem] space-y-[0.375rem] sm:space-y-[0.5rem]">
					<button
						type="submit"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium rounded-md
						text-white bg-base-black hover:bg-neutral-900 focus:ring-base-black
						disabled:bg-base-muted disabled:text-base-muted-30
						focus:outline-none focus:ring-2 focus:ring-offset-2"
						disabled={
							!isVerified ||
							!resetData.email.trim() ||
							!resetData.password.trim() ||
							!resetData.passwordConfirm.trim() ||
							!!error.password ||
							!!error.passwordConfirm
						}
					>
						비밀번호 재설정
					</button>
				</div>
			</form>

			<div className="text-center mt-[1rem]">
				<Link to="/login" className="text-primary-dark hover:underline">
					로그인 페이지로 돌아가기
				</Link>
			</div>
		</div>
	);
};

export default PasswordResetForm;
