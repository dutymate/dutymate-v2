import axios from "axios";

import axiosInstance from "@/api/axios";
import { LoginResponse, AdditionalInfo } from "@/types/user";

interface SignupRequest {
	email: string;
	password: string;
	passwordConfirm: string;
	name: string;
}

interface AdditionalInfoResponse {
	role: "HN" | "RN";
}

interface PasswordResetRequest {
	email: string;
	password: string;
}

export const userService = {
	/**
	 * 이메일 인증 코드 API
	 */
	sendEmailAuthCode: async (email: string, path: string): Promise<void> => {
		try {
			await axiosInstance.post(
				"/member/email-verification",
				{ email },
				{
					params: { path }, // 쿼리 파라미터
				},
			);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message || "";

				// 소셜 로그인 관련 에러 메시지 처리
				if (
					errorMessage.includes("카카오") ||
					errorMessage.includes("구글") ||
					errorMessage.includes("다른 경로로 가입")
				) {
					throw {
						...error.response?.data,
						message: "이미 소셜 계정으로 가입된 이메일입니다.",
					};
				}

				throw error.response?.data;
			}
			throw error;
		}
	},

	/**
	 * 인증 코드 확인 API
	 */
	verifyEmailCode: async ({ email, code }: { email: string; code: string }) => {
		try {
			const response = await axiosInstance.post(
				"/member/email-verification/confirm",
				{
					email,
					code,
				},
			);
			return response;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},

	/**
	 * 이메일 중복 체크 api
	 * @param email
	 */
	checkEmail: async (email: string): Promise<void> => {
		try {
			await axiosInstance.get("/member/check-email", { params: { email } });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error;
			}
			throw error;
		}
	},

	/**
	 * 회원가입 API 연동
	 * @param data
	 * @returns
	 */
	signup: async (data: SignupRequest): Promise<LoginResponse> => {
		try {
			const response = await axiosInstance.post("/member", data);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},

	/**
	 * 부가정보 입력 API
	 * @param data - 부가정보 (연차, 성별, 역할)
	 */
	submitAdditionalInfo: async (
		data: AdditionalInfo,
	): Promise<AdditionalInfoResponse> => {
		try {
			const response = await axiosInstance.post("/member/info", data);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},

	/**
	 * 비밀번호 재설정 인증코드 요청 API
	 * @param email - 사용자 이메일
	 */
	requestPasswordReset: async (email: string): Promise<void> => {
		try {
			await axiosInstance.post("/member/password/reset-request", { email });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},

	/**
	 * 비밀번호 재설정 API
	 * @param data - 이메일, 비밀번호
	 */
	resetPassword: async ({
		email,
		password,
	}: PasswordResetRequest): Promise<void> => {
		try {
			await axiosInstance.post("/member/password/reset", {
				email,
				password,
			});
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
			}
			throw error;
		}
	},
};
