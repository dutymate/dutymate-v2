import { create } from "zustand";

// 로딩 상태를 관리하는 스토어
interface LoadingStore {
	isLoading: boolean;
	setLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
	isLoading: false,
	setLoading: (loading) => set({ isLoading: loading }),
}));
