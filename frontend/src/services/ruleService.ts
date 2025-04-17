import axiosInstance from "../lib/axios";

// 타입 정의
export interface WardRule {
	// 평일/주말 근무 개수
	wdayDCnt: number; // 평일 D 근무 개수
	wdayECnt: number; // 평일 E 근무 개수
	wdayNCnt: number; // 평일 N 근무 개수
	wendDCnt: number; // 주말 D 근무 개수
	wendECnt: number; // 주말 E 근무 개수
	wendNCnt: number; // 주말 N 근무 개수

	// 나이트 근무 규칙
	maxN: number; // 최대 연속 N 근무
	prioMaxN: number; // 최대 연속 N 근무 중요도
	minN: number; // 최소 연속 N 근무
	prioMinN: number; // 최소 연속 N 근무 중요도

	// 연속 근무 규칙
	maxShift: number; // 최대 연속 근무일
	prioMaxShift: number; // 최대 연속 근무일 중요도
}

// API 서비스
export const ruleService = {
	/**
	 * 병동 규칙 조회
	 * 평일/주말 근무 개수, 나이트 근무 규칙, 연속 근무 규칙 등을 포함
	 * @returns 병동의 모든 근무 규칙
	 */
	getWardRules: () => {
		return axiosInstance
			.get("/ward/rule")
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					console.error(
						"서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
					);
					throw new Error("서버 연결 실패");
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							console.error("Error occurred:", error);
							window.location.href = "/error";
							break;
					}
				}
				throw error;
			});
	},

	updateWardRules: (rules: WardRule) => {
		return axiosInstance
			.put("/ward/rule", rules)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					console.error(
						"서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
					);
					throw new Error("서버 연결 실패");
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							console.error("Error occurred:", error);
							throw error;
					}
				}
				throw error;
			});
	},
};
