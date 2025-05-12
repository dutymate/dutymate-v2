import { StatusBar } from "expo-status-bar";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { LandingScreen } from "@/screens/LandingScreen";
import { WebViewScreen } from "@/screens/WebViewScreen";

const Stack = createStackNavigator();

/**
 * 앱의 메인 컴포넌트입니다.
 * 이 컴포넌트는 React Navigation을 사용하여 앱의 내비게이션을 설정합니다.
 */
export default function App() {
	return (
		<>
			<StatusBar style="auto" />
			<NavigationContainer>
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
