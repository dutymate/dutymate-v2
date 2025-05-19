/**
 * 사용자 정보에 따라 적절한 화면으로 이동하는 함수
 *
 * @param navigation 네비게이션 객체 (NavigationProp 또는 NavigationContainerRef)
 * @param userInfo 사용자 정보 (role, existAdditionalInfo, existMyWard 포함)
 */
export const navigateBasedOnUserRole = (navigation: any, userInfo: any) => {
	if (!navigation) {
		console.error("네비게이션 객체가 제공되지 않았습니다.");
		return;
	}

	if (!userInfo) {
		console.error("사용자 정보가 제공되지 않았습니다.");
		navigation.navigate("Login");
		return;
	}

	const { role, existAdditionalInfo, existMyWard } = userInfo;

	// 로깅 추가
	console.log("네비게이션 정보:", { role, existAdditionalInfo, existMyWard });

	// 추가 정보가 없는 경우
	if (existAdditionalInfo !== true) {
		navigation.navigate("ExtraInfo");
	}
	// 소속 병동이 없는 경우
	else if (existMyWard !== true) {
		if (role === "HN") {
			navigation.navigate("CreateWard");
		} else {
			navigation.navigate("WebView", { path: "/my-shift" });
		}
	}
	// 모든 정보가 있는 경우
	else {
		if (role === "HN") {
			navigation.navigate("WebView", { path: "/shift-admin" });
		} else {
			navigation.navigate("WebView", { path: "/my-shift" });
		}
	}
};
