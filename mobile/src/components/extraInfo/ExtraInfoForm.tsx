import { Button } from "@/components/button/Button";
import { RoleCard } from "@/components/extraInfo/RoleCard";
import { StyledText } from "@/components/custom/StyledText";
import { DropdownComponent } from "@/components/dropdown/Dropdown";
import { useState } from "react";
import { View, StyleSheet } from "react-native";

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

	const handleCareerChange = (value: string) => {
		const gradeValue = parseInt(value);
		setFormState((prev) => ({ ...prev, grade: gradeValue }));
		setCareerError("");
	};

	const handleSubmit = () => {
		if (formState.grade <= 0) {
			setCareerError("연차를 선택해주세요.");
			return;
		}
		// TODO: Handle form submission
		console.log(formState);
	};
	return (
		<View>
			{/* 간호사 연차 */}
			<View className="mb-8">
				<StyledText className="text-lg font-semibold mb-3 text-black">
					간호사 연차
				</StyledText>
				<DropdownComponent
					placeholder="연차를 선택해주세요."
					data={careerOptions}
					value={formState.grade > 0 ? String(formState.grade) : null}
					onChange={handleCareerChange}
					required
				/>
			</View>

			{/* 성별 선택 */}
			<View className="mb-8">
				<StyledText className="text-lg font-semibold mb-3 text-black">
					성별
				</StyledText>
				<View className="flex-row gap-2">
					<Button
						color={formState.gender === "F" ? "primary" : "muted"}
						size="lg"
						style={[
							styles.genderButton,
							{
								borderColor: formState.gender === "F" ? "#FF9999" : "#E5E7EB",
								backgroundColor:
									formState.gender === "F" ? "#FFFFFF" : "#F3F4F6",
							},
						]}
						onPress={() => setFormState((prev) => ({ ...prev, gender: "F" }))}
					>
						<StyledText
							className={`text-base font-medium ${formState.gender === "F" ? "text-[#FF9999]" : "text-gray-500"}`}
						>
							여자
						</StyledText>
					</Button>
					<Button
						color={formState.gender === "M" ? "primary" : "muted"}
						size="lg"
						style={[
							styles.genderButton,
							{
								borderColor: formState.gender === "M" ? "#FF9999" : "#E5E7EB",
								backgroundColor:
									formState.gender === "M" ? "#FFFFFF" : "#F3F4F6",
							},
						]}
						onPress={() => setFormState((prev) => ({ ...prev, gender: "M" }))}
					>
						<StyledText
							className={`text-base font-medium ${formState.gender === "M" ? "text-[#FF9999]" : "text-gray-500"}`}
						>
							남자
						</StyledText>
					</Button>
				</View>
			</View>

			{/* 역할 선택 */}
			<View className="mb-6">
				<StyledText className="text-lg font-semibold mb-3 text-black">
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
				<StyledText className="text-gray-500 text-xs mt-2">
					* 평간호사도 근무표 생성 기능이 필요한 경우 수간호사(근무표 관리자)를
					선택해주세요.
				</StyledText>
			</View>

			{/* 제출 버튼 */}
			<Button
				color="primary"
				size="lg"
				style={styles.submitButton}
				onPress={handleSubmit}
			>
				<StyledText className="text-[#FF9999] text-base font-semibold">
					작성 완료
				</StyledText>
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
