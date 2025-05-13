import React from "react";
import { Text, TextProps } from "react-native";

/**
 * StyledTextProps는 StyledText 컴포넌트의 props 타입을 정의합니다.
 * TextProps를 상속받아 Text 컴포넌트의 모든 props를 사용할 수 있습니다.
 */
interface StyledTextProps extends TextProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * StyledText 컴포넌트는 Text 컴포넌트를 래핑하여 Pretendard 폰트를 사용합니다.
 * @param props
 */
export const StyledText = ({
	children,
	className,
	...rest
}: StyledTextProps) => {
	return (
		<Text className={`font-pretendard ${className || ""}`} {...rest}>
			{children}
		</Text>
	);
};
