import { TouchableOpacity, View } from "react-native";

import { CustomImage } from "@/components/custom/CustomImage";
import { StyledText } from "@/components/custom/StyledText";

import GoogleLogo from "assets/images/google-logo.png";
import KakaoLogo from "assets/images/kakao-logo.png";

/**
 * SocialLoginButton 컴포넌트의 props 타입을 정의합니다.
 */
interface SocialLoginButtonProps {
	social: "kakao" | "google";
	onPress: () => void;
}

/**
 * SocialLoginButton 컴포넌트는 소셜 로그인 버튼을 렌더링합니다.
 * @param social
 * @param onPress
 */
export const SocialLoginButton = ({
	social,
	onPress,
}: SocialLoginButtonProps) => {
	const baseClass =
		"w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[1rem] sm:text-[0.875rem] font-medium text-[#000000] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 relative";
	const colorClass =
		social === "kakao"
			? "bg-[#FEE500] hover:bg-[#FDD835] focus:ring-[#FEE500]"
			: "bg-[#F2F2F2] hover:bg-[#E6E6E6] focus:ring-[#F2F2F2]";
	const className = `${baseClass} ${colorClass}`;
	const logoSrc = social === "kakao" ? KakaoLogo : GoogleLogo;
	const text =
		social === "kakao" ? "카카오 계정으로 시작하기" : "구글 계정으로 시작하기";

	return (
		<TouchableOpacity
			className={`${className} flex-row items-center`}
			onPress={onPress}
		>
			<View className={"w-[1.5rem] items-start pl-[0.25rem]"}>
				<CustomImage src={logoSrc} className={"w-[1rem] h-[1rem]"} />
			</View>
			<StyledText
				className={"flex-1 text-center text-[1rem] font-medium text-black"}
			>
				{text}
			</StyledText>
		</TouchableOpacity>
	);
};
