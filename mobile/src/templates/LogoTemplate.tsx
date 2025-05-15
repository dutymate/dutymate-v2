import React from "react";
import { Dimensions, View } from "react-native";

import Logo from "../../assets/images/text-logo.svg";

const screenWidth = Dimensions.get("window").width;
const logoWidth = screenWidth * 0.6;
const logoHeight = logoWidth * 0.5;

/**
 * LogoTemplateProps는 LogoTemplate 템플릿의 props 타입을 정의합니다.
 */
interface LogoTemplateProps {
	children: React.ReactNode;
}

/**
 * LogoTemplate은 로고와 children을 포함하는 템플릿입니다.
 * @param children
 */
export const LogoTemplate = ({ children }: LogoTemplateProps) => {
	return (
		<View
			className={
				"flex-1 flex flex-col items-center justify-center p-[1rem] py-[0.75rem]"
			}
		>
			<Logo width={logoWidth} height={logoHeight} />
			{children}
		</View>
	);
};
