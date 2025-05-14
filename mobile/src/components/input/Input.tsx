import React from "react";
import { TextInputProps, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { StyledText } from "@/components/custom/StyledText";
import { StyledTextInput } from "@/components/custom/StyledTextInput";

/**
 * InputProps는 Input 컴포넌트의 props 타입을 정의합니다.
 */
interface InputProps extends Omit<TextInputProps, "className"> {
	label?: string;
	placeholder?: string;
	status?: "idle" | "success" | "error";
	successText?: string;
	helpText?: string;
	error?: string;
	editable?: boolean;
	required?: boolean;
	optional?: boolean;
	defaultValue?: string;
	value?: string;
	secureTextEntry?: boolean;
	rightElement?: React.ReactNode;
	keyboardType?: TextInputProps["keyboardType"];
	autoComplete?: TextInputProps["autoComplete"];
	onChangeText?: ((text: string) => void) | undefined;
	onFocus?: () => void;
}

/**
 * Input 컴포넌트는 사용자 입력을 위한 텍스트 입력 필드를 제공합니다.
 * @param label
 * @param placeholder
 * @param status
 * @param successText
 * @param helpText
 * @param error
 * @param editable
 * @param required
 * @param optional
 * @param defaultValue
 * @param value
 * @param secureTextEntry
 * @param rightElement
 * @param keyboardType
 * @param autoComplete
 * @param onChangeText
 * @param onFocus
 * @param rest
 */
export const Input = ({
	label,
	placeholder,
	status,
	successText,
	helpText,
	error,
	editable,
	required,
	optional,
	defaultValue,
	value,
	secureTextEntry,
	rightElement,
	keyboardType,
	autoComplete,
	onChangeText,
	onFocus,
	...rest
}: InputProps) => {
	/**
	 * getStatusClass 함수는 입력 필드의 상태에 따라 클래스 이름을 반환합니다.
	 */
	const getStatusClass = () => {
		if (status === "success") {
			return "border-green-500 focus:border-green-600";
		}
		if (error || status === "error") {
			return "text-red-900 border-red-300 focus:border-red-600";
		}
		return "border-gray-300 focus:border-primary";
	};

	const inputClasses = `
    w-full h-[3.5rem] rounded-lg bg-white px-3 py-3 text-gray-900
    border border-2 ${getStatusClass()}
    ${editable ? "" : "bg-gray-50 text-gray-500 border-gray-200"}
    ${rightElement ? "pr-24" : ""}
    `;

	return (
		<View className={"w-full"}>
			<View className={"flex-row justify-between items-center"}>
				{label && (
					<StyledText className={"text-xl font-semibold text-gray-900"}>
						{label}
						{required && (
							<StyledText className={"text-red-500 text-xl"}> *</StyledText>
						)}
					</StyledText>
				)}
				{error && (
					<StyledText className={"text-md text-red-600"}>{error}</StyledText>
				)}
				{optional && (
					<StyledText className={"text-md text-gray-500"}>선택 사항</StyledText>
				)}
				{status === "success" && successText && (
					<StyledText className={"text-md text-green-600"}>
						{successText}
					</StyledText>
				)}
			</View>
			<View className={`relative mt-1 ${error ? "grid grid-cols-1" : ""}`}>
				<StyledTextInput
					className={inputClasses}
					defaultValue={defaultValue}
					value={value}
					placeholder={placeholder}
					placeholderTextColor="#9ca3af"
					secureTextEntry={secureTextEntry}
					editable={editable}
					keyboardType={keyboardType}
					autoComplete={autoComplete}
					onChangeText={onChangeText}
					onFocus={onFocus}
					textAlignVertical={"center"}
					{...rest}
				/>
				{error && (
					<View className={"absolute right-3 top-1/2 -translate-y-1/2"}>
						<MaterialIcons name="error" size={24} color="#ef4444" />
					</View>
				)}
				{rightElement && (
					<View
						className={`absolute top-1/2 -translate-y-1/2 ${error ? "right-10" : "right-3"}`}
					>
						{rightElement}
					</View>
				)}
			</View>
			{helpText && (
				<StyledText className={"mt-2 text-md text-gray-500"}>
					{helpText}
				</StyledText>
			)}
		</View>
	);
};
