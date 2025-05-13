import React from "react";
import { View } from "react-native";

import { WaveBackground } from "@/components/background/WaveBackground";

/**
 * LayoutProps는 Layout 컴포넌트의 props 타입을 정의합니다.
 */
interface LayoutProps {
	children: React.ReactNode;
	className?: string;
	isWebView?: boolean;
}

/**
 * Layout 컴포넌트는 기본적인 레이아웃을 제공합니다.
 * @param children
 * @param className
 * @param isWebView
 */
export const Layout = ({
	children,
	className,
	isWebView = false,
}: LayoutProps) => {
	return (
		<View
			className={`flex-1 ${className} ${isWebView ? "bg-base-muted-30" : ""}`}
		>
			{!isWebView && <WaveBackground />}
			{children}
		</View>
	);
};
