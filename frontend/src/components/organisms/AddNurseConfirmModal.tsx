import { Button } from "@/components/atoms/Button.tsx";

interface AddNurseConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isConnect: boolean;
	message: string;
}

const AddNurseConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	isConnect,
	message,
}: AddNurseConfirmModalProps) => {
	if (!isOpen) {
		return null;
	}

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
						새로운 간호사를 추가해요
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
							취소
						</Button>
						<Button
							size="md"
							color="primary"
							onClick={onConfirm}
							className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors"
						>
							{isConnect ? "연동하기" : "추가하기"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddNurseConfirmModal;
