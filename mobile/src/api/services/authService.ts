import * as SecureStore from "expo-secure-store";
import axios from "axios";

import axiosInstance from "@/api/axios";
import { LoginResponse } from "@/types/user";

export interface ProfileRequestDto {
	email: string;
	nickname: string;
	profileImageUrl: string;
}

interface LoginRequestDto {
	email: string;
	password: string;
}

export const authService = {
	/**
	 * 일반 로그인 API
	 * @param data 이메일과 비밀번호
	 * @returns LoginResponse
	 */
	login: async (data: LoginRequestDto): Promise<LoginResponse> => {
		try {
			console.log("Attempting login with:", { email: data.email });
			const response = await axiosInstance.post("/member/login", data);
			console.log("Login response:", response.data);

			// 토큰 저장
			const { token: authToken, ...userInfo } = response.data;
			await SecureStore.setItemAsync("auth-token", authToken);
			await SecureStore.setItemAsync("user-info", JSON.stringify(userInfo));

			return response.data;
		} catch (error: any) {
			console.error(
				"Login error details:",
				error.response?.data || error.message,
			);
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},

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
		} catch (error: any) {
			console.error("Kakao login error:", error);
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
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
		} catch (error: any) {
			console.error("Google login error:", error);
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},
};
