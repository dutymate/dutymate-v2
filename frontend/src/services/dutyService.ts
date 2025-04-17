import axiosInstance from "../lib/axios";

// 타입 정의
export interface DayDuty {
	myShift: "D" | "E" | "N" | "O";
	otherShifts: {
		grade: number;
		name: string;
		shift: "D" | "E" | "N" | "O";
	}[];
}

export interface MyDuty {
	year: number;
	month: number;
	prevShifts: string; // 전달 일주일
	nextShifts: string; // 다음달 일주일
	shifts: string; // 이번달 근무표
}

export interface DutyHistory {
	idx: number;
	memberId: number;
	name: string;
	before: string;
	after: string;
	modifiedDay: number;
	isAutoCreated: boolean;
}

export interface DutyIssue {
	memberId: number;
	name: string;
	startDate: number;
	endDate: number;
	endDateShift: string;
	message: string;
}

export interface WardDuty {
	id: string;
	year: number;
	month: number;
	duty: {
		memberId: number;
		name: string;
		shifts: string;
	}[];
}

export interface DutyInfo {
	id: string;
	year: number;
	month: number;
	invalidCnt: number;
	duty: {
		memberId: number;
		name: string;
		role: "HN" | "RN";
		prevShifts: string;
		shifts: string;
	}[];
	issues: DutyIssue[];
	histories: DutyHistory[];
}

export interface DutyUpdateRequest {
	year: number;
	month: number;
	history: {
		memberId: number;
		name: string;
		before: string;
		after: string;
		modifiedDay: number;
		isAutoCreated: boolean;
	};
}

// API 서비스
export const dutyService = {
	/**
	 * 특정 날짜 근무 조회
	 * @param year - 년도
	 * @param month - 월
	 * @param date - 일
	 */
	getMyDayDuty: (year: number, month: number, date: number) => {
		return axiosInstance
			.get("/duty/my/date", {
				params: { year, month, date },
			})
			.then((response) => {
				return response.data as DayDuty;
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

	/**
	 * 나의 근무표 조회
	 * @param year - 년도 (선택)
	 * @param month - 월 (선택)
	 */
	getMyDuty: (year?: number, month?: number) => {
		const params = year && month ? { year, month } : {};
		return axiosInstance
			.get("/duty/my", { params })
			.then((response) => {
				return response.data as MyDuty;
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

	/**
	 * 병동 근무표 조회
	 * @returns 병동의 전체 근무표 정보
	 */
	getWardDuty: (year?: number, month?: number) => {
		const params = year && month ? { year, month } : {};
		return axiosInstance
			.get("/duty/ward", { params })
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
						case 400:
							console.error("잘못된 요청입니다.:", error);
							throw new Error("잘못된 요청입니다.");
						default:
							console.error("Error occurred:", error);
							window.location.href = "/error";
							break;
					}
				}
				throw error;
			});
	},

	/**
	 * 근무표 자동 생성
	 * @param year - 년도
	 * @param month - 월
	 */
	autoCreateDuty: (year: number, month: number) => {
		return axiosInstance
			.get("/duty/auto-create", {
				params: { year, month },
			})
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

	/**
	 * 근무표 수정
	 * @param data - 수정할 근무 정보
	 */
	updateDuty: (data: DutyUpdateRequest) => {
		return axiosInstance
			.put(`/duty`, data)
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

	/**
	 * 근무표 조회/되돌리기
	 * @param params - 조회할 근무표 정보 (year, month, history)
	 */
	getDuty: (params: { year?: number; month?: number; history?: number }) => {
		return axiosInstance
			.get("/duty", { params })
			.then((response) => {
				return response.data as DutyInfo;
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

	/**
	 * 근무표 초기화하기
	 * @param year - 년도
	 * @param month - 월
	 */
	resetDuty: (year: number, month: number) => {
		return axiosInstance
			.post("/duty/reset", null, {
				params: { year, month },
			})
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

	updateShiftBatch: async (requests: any[]) => {
		try {
			const response = await axiosInstance.put("/duty", requests);
			return response.data;
		} catch (error) {
			console.error("Failed to update shifts:", error);
			throw error;
		}
	},
};
