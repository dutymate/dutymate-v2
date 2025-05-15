import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";
import { BackHandler } from "react-native";
import {
	configureReanimatedLogger,
	ReanimatedLogLevel,
} from "react-native-reanimated";
import {
	NavigationContainer,
	createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { ErrorScreen } from "@/screens/ErrorScreen";
import { LandingScreen } from "@/screens/LandingScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { PasswordResetScreen } from "@/screens/PasswordResetScreen";
import { WebViewScreen } from "@/screens/WebViewScreen";
import { TestScreen } from "./screens/TestScreen";

configureReanimatedLogger({
	level: ReanimatedLogLevel.warn,
	strict: false,
});

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

/**
 * 앱의 메인 컴포넌트입니다.
 * 이 컴포넌트는 React Navigation을 사용하여 앱의 내비게이션을 설정합니다.
 */
export default function App() {
	const [fontsLoaded] = useFonts({
		PretendardVariable: require("../assets/fonts/PretendardVariable.ttf"),
	});

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

	if (!fontsLoaded) {
		return null;
	}

	return (
		<>
			<StatusBar style="auto" />
			<NavigationContainer ref={navigationRef}>
				<Stack.Navigator
					initialRouteName={"Test"}
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen name={"Error"} component={ErrorScreen} />
					<Stack.Screen name={"Landing"} component={LandingScreen} />
					<Stack.Screen name={"Login"} component={LoginScreen} />
					<Stack.Screen
						name={"PasswordReset"}
						component={PasswordResetScreen}
					/>
					<Stack.Screen name={"WebView"} component={WebViewScreen} />
					<Stack.Screen name={"Test"} component={TestScreen} />
				</Stack.Navigator>
			</NavigationContainer>
		</>
	);
}
