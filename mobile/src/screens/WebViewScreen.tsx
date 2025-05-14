import Constants from "expo-constants";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { Layout } from "@/layout/Layout";

/**
 * WebViewScreenProps는 WebViewScreen 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface WebViewScreenProps {
	navigation: any;
}

/**
 * WebViewScreen은 WebView를 사용하여 웹 페이지를 표시합니다.
 * @param navigation
 */
export const WebViewScreen = ({ navigation }: WebViewScreenProps) => {
	const webViewRef = useRef<WebView>(null);
	const [canGoBack, setCanGoBack] = useState(false);
	const uri = Constants.expoConfig?.extra?.url ?? "http://localhost:5173";
	const customUserAgent = "customUserAgent";

	/**
	 * Android 하드웨어 뒤로가기 버튼 처리 함수입니다.
	 * WebView에서 뒤로 이동할 수 있다면 true를 반환하고, 그렇지 않으면 navigation.goBack()을 호출합니다.
	 */
	const handleAndroidBackPress = useCallback(() => {
		if (canGoBack && webViewRef.current) {
			webViewRef.current.goBack();
			return true;
		}
		navigation.goBack();
		return true;
	}, [canGoBack, navigation]);

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
		<Layout isWebView={true} isWaveBackground={false}>
			<SafeAreaView className={"flex-1"} style={styles.safeAreaView}>
				<WebView
					ref={webViewRef}
					source={{ uri }}
					userAgent={customUserAgent}
					sharedCookiesEnabled={true}
					onContentProcessDidTerminate={() => webViewRef.current?.reload()}
					onNavigationStateChange={(navState) =>
						setCanGoBack(navState.canGoBack)
					}
					allowsBackForwardNavigationGestures
				/>
			</SafeAreaView>
		</Layout>
	);
};

const styles = StyleSheet.create({
	safeAreaView: {
		marginTop: Constants.statusBarHeight,
	},
});
