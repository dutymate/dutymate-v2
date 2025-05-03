import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Input";
import ToggleButton from "@/components/atoms/ToggleButton";

interface FormData {
	grade: number;
	gender: "F" | "M";
	role: "RN" | "HN";
}

interface RoleOption {
	value: "RN" | "HN";
	title: string;
	position: string;
	icon: string;
}

const roleOptions: RoleOption[] = [
	{
		value: "HN",
		title: "근무표를 생성하고 관리해요",
		position: "수간호사, 근무표 관리자",
		icon: "📋",
	},
	{
		value: "RN",
		title: "근무표를 조회하고 신청해요",
		position: "평간호사",
		icon: "👥",
	},
];

interface RoleCardProps {
	option: RoleOption;
	selected: boolean;
	onClick: () => void;
}

const RoleCard = ({ option, selected, onClick }: RoleCardProps) => {
	return (
		<div
			className={`cursor-pointer p-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
				selected
					? "bg-base-white border border-primary text-primary"
					: "bg-white border border hover:bg-base-muted-30"
			}`}
			onClick={onClick}
		>
			<div className="flex items-center gap-3">
				<span className="text-2xl">{option.icon}</span>
				<div className="flex-1">
					<p
						className={`text-[0.8125rem] ${selected ? "text-primary" : "text-gray-500"}`}
					>
						{option.position}
					</p>
					<h3
						className={`font-medium text-[0.9375rem] ${selected ? "text-primary" : "text-gray-900"}`}
					>
						{option.title}
					</h3>
				</div>
			</div>
			<div
				className={`w-5 h-5 rounded-full border flex items-center justify-center ${
					selected ? "border-primary bg-primary" : "border-gray-300 bg-white"
				}`}
			>
				{selected && (
					<svg
						className="w-3 h-3 text-white"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clipRule="evenodd"
						/>
					</svg>
				)}
			</div>
		</div>
	);
};

interface ExtraInfoFormProps {
	initialData?: FormData;
	onSubmit: (data: FormData) => void;
}

const ExtraInfoForm = ({ initialData, onSubmit }: ExtraInfoFormProps) => {
	const [formState, setFormState] = useState<FormData>({
		grade: initialData?.grade || 0,
		gender: initialData?.gender || "F",
		role: initialData?.role || "RN",
	});

	const [isLoading, setIsLoading] = useState(false);
	const [careerError, setCareerError] = useState<string>("");

	const careerOptions = Array.from({ length: 40 }, (_, i) => ({
		value: String(i + 1),
		label: `${i + 1}년차`,
	}));

	const handleCareerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = parseInt(e.target.value);
		setFormState((prev) => ({ ...prev, grade: value }));
		setCareerError("");
	};

	const handleGenderChange = (index: number) => {
		setFormState((prev) => ({
			...prev,
			gender: index === 0 ? "F" : "M",
		}));
	};

	const handleRoleSelect = (role: "RN" | "HN") => {
		setFormState((prev) => ({ ...prev, role }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (formState.grade <= 0) {
				setCareerError("연차를 선택해주세요.");
				return;
			}
			await onSubmit(formState);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] w-[20rem] px-[1.5rem] py-[1.5rem] sm:w-[23rem] sm:px-[2.5rem] sm:py-[2.5rem] lg:w-[26rem] lg:px-[3rem] lg:py-[3rem]">
			<form onSubmit={handleSubmit}>
				{/* 간호사 연차 입력 */}
				<div className="mb-[1rem] sm:mb-[1.5rem] [&_*]:text-[0.875rem] sm:[&_*]:text-[1rem] [&_span]:text-[0.75rem] sm:[&_span]:text-[0.875rem] [&_div.mt-2]:mt-1.5 sm:[&_div.mt-2]:mt-2 [&_select]:py-2 sm:[&_select]:py-2.5 [&_label]:text-[0.875rem] sm:[&_label]:text-[1rem] [&_.text-sm]:text-[0.75rem] sm:[&_.text-sm]:text-[0.875rem]">
					<Select
						id="career"
						name="career"
						label="간호사 연차"
						placeholder="연차를 선택해주세요."
						options={careerOptions}
						value={formState.grade > 0 ? String(formState.grade) : ""}
						onChange={handleCareerChange}
						error={careerError}
						required
					/>
				</div>

				{/* 성별 선택 */}
				<div className="mb-[1rem] sm:mb-[1.5rem]">
					<label className="block text-[0.875rem] sm:text-[1rem] font-medium text-gray-900 mb-[0.5rem] sm:mb-[0.75rem]">
						성별
					</label>
					<ToggleButton
						options={[{ text: "여자" }, { text: "남자" }]}
						selectedIndex={formState.gender === "F" ? 0 : 1}
						onChange={handleGenderChange}
						variant="gender"
					/>
				</div>

				{/* 역할 선택 */}
				<div className="mb-[1.5rem] sm:mb-[2rem] lg:mb-[2.5rem]">
					<label className="block text-[0.875rem] sm:text-[1rem] font-medium text-gray-900 mb-[0.5rem] sm:mb-[0.75rem]">
						어떤 업무를 하시나요?
					</label>
					<div className="space-y-1.5 sm:space-y-2">
						{roleOptions.map((option) => (
							<RoleCard
								key={option.value}
								option={option}
								selected={formState.role === option.value}
								onClick={() => handleRoleSelect(option.value)}
							/>
						))}
					</div>
					<p className="mt-1.5 sm:mt-2 text-[0.75rem] sm:text-[0.8125rem] text-gray-500">
						* 평간호사도 근무표 생성 기능이 필요한 경우 수간호사(근무표
						관리자)를 선택해주세요.
					</p>
				</div>

				{/* 작성 완료 버튼 */}
				<div className="mt-[1.5rem] sm:mt-[2rem] lg:mt-0">
					<Button
						type="submit"
						size="lg"
						width="long"
						fullWidth
						disabled={isLoading}
						className="w-full h-[3rem] sm:h-[3.5rem] lg:h-[3rem] text-[0.875rem] sm:text-[1.125rem] lg:text-[0.875rem]"
					>
						<span>{isLoading ? "제출 중..." : "작성 완료"}</span>
					</Button>
				</div>
			</form>
		</div>
	);
};

export default ExtraInfoForm;
