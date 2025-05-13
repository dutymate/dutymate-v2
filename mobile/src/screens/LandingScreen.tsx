import { Platform, StyleSheet } from "react-native";

import { Button } from "@/components/button/Button";
import { StyledText } from "@/components/custom/StyledText";
import { Layout } from "@/layout/Layout";

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
export const LandingScreen = ({ navigation }: LandingScreenProps) => {
	return (
		<Layout className={"justify-center items-center"}>
			<Button
				color="tertiary"
				size="lg"
				width="long"
				onPress={() => navigation.navigate("WebView")}
				className="h-[3.5rem] sm:h-[3rem] bg-primary hover:bg-primary-dark text-white w-full max-w-[23.2rem] mt-1"
				style={styles.shadowMd}
			>
				<StyledText className="text-[1rem]">시작하기</StyledText>
			</Button>
		</Layout>
	);
};

const styles = StyleSheet.create({
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
