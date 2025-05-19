import { View } from "react-native";

import {
	AuthCodeSendButton,
	Button,
	InputActionButton,
} from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { AgreementCheckbox } from "./AgreementCheckbox";
import { useState, useEffect } from "react";
import { useEmailVerification } from "@/hooks/common/useEmailVerification";
import Toast from "react-native-toast-message";
import { validateName } from "@/utils/validate";
import { userService } from "@/api/services/userService";

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
		password: "",
		passwordConfirm: "",
		name: "",
	});

	// 에러 상태
	const [error, setError] = useState<{
		password?: string;
		passwordConfirm?: string;
		name?: string;
	}>({});

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


	// 비밀번호 변경 핸들러
	const handlePasswordChange = (value: string) => {
		setSignupData(prev => ({ ...prev, password: value }));
		
		let errorMessage = '';
		if (!validatePassword(value.trim())) {
			errorMessage = '8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
		}
		if (
			signupData.passwordConfirm &&
			value.trim() !== signupData.passwordConfirm.trim()
		) {
			setError(prev => ({
				...prev,
				passwordConfirm: '비밀번호가 일치하지 않습니다.',
			}));
		}
		setError(prev => ({ ...prev, password: errorMessage }));
	};

	// 비밀번호 확인 변경 핸들러
	const handlePasswordConfirmChange = (value: string) => {
		setSignupData(prev => ({ ...prev, passwordConfirm: value }));
		
		let errorMessage = '';
		if (value.trim() !== signupData.password.trim()) {
			errorMessage = '비밀번호가 일치하지 않습니다.';
		}
		setError(prev => ({ ...prev, passwordConfirm: errorMessage }));
	};

	// 이름 변경 핸들러
	const handleNameChange = (value: string) => {
		setSignupData(prev => ({ ...prev, name: value }));
		
		let errorMessage = '';
		const nameValidation = validateName(value.trim());
		if (!nameValidation.isValid) {
			errorMessage = nameValidation.message;
		}
		setError(prev => ({ ...prev, name: errorMessage }));
	};

	// 회원가입 제출 핸들러
	const handleSignupSubmit = async () => {
		let isValid = true;
		let newErrors: typeof error = {};

		if (
			!signupData.password.trim() ||
			!validatePassword(signupData.password.trim())
		) {
			newErrors.password = !signupData.password.trim()
				? '비밀번호를 입력해주세요.'
				: '비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
			isValid = false;
		}
		
		if (
			!signupData.passwordConfirm.trim() ||
			signupData.passwordConfirm.trim() !== signupData.password.trim()
		) {
			newErrors.passwordConfirm = !signupData.passwordConfirm.trim()
				? '비밀번호 확인을 입력해주세요.'
				: '비밀번호가 일치하지 않습니다.';
			isValid = false;
		}
		
		if (!signupData.name.trim()) {
			newErrors.name = '이름을 입력해 주세요.';
			isValid = false;
		} else {
			const nameValidation = validateName(signupData.name.trim());
			if (!nameValidation.isValid) {
				newErrors.name = nameValidation.message;
				isValid = false;
			}
		}
		
		if (!isChecked) {
			Toast.show({
				type: 'error',
				text1: '개인정보 수집 및 이용에 동의해주세요.',
			});
			return;
		}
		
		if (!isValid) {
			setError(newErrors);
			return;
		}

		try {
			await userService.checkEmail(email.trim());
			await userService.signup({
				email: email.trim(),
				password: signupData.password.trim(),
				passwordConfirm: signupData.passwordConfirm.trim(),
				name: signupData.name.trim(),
			});
			
			Toast.show({
				type: 'success',
				text1: '정상적으로 회원가입 되었습니다.',
			});
			navigation.navigate("ExtraInfo");
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: error.message || '회원가입 중 오류가 발생했습니다.',
			});
		}
	};

	// 타이머 만료 처리
	useEffect(() => {
		if (timer === 0 && authCodeSent && !isVerified) {
			resetVerification();
			setEmail('');
			
		}
	}, [timer, authCodeSent, isVerified]);

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
								value={signupData.password}
								onChangeText={handlePasswordChange}
								keyboardType={"default"}
								secureTextEntry={true}
								error={error.password}
							/>
							<Input
								placeholder={"비밀번호 확인"}
								value={signupData.passwordConfirm}
								onChangeText={handlePasswordConfirmChange}
								keyboardType={"default"}
								secureTextEntry={true}
								error={error.passwordConfirm}
							/>
							<Input
								placeholder={"이름"}
								value={signupData.name}
								onChangeText={handleNameChange}
								keyboardType={"default"}
								error={error.name}
							/>
							<AgreementCheckbox
								isChecked={isChecked}
								disabled={false}
								onPress={() => setIsChecked(!isChecked)}
							/>
						</View>
					)}
				</View>
				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={handleSignupSubmit}
					disabled={
						!isVerified ||
						!email ||
						!signupData.password ||
						!signupData.passwordConfirm ||
						!signupData.name ||
						!isChecked
					}
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
