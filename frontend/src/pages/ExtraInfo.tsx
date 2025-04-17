import { useState } from "react";
import LandingTemplate from "../components/templates/LandingTemplate";
import ExtraInfoForm from "../components/organisms/ExtraInfoForm";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import useUserAuthStore from "../store/userAuthStore";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
// Mock 응답 데이터 import (임시로 주석 처리)
// import mockResponse from "../services/response-json/user/PostApiMemberInfo.json";
import { SEO } from "../components/SEO";
interface FormData {
	grade: number;
	gender: "F" | "M";
	role: "RN" | "HN";
}

const ExtraInfo = () => {
	const navigate = useNavigate();
	const { setAdditionalInfo } = useUserAuthStore();
	const [formData, setFormData] = useState<FormData>({
		grade: 0,
		gender: "F",
		role: "RN",
	});

	const handleSubmit = async (data: FormData) => {
		// console.log("ExtraInfo handleSubmit 호출됨:", data);

		try {
			setFormData(data);

			const apiData = {
				grade: data.grade,
				gender: data.gender,
				role: data.role,
			};

			// console.log("API 요청 데이터:", apiData);

			const response = await userService.submitAdditionalInfo(apiData);
			// console.log("API 응답:", response);

			setAdditionalInfo({
				grade: apiData.grade,
				gender: apiData.gender,
				role: apiData.role,
			});

			// console.log("전역 상태 업데이트 완료");

			toast.success("회원 가입이 완료되었습니다.", {
				position: "top-center",
				autoClose: 3000,
			});

			// 명확한 타입 체크 추가
			setTimeout(() => {
				if (response && response.role === "HN") {
					// console.log("수간호사로 병동 생성 페이지로 이동");
					navigate("/create-ward");
				} else if (response && response.role === "RN") {
					// console.log("평간호사로 병동 입장 페이지로 이동");
					navigate("/enter-ward");
				} else {
					console.error("Invalid role in response:", response);
					toast.error("역할 정보가 올바르지 않습니다.");
					navigate("/error");
				}
			}, 1000);
		} catch (error) {
			console.error("부가 정보 제출 중 에러 발생:", error);
			if (error instanceof Error) {
				if (error.message === "서버 연결 실패") {
					toast.error("잠시 후 다시 시도해주세요.");
					return;
				}
				if (error.message === "UNAUTHORIZED") {
					navigate("/login");
					return;
				}
			}
			if ((error as AxiosError)?.response?.status === 400) {
				toast.error("부가 정보 저장에 실패했습니다.");
				return;
			}
			// 그 외의 모든 에러는 에러 페이지로 이동
			navigate("/error");
		}
	};

	return (
		<>
			<SEO
				title="부가 정보 입력 | Dutymate"
				description="원활한 서비스 이용을 위한 부가 정보를 알려주세요."
			/>
			<LandingTemplate showIntroText={false}>
				<div className="flex flex-col items-center">
					<p className="text-primary-dark font-semibold text-[1rem] mt-[0.9rem] mb-[1rem]">
						원활한 서비스 이용을 위한 부가 정보를 알려주세요.
					</p>
					<ExtraInfoForm initialData={formData} onSubmit={handleSubmit} />
				</div>
			</LandingTemplate>
		</>
	);
};

export default ExtraInfo;
