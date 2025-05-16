import { View } from "react-native";

import { AuthCodeSendButton, Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";

/**
 * PasswordResetFormProps는 PasswordResetForm의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface PasswordResetFormProps {
	navigation: any;
}

/**
 * PasswordResetForm은 비밀번호 재설정 폼입니다.
 * @param navigation
 */
export const PasswordResetForm = ({ navigation }: PasswordResetFormProps) => {
	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[0.5rem] gap-y-2"}>
					<Input
						label={"비밀번호 재설정"}
						placeholder={"이메일"}
						value={""}
						onChangeText={() => {}}
						keyboardType={"email-address"}
					/>
					<AuthCodeSendButton onPress={() => {}}>
						<StyledText
							className={
								"font-semibold text-center text-[1rem] text-primary-dark"
							}
						>
							인증번호 발송
						</StyledText>
					</AuthCodeSendButton>
					{/*TODO: 이메일 인증 로직 추가*/}
					{/*
                    <Input
                        placeholder={"인증번호"}
                        value={""}
                        onChangeText={() => {}}
                        keyboardType={"number-pad"}
                        rightElement={
                            <InputActionButton inputType={"code"} onPress={() => {}} >
                                <StyledText className={"text-xs text-gray-800"}>확인</StyledText>
                            </InputActionButton>
                        }
                    />
                    <Input
                        placeholder={"새 비밀번호"}
                        value={""}
                        onChangeText={() => {}}
                        keyboardType={"default"}
                    />
                    <Input
                        placeholder={"새 비밀번호 확인"}
                        value={""}
                        onChangeText={() => {}}
                        keyboardType={"default"}
                    />
                    */}
				</View>
				{/*TODO: 비밀번호 재설정 로직 추가*/}
				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={() => {}}
					disabled={true}
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
