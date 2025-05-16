import React from "react";
import { TouchableOpacity, View } from "react-native";

import { StyledText } from "@/components/common/StyledText";

/**
 * ToggleButtonOption은 ToggleButton의 각 옵션을 정의합니다.
 */
interface ToggleButtonOption {
	text: string;
	icon?: string;
}

/**
 * ToggleButtonProps는 ToggleButton 컴포넌트의 props 타입을 정의합니다.
 */
interface ToggleButtonProps {
	options: ToggleButtonOption[];
	selectedIndex: number;
	onChange: (index: number) => void;
	variant?: "default" | "request" | "gender";
}

/**
 * ToggleButton 컴포넌트는 여러 옵션 중 하나를 선택할 수 있는 버튼을 렌더링합니다.
 * @param options
 * @param selectedIndex
 * @param onChange
 */
export const ToggleButton = ({
	options,
	selectedIndex,
	onChange,
}: ToggleButtonProps) => {
	return (
		<View className="flex-row bg-base-muted-30 rounded-lg p-1 w-full">
			{options.map((option, index) => {
				const isSelected = selectedIndex === index;
				return (
					<TouchableOpacity
						key={index}
						onPress={() => onChange(index)}
						className={`
              flex-1 
              p-3 
              rounded-md
              ${isSelected ? "bg-white border border-primary" : "bg-transparent border border-transparent"}
              items-center 
              justify-center 
              flex-row 
              gap-2
            `}
					>
						<StyledText
							className={`
                text-lg
                ${isSelected ? "text-primary font-medium" : "text-base-foreground"}
              `}
						>
							{option.text}
						</StyledText>
					</TouchableOpacity>
				);
			})}
		</View>
	);
};
