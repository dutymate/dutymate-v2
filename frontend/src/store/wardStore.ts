import { create } from "zustand";
import { WardInfo, wardService } from "../services/wardService";

export interface WardStore {
	wardInfo: WardInfo | null;
	setWardInfo: (wardInfo: WardInfo) => void;
	updateNurse: (memberId: number, updatedData: any) => Promise<void>;
	removeNurse: (memberId: number) => Promise<void>;
	syncWithServer: () => Promise<void>;
	lastSyncTime: number | null;
	virtualNurseCount: number;
	addVirtualNurse: (count: number) => Promise<void>;
	updateVirtualNurseName: (memberId: number, name: string) => Promise<void>;
	updateVirtualNurseInfo: (
		memberId: number,
		data: { name?: string; gender?: "F" | "M"; grade?: number },
	) => Promise<void>;
	getSortedNurses: () => any[];
}

const useWardStore = create<WardStore>((set, get) => ({
	wardInfo: null,
	lastSyncTime: null,
	virtualNurseCount: 0,

	setWardInfo: (wardInfo) =>
		set({
			wardInfo,
			lastSyncTime: Date.now(),
		}),

	updateNurse: async (memberId, updatedData) => {
		const previousState = get().wardInfo;
		try {
			// Optimistic Update
			set((state) => {
				if (!state.wardInfo) return state;

				const updatedNurses = state.wardInfo.nurses.map((nurse) =>
					nurse.memberId === memberId ? { ...nurse, ...updatedData } : nurse,
				);

				return {
					wardInfo: {
						...state.wardInfo,
						nurses: updatedNurses,
					},
				};
			});

			// API 호출
			await wardService.updateNurseInfo(memberId, {
				shift: updatedData.shift,
				skillLevel: updatedData.skillLevel,
				memo: updatedData.memo,
				role: updatedData.role,
			});
		} catch (error) {
			// 에러 발생 시 이전 상태로 롤백
			set({ wardInfo: previousState });
			window.location.href = "/error";
			throw error;
		}
	},

	removeNurse: async (memberId: number) => {
		const wardInfo = get().wardInfo;
		if (!wardInfo) return;

		// HN 수 확인
		const hnCount = wardInfo.nurses.filter(
			(nurse) => nurse.role === "HN",
		).length;
		const targetNurse = wardInfo.nurses.find(
			(nurse) => nurse.memberId === memberId,
		);

		if (targetNurse?.role === "HN" && hnCount <= 1) {
			throw new Error("LAST_HN");
		}

		// 이전 상태 저장
		const previousState = get().wardInfo;

		// Optimistic Update
		set((state) => ({
			wardInfo: state.wardInfo
				? {
						...state.wardInfo,
						nurses: state.wardInfo.nurses.filter(
							(nurse) => nurse.memberId !== memberId,
						),
						nursesTotalCnt: state.wardInfo.nursesTotalCnt - 1,
					}
				: null,
		}));

		try {
			await wardService.removeNurse(memberId);
		} catch (error) {
			// 에러 발생 시 이전 상태로 롤백
			set({ wardInfo: previousState });
			if (error instanceof Error && error.message === "LAST_HN") {
				throw error;
			}
			window.location.href = "/error";
			throw error;
		}
	},

	syncWithServer: async () => {
		const currentTime = Date.now();
		const lastSync = get().lastSyncTime;

		// 마지막 동기화로부터 30초 이상 지났거나 처음 동기화하는 경우에만 실행
		if (!lastSync || currentTime - lastSync > 30000) {
			try {
				const serverData = await wardService.getWardInfo();
				set({
					wardInfo: serverData,
					lastSyncTime: currentTime,
				});
			} catch (error) {
				console.error("서버 동기화 실패:", error);
				throw error;
			}
		}
	},

	addVirtualNurse: async (count: number) => {
		// const count = get().virtualNurseCount + 1;

		try {
			const newNurse = await wardService.addVirtualNurse(count);

			// Optimistic Update
			set((state) => {
				if (!state.wardInfo) return state;

				return {
					wardInfo: {
						...state.wardInfo,
						nurses: [...state.wardInfo.nurses, newNurse],
						nursesTotalCnt: state.wardInfo.nursesTotalCnt + 1,
					},
					virtualNurseCount: count,
					lastSyncTime: Date.now(), // 동기화 시간 업데이트
				};
			});

			// 서버와 동기화
			await get().syncWithServer();
		} catch (error) {
			console.error("임시 간호사 추가 실패:", error);
			throw error;
		}
	},

	updateVirtualNurseName: async (memberId: number, name: string) => {
		const previousState = get().wardInfo;

		// Optimistic Update
		set((state) => {
			if (!state.wardInfo) return state;

			const updatedNurses = state.wardInfo.nurses.map((nurse) =>
				nurse.memberId === memberId ? { ...nurse, name } : nurse,
			);

			return {
				wardInfo: {
					...state.wardInfo,
					nurses: updatedNurses,
				},
			};
		});

		try {
			await wardService.updateVirtualNurseName(memberId, name);
		} catch (error) {
			// 에러 발생 시 이전 상태로 롤백
			set({ wardInfo: previousState });
			throw error;
		}
	},

	updateVirtualNurseInfo: async (
		memberId: number,
		data: { name?: string; gender?: "F" | "M"; grade?: number },
	) => {
		const previousState = get().wardInfo;

		// Optimistic Update
		set((state) => {
			if (!state.wardInfo) return state;

			const updatedNurses = state.wardInfo.nurses.map((nurse) =>
				nurse.memberId === memberId ? { ...nurse, ...data } : nurse,
			);

			return {
				wardInfo: {
					...state.wardInfo,
					nurses: updatedNurses,
				},
			};
		});

		try {
			await wardService.updateVirtualNurseInfo(memberId, data);
		} catch (error) {
			// 에러 발생 시 이전 상태로 롤백
			set({ wardInfo: previousState });
			throw error;
		}
	},

	// 정렬된 간호사 목록을 반환하는 getter
	getSortedNurses: () => {
		const wardInfo = get().wardInfo;
		if (!wardInfo) return [];

		return [...wardInfo.nurses].sort((a, b) => {
			// 먼저 role로 정렬 (HN이 위로)
			if (a.role === "HN" && b.role !== "HN") return -1;
			if (a.role !== "HN" && b.role === "HN") return 1;

			// role이 같은 경우 grade로 정렬 (내림차순)
			return b.grade - a.grade;
		});

		// set({wardInfo : {...wardInfo, nurses : sortedNures}})

		// return sortedNures;
	},
}));

// // 주기적 동기화를 위한 interval 설정
// if (typeof window !== "undefined") {
// 	setInterval(() => {
// 		const store = useWardStore.getState();
// 		store.syncWithServer().catch(console.error);
// 	}, 30000); // 30초마다 동기화
// }

export default useWardStore;
