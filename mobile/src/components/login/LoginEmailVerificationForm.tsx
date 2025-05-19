import { StyleSheet, View } from "react-native";

import { Button, InputActionButton } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";

/**
 * LoginEmailVerificationFormProps는 LoginEmailVerificationForm 컴포넌트의 props 타입을 정의합니다.
 */
interface LoginEmailVerificationFormProps {
	navigation: any;
}

/**
 * LoginEmailVerificationForm 컴포넌트는 로그인 후 이메일 인증 폼을 렌더링합니다.
 * @param navigation
 */
export const LoginEmailVerificationForm = ({
	navigation,
}: LoginEmailVerificationFormProps) => {
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
					onChangeText={() => {}}
					rightElement={
						<InputActionButton inputType={"email"} onPress={() => {}}>
							<StyledText className={"text-xs text-primary-dark"}>
								인증번호 발송
							</StyledText>
						</InputActionButton>
					}
				/>
				{/*TODO: 인증번호 입력*/}
				{/*
					<Input
						placeholder={"인증번호"}
						autoComplete={"one-time-code"}
						keyboardType={"number-pad"}
						onChangeText={() => {}}
						rightElement={
							<InputActionButton
								inputType={"code"}
								onPress={() => {}}
								>
								<StyledText className={"text-xs text-gray-800"}>확인</StyledText>
							</InputActionButton>
						}
						/>
					*/}
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
						로그인
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
