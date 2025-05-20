import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import { authService } from "@/api/services/authService";
import { Button, InputActionButton } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";

/**
 * LoginEmailVerificationFormProps는 LoginEmailVerificationForm 컴포넌트의 props 타입을 정의합니다.
 */
interface LoginEmailVerificationFormProps {
	navigation: any;
	email: string;
}

/**
 * LoginEmailVerificationForm 컴포넌트는 로그인 후 이메일 인증 폼을 렌더링합니다.
 * @param navigation
 * @param email
 */
export const LoginEmailVerificationForm = ({
	navigation,
	email,
}: LoginEmailVerificationFormProps) => {
	const [verificationEmail, setVerificationEmail] = useState(email || "");
	const [verificationCode, setVerificationCode] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<{ email?: string; code?: string }>({});

	const handleSendVerificationCode = async () => {
		try {
			if (!verificationEmail.trim()) {
				setError((prev) => ({
					...prev,
					email: "이메일을 입력해주세요.",
				}));
				return;
			}

			// 이메일 형식 검증을 위한 정규식
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(verificationEmail)) {
				setError((prev) => ({
					...prev,
					email: "유효한 이메일 형식이 아닙니다.",
				}));
				return;
			}

			// 인증 코드 발송 API 호출
			await authService.sendVerificationEmail(verificationEmail);

			setCodeSent(true);
			Toast.show({
				type: "success",
				text1: "인증번호가 발송되었습니다.",
				text2: "이메일을 확인해주세요.",
			});
		} catch (error: any) {
			console.error("Verification code sending error:", error);
			Toast.show({
				type: "error",
				text1: "인증번호 발송에 실패했습니다.",
				text2: "다시 시도해주세요.",
			});
		}
	};

	const handleVerifyCode = async () => {
		try {
			setIsVerifying(true);

			if (!verificationCode.trim()) {
				setError((prev) => ({
					...prev,
					code: "인증번호를 입력해주세요.",
				}));
				setIsVerifying(false);
				return;
			}

			// 인증 코드 확인 API 호출
			await authService.verifyEmail(verificationEmail, verificationCode);

			Toast.show({
				type: "success",
				text1: "이메일 인증이 완료되었습니다.",
				text2: "로그인을 진행해주세요.",
			});

			// 인증 완료 후 로그인 페이지로 이동
			navigation.navigate("Login");
		} catch (error: any) {
			console.error("Code verification error:", error);
			Toast.show({
				type: "error",
				text1: "인증번호가 일치하지 않습니다.",
				text2: "다시 확인해주세요.",
			});
		} finally {
			setIsVerifying(false);
		}
	};

	const handleEmailChange = (text: string) => {
		setVerificationEmail(text);
		setError((prev) => ({ ...prev, email: undefined }));
	};

	const handleCodeChange = (text: string) => {
		setVerificationCode(text);
		setError((prev) => ({ ...prev, code: undefined }));
	};

	return (
		<View>
			<StyledText
				className={"text-center text-gray-900 mb-4"}
				style={styles.h1}
			>
				이메일 인증
			</StyledText>
			<View className={"mb-[1rem]"}>
				<StyledText className={"text-center text-md text-gray-700"}>
					로그인을 위해 이메일 인증이 필요합니다.
				</StyledText>
				<StyledText className={"text-center text-md text-gray-700"}>
					이메일을 입력 후 인증번호를 요청해주세요.
				</StyledText>
			</View>
			<View className={"gap-y-2"}>
				<Input
					placeholder={"이메일"}
					autoComplete={"username"}
					keyboardType={"email-address"}
					value={verificationEmail}
					onChangeText={handleEmailChange}
					error={error.email}
					rightElement={
						<InputActionButton
							inputType={"email"}
							onPress={handleSendVerificationCode}
						>
							<StyledText className={"text-xs text-primary-dark"}>
								인증번호 발송
							</StyledText>
						</InputActionButton>
					}
				/>
				{codeSent && (
					<Input
						placeholder={"인증번호"}
						autoComplete={"one-time-code"}
						keyboardType={"number-pad"}
						value={verificationCode}
						onChangeText={handleCodeChange}
						error={error.code}
						rightElement={
							<InputActionButton inputType={"code"} onPress={handleVerifyCode}>
								<StyledText className={"text-xs text-gray-800"}>
									확인
								</StyledText>
							</InputActionButton>
						}
					/>
				)}
				<StyledText className={"text-center text-sm text-gray-500 my-2"}>
					※ 스팸 메일함도 확인해 보세요!
				</StyledText>
				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={() => navigation.navigate("Login")}
					className={
						"w-full px-[0.75rem] py-[0.5rem] bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black"
					}
				>
					<StyledText className={"text-[1rem] font-semibold text-white"}>
						로그인으로 돌아가기
					</StyledText>
				</Button>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	h1: {
		fontSize: 20,
		fontWeight: 900,
		marginBottom: 16,
	},
});
