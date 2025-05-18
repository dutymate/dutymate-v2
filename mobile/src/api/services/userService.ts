import axios from "axios";
import axiosInstance from "../axios";

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
};
