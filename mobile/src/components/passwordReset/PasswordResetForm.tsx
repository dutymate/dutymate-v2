import React, { useEffect, useState } from "react";
import { View, Clipboard } from "react-native";
import Toast from "react-native-toast-message";

import { userService } from "@/api/services/userService";
import {
	AuthCodeSendButton,
	Button,
	InputActionButton,
} from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { useEmailVerification } from "@/hooks/common/useEmailVerification";

/**
 * PasswordResetFormProps는 PasswordResetForm의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface PasswordResetFormProps {
	navigation: any;
}

interface ResetPasswordData {
	email: string;
	password: string;
	passwordConfirm: string;
}

/**
 * 이메일 형식 검증 함수
 */
const validateEmail = (email: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * 비밀번호 형식 검증 함수 - 8자 이상, 숫자 및 특수문자 포함
 */
const validatePassword = (password: string) =>
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

/**
 * 타이머 포맷팅 함수
 */
const formatTime = (seconds: number) => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * PasswordResetForm은 비밀번호 재설정 폼입니다.
 * @param navigation
 */
export const PasswordResetForm = ({ navigation }: PasswordResetFormProps) => {
	const [resetData, setResetData] = useState<ResetPasswordData>({
		email: "",
		password: "",
		passwordConfirm: "",
	});

	const [error, setError] = useState<{
		email?: string;
		password?: string;
		passwordConfirm?: string;
	}>({});

	const {
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
		// resetVerification,
	} = useEmailVerification("reset");

	// 이메일 값이 변경될 때 resetData의 email 값도 업데이트
	useEffect(() => {
		setResetData((prev) => ({ ...prev, email }));
	}, [email]);

	// 인증 시간 만료 시 처리
	useEffect(() => {
		if (timer === 0 && authCodeSent && !isVerified) {
			Toast.show({
				type: "error",
				text1: "인증 시간이 만료되었습니다.",
				text2: "재발송 버튼을 눌러 다시 인증해주세요.",
			});
		}
	}, [timer, authCodeSent, isVerified]);

	// 인증번호 붙여넣기 처리 핸들러
	const handleAuthCodePaste = async () => {
		try {
			const clipboardContent = await Clipboard.getString();
			if (clipboardContent && /^\d+$/.test(clipboardContent)) {
				setAuthCode(clipboardContent);
			}
		} catch (error) {
			console.error("Failed to paste from clipboard:", error);
		}
	};

	// 입력 값 변경 핸들러
	const handleInputChange = (field: keyof ResetPasswordData, value: string) => {
		setResetData((prev) => ({ ...prev, [field]: value }));

		let errorMessage = "";
		if (field === "password") {
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
			} else if (resetData.passwordConfirm) {
				setError((prev) => ({ ...prev, passwordConfirm: undefined }));
			}
		} else if (field === "passwordConfirm") {
			if (value.trim() !== resetData.password.trim())
				errorMessage = "비밀번호가 일치하지 않습니다.";
		}
		setError((prev) => ({ ...prev, [field]: errorMessage }));
	};

	// 비밀번호 재설정 제출 핸들러
	const handleResetSubmit = async () => {
		let isValid = true;
		let newErrors: typeof error = {};

		if (!resetData.email.trim() || !validateEmail(resetData.email.trim())) {
			newErrors.email = !resetData.email.trim()
				? "이메일을 입력해 주세요."
				: "올바른 이메일 형식이 아닙니다.";
			isValid = false;
		}

		if (!isVerified) {
			Toast.show({
				type: "error",
				text1: "이메일 인증이 필요합니다.",
			});
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
			Toast.show({
				type: "success",
				text1: "비밀번호가 성공적으로 재설정되었습니다.",
			});
			navigation.navigate("Login");
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: error?.message || "비밀번호 재설정에 실패했습니다.",
			});
		}
	};

	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[0.5rem] gap-y-2"}>
					<Input
						label={"비밀번호 재설정"}
						placeholder={"이메일"}
						value={email}
						onChangeText={(text) => setEmail(text)}
						keyboardType={"email-address"}
						error={emailError || error.email}
						editable={!authCodeSent && !isVerified}
					/>
					{!authCodeSent && (
						<AuthCodeSendButton onPress={sendCode}>
							<StyledText
								className={
									"font-semibold text-center text-[1rem] text-primary-dark"
								}
							>
								{isSending ? "발송 중..." : "인증번호 발송"}
							</StyledText>
						</AuthCodeSendButton>
					)}

					{authCodeSent && !isVerified && (
						<Input
							placeholder={"인증번호"}
							value={authCode}
							onChangeText={setAuthCode}
							keyboardType={"number-pad"}
							onFocus={handleAuthCodePaste}
							rightElement={
								<View className="flex-row items-center">
									{/* 타이머 표시 */}
									<StyledText className="text-red-500 font-bold text-sm mr-2">
										{formatTime(timer)}
									</StyledText>

									<InputActionButton
										inputType={"code"}
										onPress={authCodeExpired ? sendCode : verifyCode}
									>
										<StyledText className={"text-xs text-gray-800"}>
											{authCodeExpired
												? isSending
													? "발송 중..."
													: "재발송"
												: "확인"}
										</StyledText>
									</InputActionButton>
								</View>
							}
							status={authCodeStatus}
							error={
								authCodeStatus === "error"
									? "인증 코드가 일치하지 않습니다."
									: undefined
							}
						/>
					)}

					{isVerified && (
						<>
							<Input
								placeholder={"새 비밀번호"}
								value={resetData.password}
								onChangeText={(text) => handleInputChange("password", text)}
								keyboardType={"default"}
								secureTextEntry={true}
								error={error.password}
							/>
							<Input
								placeholder={"새 비밀번호 확인"}
								value={resetData.passwordConfirm}
								onChangeText={(text) =>
									handleInputChange("passwordConfirm", text)
								}
								keyboardType={"default"}
								secureTextEntry={true}
								error={error.passwordConfirm}
							/>
						</>
					)}
				</View>

				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={handleResetSubmit}
					disabled={
						!isVerified ||
						!resetData.email.trim() ||
						!resetData.password.trim() ||
						!resetData.passwordConfirm.trim() ||
						!!error.password ||
						!!error.passwordConfirm
					}
					className={
						"w-full px-[0.75rem] py-[0.5rem] bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black"
					}
				>
					<StyledText className={"text-[1rem] font-semibold text-white"}>
						비밀번호 재설정
					</StyledText>
				</Button>
				<View className={"mt-[1.125rem] gap-y-[0.625rem]"}>
					<View>
						<StyledText className={"text-center text-lg text-gray-600"}>
							변경하지 않고{" "}
							<StyledText
								className={"text-primary-dark hover:underline"}
								onPress={() => navigation.navigate("Login")}
							>
								로그인 하기
							</StyledText>
						</StyledText>
					</View>
				</View>
			</View>
		</View>
	);
};
