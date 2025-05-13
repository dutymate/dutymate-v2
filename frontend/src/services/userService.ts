import axios from 'axios';

import axiosInstance from '@/lib/axios';
import { ColorTheme } from '@/stores/userAuthStore';

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
  color?: ColorTheme;
  isDemo?: boolean;
}

interface AdditionalInfoRequest {
  grade: number;
  gender: 'F' | 'M';
  role: 'RN' | 'HN'; // RN: 평간호사, HN: 수간호사
}

interface AdditionalInfoResponse {
  role: 'HN' | 'RN'; // 명확한 타입 지정
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

interface PasswordResetRequest {
  email: string;
  password: string;
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
    fail: (error: ApiErrorResponse) => void
  ) => {
    return axiosInstance
      .get(`/member/login/google`, {
        params: { code },
      })
      .then((response) => {
        success(response.data);
      })
      .catch((error) => {
        console.error('Error occurred:', error);
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
    fail: (error: ApiErrorResponse) => void
  ) => {
    try {
      const response = await axiosInstance.get(`/member/login/kakao`, {
        params: { code },
      });
      success(response.data);
    } catch (error) {
      console.error('Error occurred:', error);
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
    data: AdditionalInfoRequest
  ): Promise<AdditionalInfoResponse> => {
    try {
      const response = await axiosInstance.post('/member/info', data);
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
      const response = await axiosInstance.post('/member/login', data);
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
      const response = await axiosInstance.post('/member', data);
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
      await axiosInstance.get('/member/check-email', { params: { email } });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw error;
    }
  },

  /**
   * 이메일 인증 코드 API
   */
  sendEmailAuthCode: async (email: string, path: string): Promise<void> => {
    try {
      await axiosInstance.post(
        '/member/email-verification',
        { email },
        {
          params: { path }, // 쿼리 파라미터
        }
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
        '/member/email-verification/confirm',
        {
          email,
          code,
        }
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
   * 인증된 사용자 Email update
   */
  verifyEmailUpdate: async (memberId: number, email: string): Promise<void> => {
    await axiosInstance.put(`/member/email-verification/${memberId}`, {
      email,
    });
  },

  /**
   * 비밀번호 재설정 인증코드 요청 API
   * @param email - 사용자 이메일
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await axiosInstance.post('/member/password/reset-request', { email });
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
      await axiosInstance.post('/member/password/reset', {
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

  /**
   * 입장 대기 상태 업데이트 API
   */
  enterWaitingStatus: async (): Promise<boolean> => {
    try {
      const response = await axiosInstance.get('/member/enter-waiting-status');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data;
      }
      throw error;
    }
  },

  /**
   * 입장한 병동 상태 조회 API
   */
  existWardStatus: async (): Promise<boolean> => {
    try {
      const response = await axiosInstance.get('/member/exist-ward-status');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data;
      }
      throw error;
    }
  },

  /**
   * 입장 대기 취소 API
   */
  cancelEnterWardWaiting: async (): Promise<void> => {
    try {
      await axiosInstance.delete('/member/cancel-enter');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data;
      }
      throw error;
    }
  },
};

export default userService;
