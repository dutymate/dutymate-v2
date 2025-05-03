import { useEffect } from "react";

import channelService from "@/services/channelService";
import useUserAuthStore from "@/stores/userAuthStore";

const ChannelTalkLoader = () => {
	const { isAuthenticated, userInfo } = useUserAuthStore();

	useEffect(() => {
		// 채널톡 스크립트 로드
		channelService.loadScript();

		// 환경 변수에서 플러그인 키 가져오기
		const pluginKey = import.meta.env.VITE_CHANNEL_TALK_PLUGIN_KEY || "";

		// 외부 클릭 이벤트 핸들러
		const handleClickOutside = (event: MouseEvent) => {
			const channelTalkElement = document.querySelector("#ch-plugin");
			if (
				channelTalkElement &&
				!channelTalkElement.contains(event.target as Node)
			) {
				channelService.hideMessenger();
			}
		};

		// 채널톡 부트하기
		if (isAuthenticated && userInfo) {
			// 로그인한 사용자인 경우
			channelService.boot({
				pluginKey: pluginKey,
				memberId: String(userInfo.memberId),
				profile: {
					name: userInfo.name + userInfo.role,
				},
			});
		} else {
			// 익명 사용자인 경우
			channelService.boot({
				pluginKey: pluginKey,
			});
		}

		// 클릭 이벤트 리스너 등록
		document.addEventListener("mousedown", handleClickOutside);

		// 컴포넌트 언마운트 시 채널톡 종료 및 이벤트 리스너 제거
		return () => {
			channelService.shutdown();
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isAuthenticated, userInfo]); // 의존성 배열에 상태 추가

	return null;
};

export default ChannelTalkLoader;
