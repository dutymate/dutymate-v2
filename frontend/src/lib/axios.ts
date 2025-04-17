import axios from "axios";

/**
 * Axios 인스턴스 생성
 * - baseURL: API의 기본 URL을 설정합니다. 모든 요청의 prefix로 사용됩니다.
 * - timeout: 요청 제한 시간을 설정합니다 (10초).
 * - headers: 기본 헤더를 설정합니다.
 */
export const axiosInstance = axios.create({
	// 환경변수에서 API URL을 가져옵니다. 없으면 '/api'를 기본값으로 사용합니다.
	baseURL: import.meta.env.VITE_API_URL || "/api",
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * 요청 인터셉터
 * 모든 HTTP 요청이 실행되기 전에 실행됩니다.
 * 주로 인증 토큰을 헤더에 추가하는 용도로 사용됩니다.
 */
axiosInstance.interceptors.request.use(
	(config) => {
		// sessionStorage에서 토큰을 가져옵니다.
		// const token = userAuthStore.userInfo?.token;
		const userAuthStorage = sessionStorage.getItem("user-auth-storage");
		if (userAuthStorage === null) {
			return config;
		}
		const token = JSON.parse(userAuthStorage).state.userInfo.token;

		// 토큰이 존재하면 Authorization 헤더에 추가합니다.
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		// 요청 전에 에러가 발생하면 Promise.reject로 처리합니다.
		return Promise.reject(error);
	},
);

/**
 * 응답 인터셉터
 * 모든 HTTP 응답을 처리하기 전에 실행됩니다.
 * 주로 에러 처리나 응답 데이터 가공에 사용됩니다.
 */
axiosInstance.interceptors.response.use(
	// 정상적인 응답 처리
	(response) => response,

	// 에러 응답 처리
	(error) => {
		// HTTP 상태 코드별 처리
		switch (error.response?.status) {
			case 401: // 인증 에러
				// 토큰이 만료되었거나 유효하지 않은 경우
				localStorage.removeItem("token");
				window.location.href = "/login";
				break;

			case 403: // 권한 에러
				// 접근 권한이 없는 경우
				console.error("접근 권한이 없습니다.");
				break;

			case 404: // Not Found
				console.error("요청한 리소스를 찾을 수 없습니다.");
				break;

			case 500: // 서버 에러
				console.error("서버 에러가 발생했습니다.");
				break;

			default:
				// 기타 에러
				console.error("알 수 없는 에러가 발생했습니다.", error);
		}

		return Promise.reject(error);
	},
);

export default axiosInstance;
