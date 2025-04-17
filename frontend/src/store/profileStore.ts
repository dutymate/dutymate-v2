import { create } from "zustand";
import { profileService, ProfileResponse } from "../services/profileService";
import useUserAuthStore from "./userAuthStore";

interface ProfileStore {
	profile: ProfileResponse | null;
	isLoading: boolean;
	error: string | null;
	fetchProfile: () => Promise<void>;
	updateProfile: (data: {
		name: string;
		nickname: string;
		gender: "F" | "M";
		grade: number;
	}) => Promise<void>;
	checkNickname: (nickname: string) => Promise<boolean>;
	uploadProfileImage: (file: File) => Promise<void>;
	deleteProfileImage: () => Promise<void>;
}

const useProfileStore = create<ProfileStore>((set) => ({
	profile: null,
	isLoading: false,
	error: null,

	fetchProfile: async () => {
		set({ isLoading: true });
		try {
			const profile = await profileService.getProfile();
			set({ profile, error: null });
		} catch (error) {
			set({ error: "프로필 정보를 불러오는데 실패했습니다." });
			window.location.href = "/error";
		} finally {
			set({ isLoading: false });
		}
	},

	updateProfile: async (data) => {
		set({ isLoading: true });
		try {
			const updateData = {
				name: data.name,
				nickname: data.nickname,
				gender: data.gender,
				grade: data.grade,
			};
			await profileService.updateProfile(updateData);
			const updatedProfile = await profileService.getProfile();
			set({ profile: updatedProfile, error: null });
		} catch (error) {
			console.error("프로필 수정 에러:", error);
			set({ error: "프로필 수정에 실패했습니다." });
			window.location.href = "/error";
		} finally {
			set({ isLoading: false });
		}
	},

	checkNickname: async (nickname: string) => {
		try {
			return await profileService.checkNickname(nickname);
		} catch (error) {
			console.error("닉네임 중복 체크 에러:", error);
			throw error;
		}
	},

	uploadProfileImage: async (file: File) => {
		try {
			await profileService.uploadProfileImage(file);
			const updatedProfile = await profileService.getProfile();
			useUserAuthStore.getState().setProfileImg(updatedProfile.profileImg);
			set({ profile: updatedProfile, error: null });
		} catch (error) {
			console.error("프로필 이미지 업로드 에러:", error);
			throw error;
		}
	},

	deleteProfileImage: async () => {
		try {
			await profileService.deleteProfileImage();
			const updatedProfile = await profileService.getProfile();
			useUserAuthStore.getState().setProfileImg(updatedProfile.profileImg);
			set({ profile: updatedProfile, error: null });
		} catch (error) {
			console.error("프로필 이미지 삭제 에러:", error);
			throw error;
		}
	},
}));

// {
//   name: "user-auth-storage",
//   storage: createJSONStorage(() => sessionStorage), // localStorage 대신 sessionStorage 사용
// }, 또는 userAuthStore랑 프로필 스토어랑 합치기
//  사이드바 아이콘을 세션 스토리지에 profileImg 업로드하기
export default useProfileStore;
