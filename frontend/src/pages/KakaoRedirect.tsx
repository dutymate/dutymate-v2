import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
	userService,
	LoginResponse,
	ApiErrorResponse,
} from "../services/userService";
import useUserAuthStore from "../store/userAuthStore";
import { toast } from "react-toastify";
import PageLoadingSpinner from "@/components/atoms/Loadingspinner";

import { AxiosError } from "axios";
import { useLoadingStore } from "@/store/loadingStore";
import { SEO } from "../components/SEO";

export function KakaoRedirect() {
	const navigate = useNavigate();
	const userAuthStore = useUserAuthStore();
	const code: string | null = new URL(window.location.href).searchParams.get(
		"code",
	);

	useEffect(() => {
		if (!code) {
			console.error("Authorization code is missing.");
			navigate("/login");
			return;
		}

		useLoadingStore.getState().setLoading(true);

		userService.kakaoLogin(
			code,
			(data: LoginResponse) => {
				useLoadingStore.getState().setLoading(false);
				const { role, existAdditionalInfo, existMyWard } = data;
				userAuthStore.setUserInfo({
					...data,
					provider: "kakao",
					sentWardCode: false,
				});
				toast.success("정상적으로 로그인되었습니다.");

				if (!existAdditionalInfo) {
					navigate("/extra-info");
				} else if (!existMyWard) {
					if (role === "HN") {
						navigate("/create-ward");
					} else {
						navigate("/enter-ward");
					}
				} else {
					if (role === "HN") {
						navigate("/shift-admin");
					} else {
						navigate("/my-shift");
					}
				}
			},
			(error: ApiErrorResponse | AxiosError) => {
				useLoadingStore.getState().setLoading(true);
				// 이미 다른 경로로 가입한 경우, 에러 메세지 띄우기
				if (error.status === "BAD_REQUEST") {
					toast.error(error.message);
				} else {
					toast.error("다시 시도해주세요.");
				}
				navigate("/login");
			},
		);
	}, []);

	// 로딩 상태를 보여주는 컴포넌트 반환
	return (
		<>
			<SEO
				title="카카오 로그인 | Dutymate"
				description="카카오 로그인 중입니다."
			/>
			<PageLoadingSpinner />
		</>
	);
}
