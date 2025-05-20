import * as SecureStore from "expo-secure-store";
import axios from "axios";

import axiosInstance from "@/api/axios";
import { userService } from "@/api/services/userService";
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
			console.log("googleLogin data", data);
			
			// 백엔드 URL 확인
			console.log("API URL:", axiosInstance.defaults.baseURL);
			
			// API 호출 시도
			console.log("Attempting to call API...");
			const response = await axiosInstance.post(
				"/member/login/google/mobile",
				data,
			);
			console.log("googleLogin response", response.data);
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

	/**
	 * 이메일 인증 코드 발송 API
	 * @param email 인증 코드를 받을 이메일
	 * @returns Promise<void>
	 */
	sendVerificationEmail: async (email: string): Promise<void> => {
		return userService.sendEmailAuthCode(email, "login");
	},

	/**
	 * 이메일 인증 코드 확인 API
	 * @param email 인증 코드를 받은 이메일
	 * @param code 입력한 인증 코드
	 * @returns Promise<any>
	 */
	verifyEmail: async (email: string, code: string): Promise<any> => {
		return userService.verifyEmailCode({ email, code });
	},
};
