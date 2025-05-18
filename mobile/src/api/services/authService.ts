import { LoginResponse } from "@/types/user";
import axiosInstance from "../axios";
import * as SecureStore from "expo-secure-store";

interface KakaoProfileRequestDto {
	email: string;
	nickname: string;
	profileImageUrl: string;
}

export const authService = {
	/**
	 * 카카오 로그인 API
	 * @param token
	 * @returns
	 */
	kakaoLogin: async (data: KakaoProfileRequestDto): Promise<LoginResponse> => {
		try {
			const response = await axiosInstance.post(
				"/member/login/kakao/mobile",
				data,
			);

			// 토큰 저장
			const { token: authToken, ...userInfo } = response.data;
			await SecureStore.setItemAsync("auth-token", authToken);
			await SecureStore.setItemAsync("user-info", JSON.stringify(userInfo));

			return response.data;
		} catch (error) {
			console.error("Kakao login error:", error);
			throw error;
		}
	},

	/**
	 * 구글 로그인 API
	 * @param code
	 * @returns
	 */
	googleLogin: async (code: string): Promise<LoginResponse> => {
		try {
			const response = await axiosInstance.get("/member/login/google/mobile", {
				params: { code },
			});

			// 토큰 저장
			const { token: authToken, ...userInfo } = response.data;
			await SecureStore.setItemAsync("auth-token", authToken);
			await SecureStore.setItemAsync("user-info", JSON.stringify(userInfo));

			return response.data;
		} catch (error) {
			console.error("Google login error:", error);
			throw error;
		}
	},
};
