import { View } from "react-native";

import { Button } from "@/components/button/Button";
import { SocialLoginButton } from "@/components/button/SocialLoginButton";
import { Card } from "@/components/card/Card";
import { StyledText } from "@/components/custom/StyledText";
import { Input } from "@/components/input/Input";

/**
 * LoginFormProps는 LoginScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface LoginFormProps {
	navigation: any;
}

/**
 * LoginForm은 로그인 폼 컴포넌트입니다.
 * @param navigation
 */
export const LoginForm = ({ navigation }: LoginFormProps) => {
	return (
		<Card>
			<View className={"lg:block"}>
				<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
					<View className={"mb-[1rem]"}>
						<Input
							label={"이메일"}
							placeholder={"이메일"}
							value={""}
							onChangeText={() => {}}
							keyboardType={"email-address"}
						/>
					</View>
					<View className={"mb-[1.5rem]"}>
						<Input
							label={"비밀번호"}
							placeholder={"비밀번호"}
							value={""}
							onChangeText={() => {}}
							secureTextEntry={true}
						/>
					</View>
				</View>
				<Button
					color={"black"}
					size={"lg"}
					width={"long"}
					onPress={() => navigation.navigate("WebView")}
					className={
						"w-full px-[0.75rem] py-[0.5rem] bg-base-black rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-base-black"
					}
				>
					<StyledText className={"text-[1rem] font-semibold text-white"}>
						로그인
					</StyledText>
				</Button>
				<View className={"mt-[1rem] mb-[1rem] space-y-[0.75rem]"}>
					<View className={"flex-row items-center"}>
						<View className={"flex-grow h-[0.0625rem] bg-gray-200"}></View>
						<StyledText
							className={
								"px-[0.75rem] text-[1rem] sm:text-[0.875rem] text-gray-500"
							}
						>
							또는
						</StyledText>
						<View className={"flex-grow h-[0.0625rem] bg-gray-200"}></View>
					</View>
				</View>
				<View className={"flex flex-col gap-y-[1rem]"}>
					<SocialLoginButton social={"kakao"} onPress={() => {}} />
					<SocialLoginButton social={"google"} onPress={() => {}} />
				</View>
				<View className={"mt-[1.125rem] gap-y-[0.625rem]"}>
					<View>
						{/*TODO: 회원가입 페이지로 이동*/}
						<StyledText className={"text-center text-gray-600"}>
							계정이 없으신가요?{" "}
							<StyledText
								className={"text-primary-dark hover:underline"}
								onPress={() => navigation.navigate("WebView")}
							>
								회원가입
							</StyledText>
						</StyledText>
					</View>
					<View>
						{/*TODO: 비밀번호 찾기 페이지로 이동*/}
						<StyledText className={"text-center text-gray-600"}>
							비밀번호를 잊으셨나요?{" "}
							<StyledText
								className={"text-primary-dark hover:underline"}
								onPress={() => navigation.navigate("WebView")}
							>
								비밀번호 찾기
							</StyledText>
						</StyledText>
					</View>
				</View>
			</View>
		</Card>
	);
};
