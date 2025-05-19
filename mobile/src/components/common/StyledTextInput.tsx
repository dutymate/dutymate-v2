import { TextInput, TextInputProps } from "react-native";

/**
 * StyledTextInputProps는 StyledTextInput 컴포넌트의 props 타입을 정의합니다.
 */
interface StyledTextInputProps extends TextInputProps {
	className?: string;
}

/**
 * StyledTextInput 컴포넌트는 TextInput 컴포넌트를 래핑하여 Pretendard 폰트를 사용합니다.
 * @param className
 * @param rest
 */
export const StyledTextInput = ({
	className,
	...rest
}: StyledTextInputProps) => {
	return (
		<TextInput
			className={`font-pretendard ${className || ""}`}
			autoCapitalize="none"
			{...rest}
		/>
	);
};
