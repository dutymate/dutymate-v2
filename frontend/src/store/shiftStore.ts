import { create } from "zustand";
import { dutyService } from "../services/dutyService";
import type { DutyInfo } from "../services/dutyService";
// import type { DutyUpdateRequest } from "../services/dutyService";

interface UpdateQueueItem {
	params: {
		year: number;
		month: number;
		memberId: number;
		name: string;
		dayIndex: number;
		before: string;
		after: string;
	};
	timestamp: number;
}

export interface ShiftState {
	dutyInfo: DutyInfo | null;
	loading: boolean;
	error: string | null;
	selectedCell: { row: number; col: number } | null;
	updateQueue: UpdateQueueItem[];
	isProcessing: boolean;
	fetchDutyInfo: (
		year?: number,
		month?: number,
		historyIdx?: number,
	) => Promise<void>;
	updateShift: (params: UpdateQueueItem["params"]) => Promise<void>;
	setSelectedCell: (cell: { row: number; col: number } | null) => void;
	setDutyInfo: (data: DutyInfo) => void;
	nurseGrades: Record<number, number>;
	setNurseGrades: (grades: Record<number, number>) => void;
}

const BATCH_DELAY = 500; // 0.5초 동안 수집된 업데이트를 배치로 처리

const useShiftStore = create<ShiftState>((set, get) => ({
	dutyInfo: null,
	loading: false,
	error: null,
	selectedCell: null,
	updateQueue: [],
	isProcessing: false,
	nurseGrades: {},

	setSelectedCell: (cell) => set({ selectedCell: cell }),
	setDutyInfo: (data) => set({ dutyInfo: data }),
	setNurseGrades: (grades) => set({ nurseGrades: grades }),

	fetchDutyInfo: async (year?: number, month?: number, historyIdx?: number) => {
		try {
			set({ loading: true });
			const params: Record<string, any> = {};

			if (year) params.year = year;
			if (month) params.month = month;
			if (typeof historyIdx === "number") params.history = historyIdx;

			const data = await dutyService.getDuty(params);

			// Comment out sorting logic
			set({
				dutyInfo: {
					...data,
					duty: data.duty.sort((a, b) => {
						// HN should always be at the top
						if (a.role === "HN" && b.role !== "HN") return -1;
						if (a.role !== "HN" && b.role === "HN") return 1;
						return 0;
					}),
				},
				error: null,
			});
		} catch (err) {
			console.error("Error fetching duty info:", err);
			set({
				error: err instanceof Error ? err.message : "Failed to fetch duty info",
			});
			window.location.href = "/error";
		} finally {
			set({ loading: false });
		}
	},

	updateShift: async (params) => {
		const state = get();
		if (!state.dutyInfo) return;

		// 같은 근무 타입으로 변경하려는 경우 업데이트 하지 않음
		if (params.before === params.after) return;

		// 큐에 새 업데이트 추가
		set((state) => ({
			updateQueue: [...state.updateQueue, { params, timestamp: Date.now() }],
		}));

		// 낙관적 업데이트 즉시 적용 (셀 변경만 적용)
		set((state) => ({
			dutyInfo: {
				...state.dutyInfo!,
				duty: state.dutyInfo!.duty.map((nurse) =>
					nurse.memberId === params.memberId
						? {
								...nurse,
								shifts:
									nurse.shifts.substring(0, params.dayIndex) +
									params.after +
									nurse.shifts.substring(params.dayIndex + 1),
							}
						: nurse,
				),
			},
		}));

		// 이미 처리 중이면 리턴
		if (state.isProcessing) return;

		// 배치 처리 시작
		set({ isProcessing: true });

		try {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));

			const currentQueue = get().updateQueue;
			if (currentQueue.length === 0) return;

			// 가장 최근의 업데이트만 서버에 전송
			const lastUpdate = currentQueue[currentQueue.length - 1];

			await dutyService.updateDuty({
				year: lastUpdate.params.year,
				month: lastUpdate.params.month,
				history: {
					memberId: lastUpdate.params.memberId,
					name: lastUpdate.params.name,
					before: lastUpdate.params.before,
					after: lastUpdate.params.after,
					modifiedDay: lastUpdate.params.dayIndex + 1,
					isAutoCreated: false,
				},
			});

			// 최신 데이터로 동기화
			const latestData = await dutyService.getDuty({
				year: lastUpdate.params.year,
				month: lastUpdate.params.month,
			});
			set({ dutyInfo: latestData });
		} catch (error) {
			// 에러 발생 시 마지막 성공한 상태로 롤백
			const latestData = await dutyService.getDuty({
				year: params.year,
				month: params.month,
			});
			set({ dutyInfo: latestData });
			throw error;
		} finally {
			// 큐 비우기 및 처리 상태 초기화
			set({ updateQueue: [], isProcessing: false });
		}
	},
}));

export default useShiftStore;
