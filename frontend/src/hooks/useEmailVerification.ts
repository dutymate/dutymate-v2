import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import userService from "@/services/userService";

export const useEmailVerification = (mode: "login" | "signup") => {
	const [email, setEmail] = useState("");
	const [authCode, setAuthCode] = useState("");
	const [authCodeSent, setAuthCodeSent] = useState(false);
	const [authCodeStatus, setAuthCodeStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [isVerified, setIsVerified] = useState(false);
	const [timer, setTimer] = useState(300);
	const [authCodeExpired, setAuthCodeExpired] = useState(false);
	const [emailError, setEmailError] = useState<string | undefined>(undefined);
	const [isSending, setIsSending] = useState(false);

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

	const validateEmail = (email: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const sendCode = async () => {
		if (!validateEmail(email.trim())) {
			setEmailError("올바른 이메일 형식이 아닙니다.");
			setTimeout(() => setEmailError(undefined), 3000);
			return;
		}

		try {
			setAuthCode("");
			setAuthCodeStatus("idle");
			setIsVerified(false);
			setIsSending(true);

			await userService.sendEmailAuthCode(email.trim(), mode);
			setAuthCodeSent(true);
			setTimer(300);
			setAuthCodeExpired(false);
			toast.success("인증번호가 발송되었습니다.");
		} catch (err: any) {
			toast.error(err?.message || "인증번호 발송 실패");
		} finally {
			setIsSending(false);
		}
	};

	const verifyCode = async () => {
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
				toast.success("이메일 인증이 완료되었습니다.");
			} else {
				throw new Error();
			}
		} catch (err) {
			setAuthCodeStatus("error");
			setIsVerified(false);
			setAuthCode("");
			toast.error("인증 코드가 올바르지 않습니다.");
		}
	};

	const resetVerification = () => {
		setAuthCode("");
		setAuthCodeStatus("idle");
		setAuthCodeSent(false);
		setIsVerified(false);
		setTimer(300);
		setAuthCodeExpired(false);
	};

	return {
		email,
		setEmail,
		authCode,
		setAuthCode,
		authCodeSent,
		authCodeStatus,
		isVerified,
		timer,
		authCodeExpired,
		emailError,
		isSending,
		sendCode,
		verifyCode,
		resetVerification,
	};
};
