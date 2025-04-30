import { Button } from "@/components/atoms/Button.tsx";

interface MypageExitConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	exitRequestType: "WARD" | "WITHDRAWAL" | null;
}

const MypageExitConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	exitRequestType,
}: MypageExitConfirmModalProps) => {
	if (!isOpen) {
		return null;
	}

	const getModalContent = (exitType: typeof exitRequestType) => {
		switch (exitType) {
			case "WARD":
				return {
					title: "병동을 나가요",
					message: "근무표에서 데이터가 삭제됩니다. 진행하시겠습니까?",
					cancelText: "취소",
					confirmText: "병동 나가기",
				};
			case "WITHDRAWAL":
				return {
					title: "회원 탈퇴를 해요",
					message: "회원 정보가 비활성화 됩니다. 진행하시겠습니까?",
					cancelText: "취소",
					confirmText: "탈퇴하기",
				};
			default:
				return {
					title: "",
					message: "",
					cancelText: "",
					confirmText: "",
				};
		}
	};

	const { title, message, cancelText, confirmText } =
		getModalContent(exitRequestType);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="bg-white rounded-2xl shadow-lg w-[90%] max-w-[22.5rem]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6">
					{/* 제목 */}
					<h2 className="text-[0.9375rem] font-medium text-left mb-2">
						{title}
					</h2>

					{/* 메시지 표시 */}
					<p className="text-left mb-6 text-[0.9375rem]">{message}</p>

					{/* 버튼 영역 */}
					<div className="flex gap-2">
						<Button
							size="md"
							color="muted"
							onClick={onClose}
							className="flex-1 bg-[#F1F1F1] hover:bg-[#E5E5E5] active:bg-[#DADADA] text-black font-normal rounded-xl py-3 transition-colors"
						>
							{cancelText}
						</Button>
						<Button
							size="md"
							color="primary"
							onClick={onConfirm}
							className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors"
						>
							{confirmText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MypageExitConfirmModal;
