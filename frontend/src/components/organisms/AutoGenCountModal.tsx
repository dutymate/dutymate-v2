import { Button } from "../atoms/Button";

interface AutoGenCountModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	autoGenCnt: number;
	onOpenPayment: () => void; // 결제 모달 열기 함수 추가
}

const AutoGenCountModal = ({
	isOpen,
	onClose,
	onConfirm,
	autoGenCnt,
	onOpenPayment,
}: AutoGenCountModalProps) => {
	// 자동 생성 횟수가 0 이하일 때는 모달을 표시하지 않고 바로 결제창으로 이동
	if (isOpen && autoGenCnt <= 0) {
		onClose();
		onOpenPayment();
		return null;
	}

	if (!isOpen) {
		return null;
	}

	// 자동 생성 횟수에 따라 타이틀과 메시지 변경
	const title =
		autoGenCnt > 0
			? "자동 생성 사용 가능 횟수가 1회 차감돼요"
			: "자동 생성 사용 가능 횟수가 부족해요";

	// 버튼 텍스트와 동작 결정
	const buttonText = autoGenCnt > 0 ? "생성하기" : "구독하기";

	// 이 함수가 문제가 있습니다. 수정합니다.
	const handleButtonClick = () => {
		if (autoGenCnt <= 0) {
			// 횟수가 0 이하인 경우 결제 모달 열기
			onClose();
			onOpenPayment();
		} else {
			// 횟수가 있는 경우 자동 생성 실행
			onClose();
			onConfirm();
		}
	};

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
					<p className="text-left mb-6 text-[0.9375rem]">
						사용 가능 횟수가{" "}
						<span className="text-primary font-medium">{autoGenCnt}회</span>{" "}
						남았어요.
					</p>

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
							onClick={handleButtonClick} // 이 함수가 제대로 동작해야 함
							className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors"
						>
							{buttonText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AutoGenCountModal;
