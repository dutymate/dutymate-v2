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
			className={`border rounded-lg p-4 bg-white ${selected ? "border-primary" : "border-gray-200"}`}
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<View className="mr-4">
						<StyledText className="text-2xl">{option.icon}</StyledText>
					</View>
					<View>
						<StyledText
							className={`text-sm mb-1 ${selected ? "text-primary" : "text-gray-500"}`}
						>
							{option.position}
						</StyledText>
						<StyledText
							className={`text-base font-semibold ${selected ? "text-primary" : "text-black"}`}
						>
							{option.title}
						</StyledText>
					</View>
				</View>
				{selected && (
					<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
						<StyledText className="text-white text-base">✓</StyledText>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
};
