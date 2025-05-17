// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const axiosInstance = axios.create({
  baseURL: API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config) => {
    // SecureStore에서 토큰 가져오기
    const token = await SecureStore.getItemAsync('auth-token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // HTTP 상태 코드별 처리
    switch (error.response?.status) {
      case 401: // 인증 에러
        // 토큰이 만료되었거나 유효하지 않은 경우
        await SecureStore.deleteItemAsync('auth-token');
        // 로그인 화면으로 이동 로직은 별도 구현 필요
        break;

      case 403: // 권한 에러
        console.error('접근 권한이 없습니다.');
        break;
        
      case 404: // Not Found
        console.error('요청한 리소스를 찾을 수 없습니다.');
        break;

      case 500: // 서버 에러
        console.error('서버 에러가 발생했습니다.');
        break;

      default:
        console.error('알 수 없는 에러가 발생했습니다.', error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;