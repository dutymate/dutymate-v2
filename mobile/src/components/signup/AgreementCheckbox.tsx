import { View, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

import { StyledText } from "@/components/common/StyledText";

/**
 * AgreementCheckboxProps는 AgreementCheckbox 컴포넌트의 props 타입을 정의합니다.
 */
interface AgreementCheckboxProps {
	isChecked: boolean;
	disabled?: boolean;
	onPress?: () => void;
}

/**
 * AgreementCheckbox 컴포넌트는 약관 동의 체크박스를 렌더링합니다.
 * @param isChecked
 * @param disabled
 * @param onPress
 */
export const AgreementCheckbox = ({
	isChecked,
	disabled = false,
	onPress,
}: AgreementCheckboxProps) => {
	return (
		<View className="mt-2 flex justify-center items-center">
			<Pressable
				onPress={onPress}
				disabled={disabled}
				className={`flex-row items-center ${disabled ? "opacity-50" : ""}`}
			>
				<View
					className={`w-[1.25rem] h-[1.25rem] rounded-[0.125rem] justify-center items-center border ${
						isChecked
							? "border-primary-dark bg-primary-dark"
							: "border-gray-500 bg-transparent"
					}`}
				>
					{isChecked && <Icon name="check" size={16} color="#ffffff" />}
				</View>
				<StyledText className="ml-1.5 text-md sm:text-sm text-gray-600">
					개인정보 수집 및 이용에 동의합니다.
				</StyledText>
			</Pressable>
		</View>
	);
};
