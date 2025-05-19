import { View } from "react-native";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { Button } from "@/components/common/Button";
import { useState } from "react";
import { wardService } from "@/api/services/wardService";
import { useUserAuthStore } from "@/store/userAuthStore";
import Toast from "react-native-toast-message";

/**
 * CreateWardFormProps는 CreateWardForm 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface CreateWardFormProps {
	navigation: any;
}

/**
 * CreateWardForm 컴포넌트는 병동 생성 폼입니다.
 * @param props
 */
export const CreateWardForm = ({ navigation }: CreateWardFormProps) => {
	const { userInfo, setUserInfo } = useUserAuthStore();
	const [formData, setFormData] = useState({
		hospitalName: "",
		wardName: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<{
		hospitalName?: string;
		wardName?: string;
	}>({});

	const handleHospitalNameChange = (text: string) => {
		setFormData((prev) => ({ ...prev, hospitalName: text }));
		setError((prev) => ({ ...prev, hospitalName: undefined }));
	};

	const handleWardNameChange = (text: string) => {
		setFormData((prev) => ({ ...prev, wardName: text }));
		setError((prev) => ({ ...prev, wardName: undefined }));
	};

	const handleCreateWard = async () => {
		// 유효성 검사
		let isValid = true;
		const newErrors: { hospitalName?: string; wardName?: string } = {};

		if (!formData.hospitalName.trim()) {
			newErrors.hospitalName = "병원명을 입력해주세요.";
			isValid = false;
		}

		if (!formData.wardName.trim()) {
			newErrors.wardName = "병동명을 입력해주세요.";
			isValid = false;
		}

		setError(newErrors);

		if (!isValid) {
			return;
		}

		setIsLoading(true);

		try {
			// 병동 생성 API 호출
			await wardService.createWard({
				hospitalName: formData.hospitalName.trim(),
				wardName: formData.wardName.trim(),
			});

			// 사용자 정보 업데이트
			if (userInfo) {
				setUserInfo({
					...userInfo,
					existMyWard: true,
					role: "HN",
				});
			}

			// 성공 메시지 표시
			Toast.show({
				type: "success",
				text1: "병동이 생성되었습니다.",
			});

			// WebView로 이동 (shift-admin 페이지)
			setTimeout(() => {
				navigation.navigate("WebView", { path: "/shift-admin" });
			}, 1000);
		} catch (error: any) {
			console.error("병동 생성 실패:", error);
			Toast.show({
				type: "error",
				text1: "병동 생성에 실패했습니다.",
				text2: "다시 시도해주세요.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[0.5rem] gap-y-4"}>
					<Input
						label={"병원명"}
						placeholder={"병원명을 입력해주세요."}
						value={formData.hospitalName}
						onChangeText={handleHospitalNameChange}
						keyboardType={"default"}
						error={error.hospitalName}
					/>
					<Input
						label={"병동명"}
						placeholder={"병동명을 입력해주세요."}
						value={formData.wardName}
						onChangeText={handleWardNameChange}
						keyboardType={"default"}
						error={error.wardName}
					/>
					<Button
						size={"lg"}
						width={"long"}
						color={"tertiary"}
						className={
							"w-full h-[3rem] bg-primary active:bg-primary-dark mt-[1rem]"
						}
						onPress={handleCreateWard}
						disabled={isLoading}
					>
						<StyledText className={"text-white font-semibold text-lg"}>
							{isLoading ? "생성 중..." : "생성하기"}
						</StyledText>
					</Button>
				</View>
			</View>
		</View>
	);
};
