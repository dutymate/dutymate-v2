// SubscriptionSuccessModal.tsx
import { Button } from "../atoms/Button";

interface SubscriptionSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	plan: string;
	autoGenCnt: number;
}

const SubscriptionSuccessModal = ({
	isOpen,
	onClose,
	onConfirm,
	autoGenCnt,
}: SubscriptionSuccessModalProps) => {
	if (!isOpen) return null;

	// 구독 기간에 따른 표시 텍스트
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
				className="bg-white rounded-xl shadow-lg w-[90%] max-w-[22.5rem]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-[1.5rem]">
					{/* 제목 */}
					<h2 className="text-lg font-bold text-left mb-[1rem]">
						현재 결제가 지원되지 않습니다.
					</h2>

					{/* 메시지 표시 */}
					<p className="text-left mb-[2rem] text-gray-700">
						<span className="text-primary font-bold">{autoGenCnt}</span> 회
						무료로 충전되었습니다.
						<br />
						<br />
						지금 바로 자동 생성을 시작해보세요!
					</p>

					{/* 버튼 영역 */}
					<div className="flex gap-[0.5rem] justify-center">
						<Button
							size="md"
							color="muted"
							onClick={onClose}
							className="flex-1"
						>
							취소
						</Button>
						<Button
							size="md"
							color="primary"
							onClick={onConfirm}
							className="flex-1"
						>
							자동 생성하기
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionSuccessModal;
