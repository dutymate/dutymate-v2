import axios from "axios";

export const axiosInstance = axios.create({
    // 환경변수에서 API URL을 가져옵니다. 없으면 '/api'를 기본값으로 사용합니다.
    baseURL: process.env.VITE_API_URL || '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });