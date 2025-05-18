import { AdditionalInfo, UserAuthState, UserInfo } from "@/types/user";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// SecureStore용 스토리지 어댑터
const secureStorage = {
	getItem: async (name: string): Promise<string | null> => {
		return await SecureStore.getItemAsync(name);
	},
	setItem: async (name: string, value: string): Promise<void> => {
		await SecureStore.setItemAsync(name, value);
	},
	removeItem: async (name: string): Promise<void> => {
		await SecureStore.deleteItemAsync(name);
	},
};

// Zustand 스토어 생성
export const useUserAuthStore = create<UserAuthState>()(
	persist(
		(set, get) => ({
			// 초기 상태
			isAuthenticated: false,
			userInfo: null,
			additionalInfo: null,
			isTimeout: false,
			timeLeft: 0,

			// 액션
			setUserInfo: (userInfo: UserInfo) => {
				set({
					isAuthenticated: true,
					userInfo,
				});
			},

			setAdditionalInfo: (additionalInfo: AdditionalInfo) => {
				const currentState = get();
				// userInfo가 없거나 인증되지 않은 상태라면 에러
				if (!currentState.isAuthenticated || !currentState.userInfo) {
					throw new Error(
						"User must be authenticated before setting additional info",
					);
				}

				set({
					additionalInfo,
					userInfo: {
						...currentState.userInfo,
						existAdditionalInfo: true,
					},
				});
			},

			logout: () => {
				set({
					isAuthenticated: false,
					userInfo: null,
					additionalInfo: null,
					timeLeft: 0,
				});
				SecureStore.deleteItemAsync("auth-token");
			},

			setProfileImg: (profileImgUrl: string | null) => {
				const currentState = get();
				// userInfo가 없거나 인증되지 않은 상태라면 에러
				if (!currentState.isAuthenticated || !currentState.userInfo) {
					throw new Error(
						"User must be authenticated before setting additional info",
					);
				}
				set({
					userInfo: {
						...currentState.userInfo,
						profileImg: profileImgUrl,
					},
				});
			},

			setTimeout: (isTimeout: boolean) => set({ isTimeout }),
			setTimeLeft: (timeLeft: number) => set({ timeLeft }),
		}),
		{
			name: "user-auth-storage",
			storage: createJSONStorage(() => secureStorage), // SecureStore 사용
		},
	),
);

export default useUserAuthStore;
