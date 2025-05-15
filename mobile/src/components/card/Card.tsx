import React from "react";
import { Platform, StyleSheet, View } from "react-native";

/**
 * CardProps는 Card 컴포넌트의 props 타입을 정의합니다.
 */
interface CardProps {
	children: React.ReactNode;
}

/**
 * Card 컴포넌트는 카드 형태의 UI를 렌더링합니다.
 * @param children
 */
export const Card = ({ children }: CardProps) => {
	return (
		<View
			className={
				"bg-white rounded-[0.925rem] w-[25rem] px-[2rem] py-[2rem] sm:w-[23rem] sm:px-[2.5rem] sm:py-[2.5rem] lg:w-[26rem] lg:px-[3rem] lg:py-[3rem]"
			}
			style={styles.shadowBox}
		>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	shadowBox: {
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.1,
				shadowRadius: 12,
			},
			android: {
				elevation: 2,
			},
		}),
	},
});
