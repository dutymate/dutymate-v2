import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { StyledText } from "@/components/common/StyledText";

/**
 * DropdownProps는 DropdownComponent의 props 타입을 정의합니다.
 */
interface DropdownProps {
	label?: string;
	placeholder?: string;
	data: Array<{ label: string; value: string | number }>;
	value: string | number | null;
	onChange: (value: any) => void;
	error?: string;
	disabled?: boolean;
	required?: boolean;
	optional?: boolean;
}

/**
 * DropdownComponent는 드롭다운 컴포넌트를 렌더링합니다.
 * @param label
 * @param placeholder
 * @param data
 * @param value
 * @param onChange
 * @param error
 * @param disabled
 */
export const DropdownComponent = ({
	label,
	placeholder,
	data,
	value,
	onChange,
	error,
	disabled,
}: DropdownProps) => {
	const [isFocus, setIsFocus] = useState(false);

	// 안전한 value 처리를 위한 계산
	const safeValue = useMemo(() => {
		// null, undefined, NaN 등의 경우 null 반환
		if (
			value === null ||
			value === undefined ||
			(typeof value === "number" && isNaN(value))
		) {
			return null;
		}
		return value;
	}, [value]);

	const dropdownStyle = useMemo(
		() => [
			styles.dropdown,
			{
				backgroundColor: disabled ? "base-muted-30" : "base-white",
				borderColor: error ? "#ef4444" : isFocus ? "#F5A281" : "#D9D9D9",
			},
		],
		[error, disabled, isFocus],
	);

	return (
		<View className={"w-full mt-2"}>
			<View className={"flex-row justify-between items-center mb-2"}>
				{label && (
					<StyledText className={"text-base font-medium text-base-foreground"}>
						{label}
					</StyledText>
				)}
				{error && (
					<StyledText className={"text-sm text-red-600"}>{error}</StyledText>
				)}
			</View>
			<View className={"relative"}>
				<Dropdown
					style={dropdownStyle}
					placeholder={placeholder}
					placeholderStyle={styles.placeholder}
					selectedTextStyle={[
						styles.selectedText,
						{
							color: disabled ? "#D9D9D9" : safeValue ? "#4D4D4D" : "#4D4D4D",
							textAlign: safeValue ? "center" : "left",
							fontWeight: safeValue ? 500 : 400,
						},
					]}
					data={data}
					maxHeight={300}
					labelField={"label"}
					valueField={"value"}
					value={safeValue}
					onFocus={() => setIsFocus(true)}
					onBlur={() => setIsFocus(false)}
					onChange={(item) => {
						// 값 안전성 검사
						const itemValue =
							item && item.value !== undefined ? item.value : null;
						onChange(itemValue);
						setIsFocus(false);
					}}
					disable={disabled}
					containerStyle={styles.container}
					itemContainerStyle={styles.itemContainer}
					itemTextStyle={styles.itemText}
					renderRightIcon={() => (
						<MaterialIcons
							name={isFocus ? "keyboard-arrow-up" : "keyboard-arrow-down"}
							size={24}
							color={"#D9D9D9"}
						/>
					)}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	dropdown: {
		height: 48,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 2,
	},
	placeholder: {
		fontSize: 16,
		color: "#D9D9D9",
		textAlign: "left",
	},
	selectedText: {
		fontSize: 16,
	},
	container: {
		borderRadius: 8,
		marginTop: 4,
		borderWidth: 2,
		borderColor: "#D9D9D9",
		backgroundColor: "#FFFFFF",
	},
	itemContainer: {
		paddingHorizontal: 12,
		paddingVertical: 0,
	},
	itemText: {
		fontSize: 16,
		color: "#4D4D4D",
		textAlign: "center",
		fontWeight: 500,
	},
});
