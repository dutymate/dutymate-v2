import React, { useCallback, useEffect, useRef } from "react";
import { BackHandler, SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";

/**
 * App 컴포넌트의 props 타입입니다.
 * - `allowsBackForwardNavigationGestures`: WebView의 앞뒤 탐색 제스처 허용 여부 (iOS만 지원).
 */
interface AppProps {
	allowsBackForwardNavigationGestures?: boolean;
}

/**
 * 앱의 메인 컴포넌트입니다. WebView를 사용해 웹 페이지를 렌더링합니다.
 */
export default function App(props: AppProps) {
	const webViewRef = useRef<WebView>(null);
	const uri = Constants.expoConfig?.extra?.url ?? "http://localhost:5173";
	const customUserAgent = "customUserAgent";

	/**
	 * Android 하드웨어 뒤로가기 버튼 처리 함수입니다.
	 * WebView에서 뒤로 이동할 수 있다면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
	 */
	const handleAndroidBackPress = useCallback(() => {
		if (webViewRef.current) {
			webViewRef.current.goBack();
			return true;
		}
		return false;
	}, []);

	/**
	 * 컴포넌트 마운트 시 뒤로가기 리스너를 등록하고, 언마운트 시 해제합니다.
	 */
	useEffect(() => {
		BackHandler.addEventListener("hardwareBackPress", handleAndroidBackPress);
		return () => {
			BackHandler.removeEventListener(
				"hardwareBackPress",
				handleAndroidBackPress,
			);
		};
	}, [handleAndroidBackPress]);

	return (
		<>
			<StatusBar style="auto" />
			<SafeAreaView style={styles.safeAreaView}>
				<WebView
					ref={webViewRef}
					source={{ uri }}
					userAgent={customUserAgent}
					sharedCookiesEnabled={true}
					allowsBackForwardNavigationGestures={
						props.allowsBackForwardNavigationGestures ?? true
					}
				/>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		marginTop: Constants.statusBarHeight,
	},
});
