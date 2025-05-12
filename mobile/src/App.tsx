import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";
import { BackHandler } from "react-native";
import {
	NavigationContainer,
	createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { LandingScreen } from "@/screens/LandingScreen";
import { WebViewScreen } from "@/screens/WebViewScreen";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

/**
 * 앱의 메인 컴포넌트입니다.
 * 이 컴포넌트는 React Navigation을 사용하여 앱의 내비게이션을 설정합니다.
 */
export default function App() {
	/**
	 * 컴포넌트 마운트 시 뒤로가기 리스너를 등록하고, 언마운트 시 해제합니다.
	 */
	useEffect(() => {
		const backHandler = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				if (navigationRef.isReady() && navigationRef.canGoBack()) {
					navigationRef.goBack();
					return true;
				}
				return false;
			},
		);
		return () => backHandler.remove();
	}, []);

	return (
		<>
			<StatusBar style="auto" />
			<NavigationContainer ref={navigationRef}>
				<Stack.Navigator
					initialRouteName={"Landing"}
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen name="Landing" component={LandingScreen} />
					<Stack.Screen name="WebView" component={WebViewScreen} />
				</Stack.Navigator>
			</NavigationContainer>
		</>
	);
}
