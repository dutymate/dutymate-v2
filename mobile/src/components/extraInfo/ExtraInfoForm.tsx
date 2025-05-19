import * as SecureStore from "expo-secure-store";

import { useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

import { userService } from "@/api/services/userService";
import { Button } from "@/components/common/Button";
import { DropdownComponent } from "@/components/common/Dropdown";
import { StyledText } from "@/components/common/StyledText";
import { RoleCard } from "@/components/extraInfo/RoleCard";
import { ToggleButton } from "@/components/extraInfo/ToggleButton";
import { useUserAuthStore } from "@/store/userAuthStore";
import { AdditionalInfo, UserInfo } from "@/types/user";
import { navigateBasedOnUserRole } from "@/utils/navigation";

/**
 * ExtraInfoFormProps는 ExtraInfoForm 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface ExtraInfoFormProps {
	navigation: any;
}

/**
 * FormData는 ExtraInfoForm 컴포넌트의 상태를 정의하는 타입입니다.
 */
interface FormData {
	grade: number;
	gender: "F" | "M";
	role: "RN" | "HN";
}

const careerOptions = Array.from({ length: 40 }, (_, i) => ({
	label: `${i + 1}년차`,
	value: String(i + 1),
}));

const roleOptions = [
	{
		value: "HN" as const,
		title: "근무표를 생성하고 관리해요",
		position: "수간호사, 근무표 관리자",
		icon: "📋",
	},
	{
		value: "RN" as const,
		title: "근무표를 조회하고 신청해요",
		position: "평간호사",
		icon: "👥",
	},
];

/**
 * ExtraInfoForm 컴포넌트는 사용자의 추가 정보를 입력받는 폼입니다.
 * 연차, 성별, 역할(수간호사/평간호사)을 입력받습니다.
 */
export const ExtraInfoForm = ({ navigation }: ExtraInfoFormProps) => {
	const [formState, setFormState] = useState<FormData>({
		grade: 1,
		gender: "F",
		role: "RN",
	});
	const { setAdditionalInfo, userInfo, setUserInfo } = useUserAuthStore();

	// 폼 에러와 로딩 상태
	const [careerError, setCareerError] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const handleCareerChange = (value: string) => {
		const gradeValue = value ? parseInt(value, 10) : 0;
		const safeGradeValue = isNaN(gradeValue) ? 1 : gradeValue;

		setFormState((prev) => ({ ...prev, grade: safeGradeValue }));
		setCareerError("");
	};

	const handleGenderChange = (index: number) => {
		setFormState((prev) => ({ ...prev, gender: index === 0 ? "F" : "M" }));
	};

	const handleSubmit = async () => {
		if (!formState.grade || isNaN(formState.grade) || formState.grade <= 0) {
			setCareerError("연차를 선택해주세요.");
			Toast.show({
				type: "error",
				text1: "연차를 선택해주세요.",
			});
			return;
		}

		try {
			setIsLoading(true);

			const apiData: AdditionalInfo = {
				grade: Math.max(1, formState.grade),
				gender: formState.gender,
				role: formState.role,
			};

			const response = await userService.submitAdditionalInfo(apiData);

			if (!response || !response.role) {
				throw new Error("응답에서 역할 정보를 찾을 수 없습니다.");
			}

			setAdditionalInfo({
				grade: apiData.grade,
				gender: apiData.gender,
				role: apiData.role,
			});

			Toast.show({
				type: "success",
				text1: "회원 정보 입력이 완료되었습니다.",
			});

			if (userInfo) {
				const updatedUserInfo: UserInfo = {
					...userInfo,
					role: response.role,
					existAdditionalInfo: true,
				};

				setUserInfo(updatedUserInfo);

				try {
					await SecureStore.setItemAsync(
						"user-info",
						JSON.stringify(updatedUserInfo),
					);
				} catch (storageError) {
					console.error("SecureStore 저장 실패:", storageError);
				}

				setTimeout(() => {
					navigateBasedOnUserRole(navigation, updatedUserInfo);
				}, 800);
			} else {
				Toast.show({
					type: "error",
					text1: "사용자 정보를 찾을 수 없습니다.",
					text2: "다시 로그인해주세요.",
				});
				navigation.navigate("Login");
			}
		} catch (error) {
			console.error("부가 정보 제출 중 에러 발생:", error);
			Toast.show({
				type: "error",
				text1: "부가 정보 저장에 실패했습니다.",
				text2: "다시 시도해주세요.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View>
			{/* 간호사 연차 */}
			<View className={"mb-6"}>
				<StyledText className={"text-xl font-semibold mb-1 text-black"}>
					간호사 연차
				</StyledText>
				<DropdownComponent
					placeholder={"연차를 선택해주세요."}
					data={careerOptions}
					value={
						formState.grade && formState.grade > 0 && !isNaN(formState.grade)
							? String(formState.grade)
							: null
					}
					onChange={handleCareerChange}
				/>
				{careerError ? (
					<StyledText className="text-red-500 text-sm mt-1">
						{careerError}
					</StyledText>
				) : null}
			</View>

			{/* 성별 선택 */}
			<View className={"mb-6"}>
				<StyledText
					className={
						"text-xl font-semibold sm:text-[0.9rem]  text-gray-900 mb-[0.375rem] sm:mb-[0.5rem]"
					}
				>
					성별
				</StyledText>
				<ToggleButton
					options={[{ text: "여자" }, { text: "남자" }]}
					selectedIndex={formState.gender === "F" ? 0 : 1}
					onChange={handleGenderChange}
				/>
			</View>

			{/* 역할 선택 */}
			<View className={"mb-6"}>
				<StyledText className={"text-xl font-semibold mb-3 text-black"}>
					어떤 업무를 하시나요?
				</StyledText>
				<View>
					{roleOptions.map((option) => (
						<RoleCard
							key={option.value}
							option={option}
							selected={formState.role === option.value}
							onPress={() =>
								setFormState((prev) => ({ ...prev, role: option.value }))
							}
						/>
					))}
				</View>
				<StyledText className={"text-gray-500 text-sm mt-2"}>
					※ 평간호사도 근무표 생성 기능이 필요한 경우 수간호사{"\n"}
					(근무표 관리자)를 선택해주세요.
				</StyledText>
			</View>

			{/* 제출 버튼 */}
			<Button
				size={"lg"}
				width={"long"}
				color={"tertiary"}
				fullWidth
				disabled={isLoading}
				onPress={handleSubmit}
				className={"w-full h-[3rem]  bg-primary active:bg-primary-dark"}
			>
				<StyledText className={"text-white font-semibold text-lg"}>
					{isLoading ? "제출 중..." : "작성 완료"}
				</StyledText>
			</Button>
		</View>
	);
};
