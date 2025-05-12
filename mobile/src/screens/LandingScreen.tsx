import { StyledText } from "@/components/styled/StyledText";
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
			<StyledText
				className={"text-2xl"}
				onPress={() => navigation.navigate("WebView")}
			>
				Hello World
			</StyledText>
		</Layout>
	);
};
