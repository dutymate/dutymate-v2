import Constants from "expo-constants";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	BackHandler,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
	ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import { Layout } from "@/layout/Layout";
import { useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

/**
 * WebViewScreenProps는 WebViewScreen 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface WebViewScreenProps {
	navigation: any;
	route: {
		params?: {
			path?: string;
			inviteToken?: string;
		};
	};
}

/**
 * WebViewScreen은 WebView를 사용하여 웹 페이지를 표시합니다.
 * @param navigation
 */
export const WebViewScreen = ({ navigation }: WebViewScreenProps) => {
	const webViewRef = useRef<WebView>(null);
	const [canGoBack, setCanGoBack] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [pageLoading, setPageLoading] = useState(true);
	const [loadingError, setLoadingError] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<any>(null);
	const route = useRoute();

	// URL 구성
	const baseUrl = Constants.expoConfig?.extra?.url ?? "http://localhost:5173";
	console.log("WebView baseUrl:", baseUrl); // URL 로깅

	const customUserAgent = "dutymateMobileApp";

	// 라우트 파라미터에서 path와 inviteToken 추출
	const { path, inviteToken } =
		(route.params as { path?: string; inviteToken?: string }) || {};
	console.log("WebView path:", path); // path 로깅

	// 전체 URL 생성
	const url = path
		? `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
		: inviteToken
			? `${baseUrl}/invite/${inviteToken}`
			: baseUrl;

	console.log("WebView 최종 URL:", url); // 최종 URL 로깅

	// 인증 토큰과 사용자 정보 가져오기
	useEffect(() => {
		const fetchAuthData = async () => {
			try {
				const token = await SecureStore.getItemAsync("auth-token");
				const userInfoStr = await SecureStore.getItemAsync("user-info");

				console.log("토큰 존재 여부:", !!token); // 토큰 존재 여부 로깅
				setAuthToken(token);

				if (userInfoStr) {
					try {
						const parsedUserInfo = JSON.parse(userInfoStr);
						console.log("사용자 정보 로드됨:", parsedUserInfo.role); // 역할 정보 로깅
						setUserInfo(parsedUserInfo);
					} catch (e) {
						console.error("사용자 정보 파싱 오류:", e);
						setLoadingError("사용자 정보 파싱 오류");
					}
				}

				setIsLoading(false);
			} catch (error) {
				console.error("인증 데이터 가져오기 실패:", error);
				setLoadingError("인증 데이터 로드 실패");
				setIsLoading(false);
			}
		};

		fetchAuthData();
	}, []);

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

	/**
	 * 웹에서 보낸 메시지를 처리하는 함수
	 */
	const handleWebViewMessage = (event: any) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			console.log("WebView에서 메시지 수신:", data);

			// 메시지 유형에 따른 처리
			switch (data.type) {
				case "REQUEST_AUTH":
					// 인증 정보 요청에 응답
					sendAuthDataToWebView();
					break;

				case "NAVIGATION":
					// 네비게이션 요청 처리
					if (data.path) {
						// 로그아웃 시 랜딩 페이지로 이동 처리
						if (data.path === "Landing") {
							// 자격 증명 정보 삭제
							SecureStore.deleteItemAsync("auth-token");
							SecureStore.deleteItemAsync("user-info");

							// 랜딩 화면으로 이동
							navigation.navigate("Landing");
						} else if (data.path === "WebView" && data.params) {
							// WebView 경로로 다시 이동할 때 params 처리
							navigation.navigate("WebView", data.params);
						} else {
							// 다른 네이티브 화면으로 이동
							navigation.navigate(data.path);
						}
					}
					break;

				case "TOAST":
					// 토스트 메시지 표시
					if (data.message) {
						Toast.show({
							type: data.toastType || "info",
							text1: data.message,
							text2: data.description,
						});
					}
					break;

				default:
					console.log("알 수 없는 메시지 유형:", data.type);
			}
		} catch (error) {
			console.error("WebView 메시지 처리 오류:", error);
		}
	};

	/**
	 * 인증 데이터를 WebView로 전송
	 */
	const sendAuthDataToWebView = () => {
		if (!webViewRef.current) return;

		const message = JSON.stringify({
			type: "AUTH_DATA",
			authToken: authToken,
			userInfo: userInfo,
			isMobileApp: true,
		});

		console.log("WebView로 인증 데이터 전송"); // 인증 데이터 전송 로깅

		// WebView로 메시지 전송
		webViewRef.current.postMessage(message);
	};

	/**
	 * WebView 로딩 오류 처리
	 */
	const handleWebViewError = (syntheticEvent: any) => {
		const { nativeEvent } = syntheticEvent;
		console.error("WebView 로딩 오류:", nativeEvent);
		setLoadingError(
			`페이지 로딩 실패: ${nativeEvent.description || "알 수 없는 오류"}`,
		);
		setPageLoading(false);
	};

	/**
	 * WebView HTTP 오류 처리
	 */
	const handleHttpError = (syntheticEvent: any) => {
		const { nativeEvent } = syntheticEvent;
		console.error("WebView HTTP 오류:", nativeEvent);
		setLoadingError(
			`HTTP 오류: ${nativeEvent.statusCode} ${nativeEvent.description || ""}`,
		);
		setPageLoading(false);

		// 401 오류는 인증 실패를 의미
		if (nativeEvent.statusCode === 401) {
			Toast.show({
				type: "error",
				text1: "인증이 만료되었습니다",
				text2: "다시 로그인해주세요",
			});
			setTimeout(() => navigation.navigate("Login"), 1500);
		}
	};

	// WebView가 로드된 후 실행할 JavaScript 코드
	const injectedJavaScript = `
		(function() {
			// 모바일 앱에서 로드되었음을 표시
			window.isMobileApp = true;
			localStorage.setItem('isMobileApp', 'true');
			
			// 모바일 앱과 통신하는 함수 정의
			window.mobileApp = {
				// 모바일 앱으로 메시지 전송
				postMessage: function(message) {
					if (typeof message === 'object') {
						message = JSON.stringify(message);
					}
					window.ReactNativeWebView.postMessage(message);
				},
				
				// 인증 정보 요청
				requestAuthData: function() {
					this.postMessage({ type: 'REQUEST_AUTH' });
					console.log('인증 데이터 요청 발송');
				},
				
				// 네비게이션 요청
				navigate: function(path) {
					this.postMessage({ type: 'NAVIGATION', path: path });
				},
				
				// 토스트 메시지 표시 요청
				showToast: function(message, description, type) {
					this.postMessage({ 
						type: 'TOAST', 
						message: message,
						description: description,
						toastType: type || 'info'
					});
				}
			};
			
			// 앱 로드 이벤트 발생
			const mobileAppLoadedEvent = new CustomEvent('mobileAppLoaded', { 
				detail: { isMobileApp: true } 
			});
			window.dispatchEvent(mobileAppLoadedEvent);
			
			// 디버깅용 로그
			console.log('WebView 환경:', {
				isMobileApp: window.isMobileApp,
				url: window.location.href,
				localStorage: localStorage.getItem('isMobileApp')
			});
			
			// 잠시 후 자동으로 인증 정보 요청
			setTimeout(function() {
				console.log('인증 데이터 자동 요청');
				window.mobileApp.requestAuthData();
			}, 500);
			
			console.log('모바일 WebView 초기화 스크립트 실행 완료');
		})();
	`;

	// 로딩 스크린 렌더링
	const renderLoadingView = () => (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#F5A281" />
			<Text style={{ marginTop: 10, color: "#333" }}>페이지 로딩 중...</Text>
		</View>
	);

	// 에러 스크린 렌더링
	const renderErrorView = () => (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				padding: 20,
			}}
		>
			<Text style={{ fontSize: 18, color: "#ff0000", marginBottom: 10 }}>
				오류가 발생했습니다
			</Text>
			<Text style={{ textAlign: "center", marginBottom: 20 }}>
				{loadingError}
			</Text>
			<Text
				style={{
					color: "#F5A281",
					textDecorationLine: "underline",
					padding: 10,
				}}
				onPress={() => {
					setLoadingError(null);
					setPageLoading(true);
					webViewRef.current?.reload();
				}}
			>
				다시 시도하기
			</Text>
		</View>
	);

	// WebView 로딩 화면 컴포넌트
	const webviewLoadingElement = () => (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="small" color="#F5A281" />
		</View>
	);

	return (
		<Layout isWebView={true} isWaveBackground={false}>
			<SafeAreaView className={"flex-1"} style={styles.safeAreaView}>
				{isLoading ? (
					renderLoadingView()
				) : loadingError ? (
					renderErrorView()
				) : (
					<>
						{pageLoading && renderLoadingView()}
						<WebView
							ref={webViewRef}
							source={{ uri: url }}
							userAgent={customUserAgent}
							sharedCookiesEnabled={true}
							injectedJavaScript={injectedJavaScript}
							onMessage={handleWebViewMessage}
							onLoadStart={() => setPageLoading(true)}
							onLoadEnd={() => {
								setPageLoading(false);
								// 페이지 로드 후 약간의 지연을 두고 인증 데이터 전송
								setTimeout(sendAuthDataToWebView, 1000);
							}}
							onError={handleWebViewError}
							onHttpError={handleHttpError}
							onContentProcessDidTerminate={() => {
								console.log("WebView 콘텐츠 프로세스 종료됨, 재로딩");
								webViewRef.current?.reload();
							}}
							onNavigationStateChange={(navState) => {
								console.log("WebView 탐색 상태 변경:", navState.url);
								setCanGoBack(navState.canGoBack);
							}}
							allowsBackForwardNavigationGestures
							startInLoadingState={true}
							renderLoading={webviewLoadingElement}
							javaScriptEnabled={true}
							domStorageEnabled={true}
							originWhitelist={["*"]}
							style={{ opacity: pageLoading ? 0 : 1 }} // 로딩 중일 때 WebView 숨기기
						/>
					</>
				)}
			</SafeAreaView>
		</Layout>
	);
};

const styles = StyleSheet.create({
	safeAreaView: {
		marginTop: Constants.statusBarHeight,
	},
});
