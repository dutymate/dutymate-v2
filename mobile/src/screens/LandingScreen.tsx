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
export const LandingScreen = ({ navigation }: LandingScreenProps) => {
	/**
	 * handleGoToTutorial 함수는 튜토리얼으로 이동하는 함수입니다.
	 */
	const handleGoToTutorial = async () => {
		try {
			const tutorialUrl = Constants.expoConfig?.extra?.tutorialUrl;
			await Linking.openURL(tutorialUrl);
		} catch (error) {
			navigation.navigate("Error");
		}
	};

	/**
	 * handleGoToYoutube 함수는 소개영상으로 이동하는 함수입니다.
	 */
	const handleGoToYoutube = async () => {
		try {
			const youtubeUrl = Constants.expoConfig?.extra?.youtubeUrl;
			await Linking.openURL(youtubeUrl);
		} catch (error) {
			navigation.navigate("Error");
		}
	};

	return (
		<Layout>
			<LogoTemplate>
				<View className={"mb-[1.5rem]"}>
					<StyledText className={"text-center"} style={styles.h1}>
						"듀티표의 마침표, 듀티메이트."
					</StyledText>
					<StyledText
						className={"text-center text-[1.125rem] text-gray-600 mb-[0.5rem]"}
					>
						간호사 업무의 효율성과 공정성을 높이는
					</StyledText>
					<StyledText
						className={"text-center text-[1.125rem] text-gray-600 mb-[0.5rem]"}
					>
						근무표 자동 생성 서비스.
					</StyledText>
				</View>
				<Button
					color="tertiary"
					size="lg"
					width="long"
					onPress={() => navigation.navigate("Login")}
					className="h-[3.5rem] sm:h-[3rem] bg-primary hover:bg-primary-dark text-white w-full max-w-[23.2rem] mt-1 mb-1.5"
					style={styles.shadowMd}
				>
					<StyledText className="text-[1.25rem] text-white">
						시작하기
					</StyledText>
				</Button>
				<View className={"w-full max-w-[23.2rem] mt-4 pt-4"}>
					<StyledText
						className={"text-center text-[1.125rem] text-gray-600 mb-[0.5rem]"}
					>
						사용법이 궁금하다면?{" "}
						<StyledText
							className={"text-primary-dark font-semibold"}
							onPress={handleGoToTutorial}
						>
							튜토리얼
						</StyledText>
						{" | "}
						<StyledText
							className={"text-primary-dark font-semibold"}
							onPress={handleGoToYoutube}
						>
							소개영상
						</StyledText>
					</StyledText>
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
