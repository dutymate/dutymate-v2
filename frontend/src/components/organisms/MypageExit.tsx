import { ApiErrorResponse, profileService } from "@/services/profileService";
import useUserAuthStore from "@/store/userAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MypageExitConfirmModal from "@/components/organisms/MypageExitConfirmModal.tsx";
import { useState } from "react";

const MypageExit = () => {
	const navigate = useNavigate();
	const [isMypageExitConfirmModalOpen, setMypageExitConfirmModalOpen] =
		useState(false);
	const [exitRequestType, setExitRequestType] = useState<
		"WARD" | "WITHDRAWAL" | null
	>(null);

	const handleExitButton = () => {
		profileService.exitWard(
			() => {
				navigate("/extra-info");
			},
			(error: ApiErrorResponse) => {
				toast.error(error.message);
			},
		);
	};

	const handleWithdrawal = () => {
		profileService.withdrawlMember(
			() => {
				navigate("/login");
			},
			(error: ApiErrorResponse) => {
				toast.error(error.message);
			},
		);
	};

	const isDemo = useUserAuthStore((state) => state.userInfo?.isDemo);

	return (
		<>
			{!isDemo && (
				<div className="flex flex-row justify-center items-center gap-0.5rem">
					<button
						onClick={() => {
							setExitRequestType("WARD");
							setMypageExitConfirmModalOpen(true);
						}}
						className="w-full lg:w-[11.25rem] px-[0.75rem] py-[0.5rem] bg-white text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 text-xs lg:text-sm h-[2.5rem]"
					>
						병동 나가기
					</button>
					<button
						onClick={() => {
							setExitRequestType("WITHDRAWAL");
							setMypageExitConfirmModalOpen(true);
						}}
						className="w-full lg:w-[11.25rem] px-[0.75rem] py-[0.5rem] bg-white text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 text-xs lg:text-sm h-[2.5rem]"
					>
						회원 탈퇴하기
					</button>
				</div>
			)}

			<MypageExitConfirmModal
				isOpen={isMypageExitConfirmModalOpen}
				onClose={() => setMypageExitConfirmModalOpen(false)}
				onConfirm={
					exitRequestType === "WARD" ? handleExitButton : handleWithdrawal
				}
				exitRequestType={exitRequestType}
			/>
		</>
	);
};

export default MypageExit;
