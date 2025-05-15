import Constants from "expo-constants";

import { Linking, Platform, StyleSheet, View } from "react-native";

import { Button } from "@/components/button/Button";
import { StyledText } from "@/components/custom/StyledText";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * LandingScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface LandingScreenProps {
	navigation: any;
}

/**
 * LandingScreen은 앱의 시작 화면입니다.
 * @param navigation
 */
export const TestScreen = ({ navigation }: LandingScreenProps) => {
	


	return (
		<Layout>
			<LogoTemplate>
				<View>
                    <StyledText className={"text"}>야호</StyledText>
                </View>
			</LogoTemplate>
		</Layout>
	);
};

const styles = StyleSheet.create({
	h1: {
		fontSize: 20,
		fontWeight: 900,
		marginBottom: 16,
	},
	shadowMd: {
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.1,
				shadowRadius: 6,
			},
			android: {
				elevation: 4,
			},
		}),
	},
});
