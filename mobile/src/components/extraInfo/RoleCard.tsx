import { View, TouchableOpacity } from "react-native";
import { StyledText } from "@/components/custom/StyledText";

interface RoleOption {
	value: "RN" | "HN";
	title: string;
	position: string;
	icon: string;
}

interface RoleCardProps {
	option: RoleOption;
	selected: boolean;
	onPress: () => void;
}

export const RoleCard = ({ option, selected, onPress }: RoleCardProps) => {
	return (
		<TouchableOpacity
			onPress={onPress}
			className={`border rounded-lg p-4 bg-white ${selected ? "border-[#FF9999]" : "border-gray-200"}`}
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<View className="mr-3">
						<StyledText className="text-2xl">{option.icon}</StyledText>
					</View>
					<View>
						<StyledText
							className={`text-xs mb-1 ${selected ? "text-[#FF9999]" : "text-gray-500"}`}
						>
							{option.position}
						</StyledText>
						<StyledText
							className={`text-base font-semibold ${selected ? "text-[#FF9999]" : "text-black"}`}
						>
							{option.title}
						</StyledText>
					</View>
				</View>
				{selected && (
					<View className="w-6 h-6 rounded-full bg-[#FF9999] items-center justify-center">
						<StyledText className="text-white text-base">
							✓
						</StyledText>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
};
