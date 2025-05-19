import { View } from "react-native";

import { authService } from "@/api/services/authService";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { SocialLoginButton } from "@/components/login/SocialLoginButton";
import { useUserAuthStore } from "@/store/userAuthStore";
import { login, me } from "@react-native-kakao/user";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
/**
 * LoginFormProps는 LoginScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface LoginFormProps {
	navigation: any;
}

/**
 * LoginForm 컴포넌트는 로그인 폼을 렌더링합니다.
 * @param navigation
 */
export const LoginForm = ({ navigation }: LoginFormProps) => {
	const { setUserInfo } = useUserAuthStore();

	const handleKakaoLogin = async () => {
		try {
			// 카카오 로그인 시도
			const token = await login();

			// 토큰이 없는 경우 에러 처리
			if (!token) {
				throw new Error("카카오 로그인에 실패했습니다.");
			}

			// 사용자 프로필 정보 가져오기
			const profile = await me();

			// 프로필 정보가 없는 경우 에러 처리
			if (!profile) {
				throw new Error("사용자 정보를 가져오는데 실패했습니다.");
			}

			const profileData = {
				email: profile?.email,
				nickname: profile?.nickname,
				profileImageUrl: profile?.profileImageUrl,
			};

			// authService를 통해 백엔드로 코드 전송
			const loginResponse = await authService.kakaoLogin(profileData);

			// 로그인 정보를 Zustand 스토어에 저장
			setUserInfo({
				...loginResponse,
				provider: "kakao",
			});

			// 초대 토큰이 있는지 확인
			const inviteToken = await SecureStore.getItemAsync("inviteToken");
			if (inviteToken) {
				Toast.show({
					type: "success",
					text1: "정상적으로 로그인되었습니다.",
				});
				// 현재 Invite 화면이 없으므로 WebView로 대체
				// TODO: Invite 화면 구현 후 수정
				navigation.navigate("WebView", { inviteToken });
				await SecureStore.deleteItemAsync("inviteToken");
				return;
			}

			// 로그인 후 이동 로직 (frontend/KakaoRedirect.tsx와 동일)
			const { role, existAdditionalInfo, existMyWard } = loginResponse;
			// console.log('Login Response:', loginResponse);
			// console.log('Role:', role);
			// console.log('Exist Additional Info:', existAdditionalInfo);
			// console.log('Exist My Ward:', existMyWard);

			// 추가 정보가 없는 경우
			if (!existAdditionalInfo) {
				navigation.navigate("ExtraInfo");
			}
			// 소속 병동이 없는 경우
			else if (!existMyWard) {
				if (role === "HN") {
					navigation.navigate("CreateWard");
				} else {
					// TODO: MyShift 화면 구현 후 수정
					navigation.navigate("WebView", { path: "/my-shift" });
				}
			}
			// 모든 정보가 있는 경우
			else {
				if (role === "HN") {
					// TODO: ShiftAdmin 화면 구현 후 수정
					navigation.navigate("WebView", { path: "/shift-admin" });
				} else {
					// TODO: MyShift 화면 구현 후 수정
					navigation.navigate("WebView", { path: "/my-shift" });
				}
			}
		} catch (error: any) {
			console.error("Kakao login error:", error);
			Toast.show({
				type: "error",
				text1: error.message,
				text2: "다시 시도해주세요.",
			});
		}
	};

	const handleGoogleLogin = async () => {
		// 구글 로그인 로직도 비슷하게 구현
		try {
			await GoogleSignin.hasPlayServices();
			const userInfo = await GoogleSignin.signIn();
			console.log(userInfo);

			// 프로필 정보가 없는 경우 에러 처리
			if (!userInfo) {
				throw new Error("사용자 정보를 가져오는데 실패했습니다.");
			}

			const profileData = {
				email: userInfo.data?.user.email || "",
				nickname: userInfo.data?.user.name || "",
				profileImageUrl: userInfo.data?.user.photo || "",
			};

			// authService를 통해 백엔드로 코드 전송
			const loginResponse = await authService.googleLogin(profileData);
			console.log(loginResponse);

			// 로그인 정보를 Zustand 스토어에 저장
			setUserInfo({
				...loginResponse,
				provider: "google",
			});
		} catch (error: any) {
			console.log(error);
		}
	};

	return (
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
						className={"px-[0.75rem] text-lg sm:text-[0.875rem] text-gray-500"}
					>
						또는
					</StyledText>
					<View className={"flex-grow h-[0.0625rem] bg-gray-200"}></View>
				</View>
			</View>
			<View className={"flex flex-col gap-y-[1rem]"}>
				<SocialLoginButton social={"kakao"} onPress={handleKakaoLogin} />
				<SocialLoginButton social={"google"} onPress={handleGoogleLogin} />
			</View>
			<View className={"mt-[1.125rem] gap-y-[0.625rem]"}>
				<View>
					<StyledText className={"text-center text-lg text-gray-600"}>
						계정이 없으신가요?{" "}
						<StyledText
							className={"text-primary-dark hover:underline"}
							onPress={() => navigation.navigate("Signup")}
						>
							회원가입
						</StyledText>
					</StyledText>
				</View>
				<View>
					<StyledText className={"text-center text-lg text-gray-600"}>
						비밀번호를 잊으셨나요?{" "}
						<StyledText
							className={"text-primary-dark hover:underline"}
							onPress={() => navigation.navigate("PasswordReset")}
						>
							비밀번호 재설정
						</StyledText>
					</StyledText>
				</View>
			</View>
		</View>
	);
};
