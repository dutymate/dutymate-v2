import { View } from "react-native";

import {
	AuthCodeSendButton,
	Button,
	InputActionButton,
} from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { AgreementCheckbox } from "./AgreementCheckbox";
import { useState } from "react";
import { useEmailVerification } from "@/hooks/common/useEmailVerification";

/**
 * SignupFormProps는 SignupForm의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface SignupFormProps {
	navigation: any;
}

/**
 * SignupForm은 회원가입 폼입니다.
 * @param navigation
 */
export const SignupForm = ({ navigation }: SignupFormProps) => {
	// 회원가입 데이터 상태
	const [signupData, setSignupData] = useState({
		email: "",
		password: "",
		passwordConfirm: "",
		name: "",
	});

	// 동의 체크박스 상태
	const [isChecked, setIsChecked] = useState(false);

	// 이메일 인증 관련 상태
	const {
		email,
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
		resetVerification,
	} = useEmailVerification("signup");

	// 비밀번호 유효성 검사
	const validatePassword = (password: string) =>
		/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
			password,
		);

	// 타이머 형식 변환 함수 (300초 -> 5:00 형태)
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// 인증 번호 발송
	const handleSendAuthCode = async () => {
		await sendCode();
	};

	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[0.5rem] gap-y-2"}>
					<Input
						label={"회원가입"}
						placeholder={"이메일"}
						value={email}
						onChangeText={setEmail}
						keyboardType={"email-address"}
						error={emailError}
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

					{/*TODO: 이메일 인증 로직 추가*/}
					{authCodeSent && (
						<Input
							placeholder={"인증번호"}
							value={authCode}
							onChangeText={setAuthCode}
							keyboardType={"number-pad"}
							rightElement={
								<View className="flex-row items-center">
									{/* 타이머 표시 */}
									<StyledText className="text-red-500 font-bold text-sm mr-2">
										{!isVerified ? formatTime(timer) : ""}
									</StyledText>

									<InputActionButton
										inputType={"code"}
										onPress={verifyCode}
										disabled={isVerified}
									>
										<StyledText className={"text-xs text-gray-800"}>
											확인
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
							successText={
								authCodeStatus === "success" ? "인증되었습니다." : undefined
							}
							editable={!isVerified}
						/>
					)}
					{isVerified && (
						<View>
							<Input
								placeholder={"비밀번호"}
								value={""}
								onChangeText={() => {}}
								keyboardType={"default"}
							/>
							<Input
								placeholder={"비밀번호 확인"}
								value={""}
								onChangeText={() => {}}
								keyboardType={"default"}
							/>
							<Input
								placeholder={"이름"}
								value={""}
								onChangeText={() => {}}
								keyboardType={"default"}
							/>
							<AgreementCheckbox
								isChecked={isChecked}
								disabled={false}
								onPress={() => setIsChecked(!isChecked)}
							/>
						</View>
					)}
				</View>
				{/*TODO: 회원가입 로직 추가*/}
				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={() => navigation.navigate("ExtraInfo")}
					disabled={false}
					className={
						"w-full px-[0.75rem] py-[0.5rem] mt-2 bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black"
					}
				>
					<StyledText className={"text-[1rem] font-semibold text-white"}>
						회원가입
					</StyledText>
				</Button>
				<View className={"mt-[1.125rem] gap-y-[0.625rem]"}>
					<View>
						<StyledText className={"text-center text-lg text-gray-600"}>
							이미 계정이 있으신가요?{" "}
							<StyledText
								className={"text-primary-dark hover:underline"}
								onPress={() => navigation.navigate("Login")}
							>
								로그인
							</StyledText>
						</StyledText>
					</View>
				</View>
			</View>
		</View>
	);
};
