// SubscriptionSuccessModal.tsx
import { useState, useEffect } from "react";
import { Button } from "../atoms/Button";
import Confetti from "react-confetti";
import { FaRocket } from "react-icons/fa";

interface SubscriptionSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	plan: string;
	autoGenCnt: number;
}

const SubscriptionSuccessModal = ({
	isOpen,
	onConfirm,
	autoGenCnt,
}: SubscriptionSuccessModalProps) => {
	const [windowSize, setWindowSize] = useState({
		width: typeof window !== "undefined" ? window.innerWidth : 0,
		height: typeof window !== "undefined" ? window.innerHeight : 0,
	});

	// 컨페티 효과를 위한 창 크기 감지
	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		if (typeof window !== "undefined") {
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
		}
	}, []);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			{/* 컨페티 효과 */}
			<Confetti
				width={windowSize.width}
				height={windowSize.height}
				recycle={false}
				numberOfPieces={500}
				gravity={0.15}
				colors={["#F5A281", "#61A86A", "#F68585", "#7454DF", "#68A6FC"]}
			/>

			<div className="bg-base-white rounded-2xl shadow-2xl w-[90%] max-w-[30rem] transform transition-all duration-300 animate-bounce-small relative overflow-hidden">
				<div className="p-8 text-center">
					{/* 제목 */}
					<h2 className="text-2xl font-bold mb-2 mt-4 text-base-foreground">
						🎉 깜짝 선물이 도착했습니다! 🎉
					</h2>

					{/* 서브타이틀 */}
					<p className="text-base-foreground/80 mb-6">
						듀티메이트의 얼리버드 구독자가 되신 것을 축하합니다!
					</p>

					{/* 메시지 표시 */}
					<div className="bg-primary-10 rounded-xl p-6 mb-6">
						<p className="text-lg text-base-foreground mb-2">자동 생성 기능</p>
						<p className="text-4xl font-bold text-primary-dark mb-2">
							{autoGenCnt}회 무료
						</p>
						<p className="text-lg text-base-foreground">
							충전이 완료되었습니다!
						</p>
					</div>

					{/* 설명 */}
					<p className="text-md text-base-foreground/70 mb-8">
						얼리버드 구독자님께 드리는 특별한 선물입니다.
						<br />
						지금 바로 자동 생성을 시작해보세요!
					</p>

					{/* 버튼 영역 */}
					<Button
						size="lg"
						color="primary"
						onClick={onConfirm}
						className="w-full py-3 flex items-center justify-center gap-2 rounded-xl transition-transform"
					>
						<FaRocket className="text-lg" />
						<span className="font-bold">지금 바로 시작하기</span>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionSuccessModal;
