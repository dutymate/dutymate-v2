// import Signup from "@/pages/Signup";
import axiosInstance from "../lib/axios";
import axios from "axios";

// Response Types
export interface LoginResponse {
	token: string;
	memberId: number;
	name: string;
	role: string;
	profileImg: string;
	existAdditionalInfo: boolean;
	existMyWard: boolean;
	sentWardCode: boolean;
	provider: string;
}

interface AdditionalInfoRequest {
	grade: number;
	gender: "F" | "M";
	role: "RN" | "HN"; // RN: 평간호사, HN: 수간호사
}

interface AdditionalInfoResponse {
	role: "HN" | "RN"; // 명확한 타입 지정
}

export interface ApiErrorResponse {
	message: string;
	timestamp: string;
	status: string;
}

interface LoginRequest {
	email: string;
	password: string;
}

interface SignupRequest {
	email: string;
	password: string;
	passwordConfirm: string;
	name: string;
}

// API Functions
export const userService = {
	/**
	 * Google 로그인 API
	 * @param code - Google OAuth 인증 코드
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	googleLogin: async (
		code: string,
		success: (data: LoginResponse) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		return axiosInstance
			.get(`/member/login/google`, {
				params: { code },
			})
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				console.error("Error occurred:", error);
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},

	/**
	 * Kakao 로그인 API
	 * @param code - Kakao OAuth 인증 코드
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	kakaoLogin: async (
		code: string,
		success: (data: LoginResponse) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		try {
			const response = await axiosInstance.get(`/member/login/kakao`, {
				params: { code },
			});
			success(response.data);
		} catch (error) {
			console.error("Error occurred:", error);
			if (axios.isAxiosError(error)) {
				fail(error.response?.data);
			}
			throw error;
		}
	},

	/**
	 * 부가정보 입력 API
	 * @param data - 부가정보 (연차, 성별, 역할)
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	submitAdditionalInfo: async (
		data: AdditionalInfoRequest,
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
	 * 일반 로그인 API
	 * @param data
	 * @returns
	 */
	login: async (data: LoginRequest): Promise<LoginResponse> => {
		try {
			const response = await axiosInstance.post("/member/login", data);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw error.response?.data;
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
};

export default userService;
