import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

/**
 * WaveBackground 컴포넌트는 배경에 애니메이션 효과를 추가합니다.
 */
export const WaveBackground = () => {
	const translateX = useSharedValue(0);

	useEffect(() => {
		translateX.value = withRepeat(
			withTiming(-width, {
				duration: 8000,
				easing: Easing.linear,
			}),
			-1,
			true,
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	return (
		<View className={"absolute top-0 left-0 right-0 bottom-0 overflow-hidden"}>
			<Animated.View style={[styles.gradientWrapper, animatedStyle]}>
				<LinearGradient
					colors={["#FFE6DC", "#FFFFFF", "#FFE6DC", "#FFFFFF", "#FFE6DC"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.gradient}
				/>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	gradientWrapper: {
		...StyleSheet.absoluteFillObject,
		width: width * 2,
	},
	gradient: {
		flex: 1,
	},
});
