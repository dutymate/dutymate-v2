import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { StyledText } from "@/components/custom/StyledText";
import { Layout } from "@/layout/Layout";
import { Button } from "@/components/button/Button";

interface ErrorScreenProps {
	navigation: any;
}

export const ErrorScreen = ({ navigation }: ErrorScreenProps) => {
	return (
		<Layout isWaveBackground={false}>
			<View
				className={
					"min-h-screen flex flex-col items-center justify-center px-4"
				}
			>
				<View className={"w-full max-w-md text-center space-y-8"}>
					<View
						className={
							"w-24 h-24 mx-auto bg-primary-bg rounded-full flex items-center justify-center mb-[1.5rem]"
						}
					>
						<Svg
							fill={"none"}
							stroke={"currentColor"}
							viewBox={"0 0 24 24"}
							style={styles.errorSvg}
						>
							<Path
								strokeLinecap={"round"}
								strokeLinejoin={"round"}
								strokeWidth={2}
								d={
									"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								}
							/>
						</Svg>
					</View>
					<View className={"mb-[1.5rem]"}>
						<StyledText className={"text-center"} style={styles.h1}>
							시스템 오류가 발생했습니다.
						</StyledText>
						<StyledText className={"text-center text-base-foreground/70"}>
							네트워크 연결 상태를 확인하거나, 잠시 후 다시 이용해 주세요.
						</StyledText>
					</View>
					<View className={"justify-center items-center"}>
						<Button
							color="tertiary"
							size="lg"
							width="long"
							onPress={() => navigation.navigate("Landing")}
							className="h-[3.5rem] sm:h-[3rem] bg-primary  w-full max-w-[23.2rem] mt-1 mb-1.5"
						>
							<StyledText className="text-[1.25rem] text-white">
								홈으로 가기
							</StyledText>
						</Button>
					</View>
				</View>
			</View>
		</Layout>
	);
};

const styles = StyleSheet.create({
	errorSvg: {
		width: 48,
		height: 48,
		color: "#F37C4C",
	},
	h1: {
		fontSize: 20,
		fontWeight: 900,
		marginBottom: 16,
	},
});
