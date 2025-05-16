import { Button } from "@/components/button/Button";
import { ToggleButton } from "@/components/button/ToggleButton";
import { RoleCard } from "@/components/extraInfo/RoleCard";
import { StyledText } from "@/components/custom/StyledText";
import { DropdownComponent } from "@/components/dropdown/Dropdown";
import { useState } from "react";
import { View, StyleSheet } from "react-native";

/**
 * ExtraInfoForm 컴포넌트는 사용자의 추가 정보를 입력받는 폼을 렌더링합니다.
 * 연차, 성별, 역할(수간호사/평간호사)을 입력받습니다.
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

export const ExtraInfoForm = () => {
	const [formState, setFormState] = useState<FormData>({
		grade: 0,
		gender: "F",
		role: "RN",
	});

	const [careerError, setCareerError] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const handleCareerChange = (value: string) => {
		const gradeValue = parseInt(value);
		setFormState((prev) => ({ ...prev, grade: gradeValue }));
		setCareerError("");
	};

	const handleGenderChange = (index: number) => {
		setFormState((prev) => ({ ...prev, gender: index === 0 ? "F" : "M" }));
	};

	const handleSubmit = () => {
		if (formState.grade <= 0) {
			setCareerError("연차를 선택해주세요.");
			return;
		}
	};

	return (
		<View>
			{/* 간호사 연차 */}
			<View className="mb-6">
				<StyledText className="text-xl font-semibold mb-1 text-black">
					간호사 연차
				</StyledText>
				<DropdownComponent
					placeholder="연차를 선택해주세요."
					data={careerOptions}
					value={formState.grade > 0 ? String(formState.grade) : null}
					onChange={handleCareerChange}
				/>
			</View>

			{/* 성별 선택 */}
			<View className="mb-6">
				<StyledText className="text-xl font-semibold sm:text-[0.9rem]  text-gray-900 mb-[0.375rem] sm:mb-[0.5rem]">
					성별
				</StyledText>
				<ToggleButton
					options={[{ text: "여자" }, { text: "남자" }]}
					selectedIndex={formState.gender === "F" ? 0 : 1}
					onChange={handleGenderChange}
					variant="gender"
				/>
			</View>

			{/* 역할 선택 */}
			<View className="mb-6">
				<StyledText className="text-xl font-semibold mb-3 text-black">
					어떤 업무를 하시나요?
				</StyledText>
				<View className="gap-2">
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
				<StyledText className="text-gray-500 text-sm mt-2">
					* 평간호사도 근무표 생성 기능이 필요한 경우 수간호사(근무표 관리자)를
					선택해주세요.
				</StyledText>
			</View>

			{/* 제출 버튼 */}
			<Button
				size="lg"
				width="long"
				color="tertiary"
				fullWidth
				disabled={isLoading}
				onPress={handleSubmit}
				className="w-full h-[3rem]  bg-primary active:bg-primary-dark text-white"
			>
				<StyledText className="text-white font-semibold text-lg">{isLoading ? '제출 중...' : '작성 완료'}</StyledText>
			</Button>
		</View>
	);
};

const styles = StyleSheet.create({
	genderButton: {
		flex: 1,
		borderWidth: 1,
	},
	submitButton: {
		width: "100%",
		backgroundColor: "#FFE5E5",
		height: 56,
	},
});
