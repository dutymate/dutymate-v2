import { LoginResponse } from "@/types/user";
import axiosInstance from "../axios";
import * as SecureStore from "expo-secure-store";

export interface ProfileRequestDto {
	email: string;
	nickname: string;
	profileImageUrl: string;
}

export const authService = {
	/**
	 * 카카오 로그인 API
	 * @param data 카카오 로그인 정보
	 * @returns 로그인 응답 데이터
	 */
	kakaoLogin: async (data: ProfileRequestDto): Promise<LoginResponse> => {
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
	 * @param data 구글 로그인 정보
	 * @returns 로그인 응답 데이터
	 */
	googleLogin: async (data: ProfileRequestDto): Promise<LoginResponse> => {
		try {
			const response = await axiosInstance.post(
				"/member/login/google/mobile",
				data,
			);

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
