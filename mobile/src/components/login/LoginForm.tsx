import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { View } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login, me } from "@react-native-kakao/user";
import Toast from "react-native-toast-message";
import { authService } from "@/api/services/authService";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { SocialLoginButton } from "@/components/login/SocialLoginButton";
import { LoginEmailVerificationForm } from "@/components/login/LoginEmailVerificationForm";
import { useUserAuthStore } from "@/store/userAuthStore";
import { LoginResponse } from "@/types/user";
import { navigateBasedOnUserRole } from "@/utils/navigation";

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
	const [loginData, setLoginData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState<{ email?: string; password?: string }>({});
	const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

	// 로그인 성공 후 공통 처리 함수
	const handleLoginSuccess = async (
		loginResponse: LoginResponse,
		provider?: string,
	) => {
		try {
			// 로그인 정보를 Zustand 스토어에 저장
			setUserInfo({
				...loginResponse,
				...(provider && { provider }),
			});

			// 초대 토큰이 있는지 확인
			const inviteToken = await SecureStore.getItemAsync("inviteToken");
			if (inviteToken) {
				Toast.show({
					type: "success",
					text1: "정상적으로 로그인되었습니다.",
				});
				navigation.navigate("WebView", { inviteToken });
				await SecureStore.deleteItemAsync("inviteToken");
				return;
			}

			// 공통 네비게이션 로직 사용
			navigateBasedOnUserRole(navigation, loginResponse);
		} catch (error: any) {
			console.error("Login handling error:", error);
			Toast.show({
				type: "error",
				text1: error.message || "로그인 처리 중 오류가 발생했습니다.",
				text2: "다시 시도해주세요.",
			});
		}
	};

	const handleLoginChange = (name: string, value: string) => {
		setLoginData((prev) => ({
			...prev,
			[name]: value,
		}));

		// 입력 변경 시, 에러 메세지 초기화
		setError((prev) => ({
			...prev,
			[name]: "",
		}));
	};

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
				email: profile.email,
				nickname: profile.nickname,
				profileImageUrl: profile.profileImageUrl,
			};

			// authService를 통해 백엔드로 코드 전송
			const loginResponse = await authService.kakaoLogin(profileData);

			// 공통 로그인 성공 처리 함수 호출
			await handleLoginSuccess(loginResponse, "kakao");
		} catch (error: any) {
			console.error("Kakao login error:", error);
			Toast.show({
				type: "error",
				text1: error.message || "카카오 로그인에 실패했습니다.",
				text2: "다시 시도해주세요.",
			});
		}
	};

	const handleGoogleLogin = async () => {
		try {
			console.log("Google login started");
			// 구글 로그인 시도
			await GoogleSignin.hasPlayServices();
			console.log("Google Play Services available");

			const userInfo = await GoogleSignin.signIn();
			console.log("Google Sign In completed");

			// 디버깅을 위한 로그
			console.log("Google userInfo:", JSON.stringify(userInfo, null, 2));
			console.log("userInfo structure:", Object.keys(userInfo));

			// 로그인이 취소된 경우
			if (userInfo.type === "cancelled") {
				console.log("Google login was cancelled by user");
				throw new Error("구글 로그인이 취소되었습니다.");
			}

			// 구글 사용자 정보가 없는 경우
			if (!userInfo.data?.user) {
				console.log("Google user info not available");
				throw new Error("구글 계정 정보를 가져올 수 없습니다.");
			}

			// 구글 로그인 응답에서 사용자 정보 가져오기
			const profileData = {
				email: userInfo.data?.user.email || "",
				nickname: userInfo.data?.user.name || "",
				profileImageUrl: userInfo.data?.user.photo || "",
			};

			// 필수 정보가 없는 경우 오류 처리
			if (!profileData.email) {
				console.log("No email was provided from Google login");
				throw new Error("구글 계정에서 이메일을 가져올 수 없습니다.");
			}

			// authService를 통해 백엔드로 데이터 전송
			const loginResponse = await authService.googleLogin(profileData);

			console.log(
				"Google loginResponse:",
				JSON.stringify(loginResponse, null, 2),
			);

			// 공통 로그인 성공 처리 함수 호출
			await handleLoginSuccess(loginResponse, "google");
		} catch (error: any) {
			console.error("Google login error:", error);
			Toast.show({
				type: "error",
				text1: error.message || "구글 로그인에 실패했습니다.",
				text2: "다시 시도해주세요.",
			});
		}
	};

	// 이메일 인증이 필요한 경우 이메일 인증 폼을 렌더링
	if (needsEmailVerification) {
		return (
			<LoginEmailVerificationForm
				navigation={navigation}
				email={loginData.email}
			/>
		);
	}

	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[1rem]"}>
					<Input
						label={"이메일"}
						placeholder={"이메일"}
						value={loginData.email}
						onChangeText={(text) => handleLoginChange("email", text)}
						keyboardType={"email-address"}
						error={error.email}
					/>
				</View>
				<View className={"mb-[1.5rem]"}>
					<Input
						label={"비밀번호"}
						placeholder={"비밀번호"}
						value={loginData.password}
						onChangeText={(text) => handleLoginChange("password", text)}
						secureTextEntry={true}
						keyboardType={"default"}
						error={error.password}
					/>
				</View>
			</View>
			<Button
				color={"black"}
				size={"lg"}
				width={"long"}
				onPress={async () => {
					try {
						// 입력값 검증
						if (!loginData.email.trim()) {
							setError((prev) => ({
								...prev,
								email: "이메일을 입력해주세요.",
							}));
							return;
						}

						if (!loginData.password.trim()) {
							setError((prev) => ({
								...prev,
								password: "비밀번호를 입력해주세요.",
							}));
							return;
						}

						// 로그인 API 호출
						const loginResponse = await authService.login({
							email: loginData.email.trim(),
							password: loginData.password.trim(),
						});

						// 공통 로그인 성공 처리 함수 호출
						await handleLoginSuccess(loginResponse);
					} catch (error: any) {
						console.error("Login error:", error);

						// 이메일 인증이 필요한 경우 처리
						if (
							error.message === "이메일 인증을 진행해주세요." ||
							error.response?.data?.message === "이메일 인증을 진행해주세요."
						) {
							setNeedsEmailVerification(true);
							return;
						}

						Toast.show({
							type: "error",
							text1: "이메일 또는 비밀번호가 일치하지 않습니다.",
							text2: "다시 시도해주세요.",
						});
					}
				}}
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
