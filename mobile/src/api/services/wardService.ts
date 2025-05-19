import axiosInstance from "@/api/axios";

interface CreateWardRequest {
	hospitalName: string;
	wardName: string;
}

export interface WardInfo {
	wardCode: string;
	wardName: string;
	hospitalName: string;
	nursesTotalCnt: number;
}

export const wardService = {
	/**
	 * 병동 생성 API
	 * @param data 병원명, 병동명
	 * @returns 생성된 병동 정보
	 */
	createWard: async (data: CreateWardRequest): Promise<WardInfo> => {
		try {
			const response = await axiosInstance.post("/ward", data);
			return response.data;
		} catch (error) {
			console.error("Ward creation error:", error);
			throw error;
		}
	},

	/**
	 * 병동 정보 조회 API
	 * @returns 병동 정보
	 */
	getWardInfo: async (): Promise<WardInfo> => {
		try {
			const response = await axiosInstance.get("/ward");
			return response.data;
		} catch (error) {
			console.error("Get ward info error:", error);
			throw error;
		}
	},
};
