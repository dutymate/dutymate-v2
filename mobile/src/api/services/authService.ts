import { LoginResponse } from "@/types/user";
import axiosInstance from "../axiosI";
import * as SecureStore from 'expo-secure-store';

export const authService = {
    /**
     * 카카오 로그인 API
     * @param code 
     * @returns 
     */
    kakaoLogin: async (code: string): Promise<LoginResponse> => {
        try {
          const response = await axiosInstance.get('/member/login/kakao/mobile', {
            params: { code }
          });
          // 토큰 저장
          await SecureStore.setItemAsync('auth-token', response.data.token);
          return response.data;
        } catch (error) {
          console.error('Kakao login error:', error);
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
          const response = await axiosInstance.get('/member/login/google/mobile', {
            params: { code }
          });
          // 토큰 저장
          await SecureStore.setItemAsync('auth-token', response.data.token);
          return response.data;
        } catch (error) {
          console.error('Google login error:', error);
          throw error;
        }
      },

};






