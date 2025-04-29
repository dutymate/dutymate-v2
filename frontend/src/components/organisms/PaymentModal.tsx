import { useState } from "react";
import SubscriptionSuccessModal from "./SubscriptionSuccessModal";
import { IoMdClose } from "react-icons/io";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubscribe: (plan: "monthly" | "quarterly" | "yearly") => void;
}

const PaymentModal = ({ isOpen, onClose, onSubscribe }: PaymentModalProps) => {
	const [selectedPlan, setSelectedPlan] = useState<
		"monthly" | "quarterly" | "yearly" | null
	>(null);
	const [autoGenCnt] = useState(100); // 기본값 설정

	if (!isOpen) return null;

	const handleSubscribe = (planType: "monthly" | "quarterly" | "yearly") => {
		setSelectedPlan(planType);
		onSubscribe(planType);
	};

	const handleCompleteModalClose = () => {
		setSelectedPlan(null);
		onClose();
	};

	const handleConfirm = () => {
		if (selectedPlan) {
			handleCompleteModalClose();
		}
	};

	const plans = [
		{
			type: "monthly",
			title: "scale",
			price: "4,900",
			period: "WON",
			billingText: "Billed months",
			buttonText: "1개월 구독 예약",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"1개월 근무표 무한 자동 생성 가능",
			],
		},
		{
			type: "quarterly",
			title: "scale",
			price: "12,900",
			period: "WON",
			billingText: "Billed every 3 months",
			buttonText: "3개월 구독 예약",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"3개월 근무표 무한 자동 생성 가능",
			],
		},
		{
			type: "yearly",
			title: "scale",
			price: "50,000",
			period: "WON",
			billingText: "Billed annually",
			buttonText: "1년 구독 예약",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"1년 근무표 무한 자동 생성 가능",
			],
		},
	];

	return (
		<>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8"
				onClick={undefined} // ✨ 오버레이 클릭 막기
			>
				<div
					className="relative bg-[#f4f4f4] rounded-[1.25rem] shadow-lg p-6 w-[90%] max-w-[60rem] min-h-[33rem]"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex justify-between items-center mb-6">
						<button
							onClick={onClose}
							id="close-payment-modal-button"
							className="absolute top-6 right-6 text-black hover:text-gray-600"
							style={{ fontSize: "1.75rem" }}
						>
							X
						</button>
					</div>

					<div className="flex flex-col items-center justify-center text-center mb-8">
						<div className="text-xl font-semibold text-black mb-2 ">
							얼리버드 혜택
						</div>
						<div className="text-center text-lg text-black mb-8">
							초기 구독자에게 근무표 자동 생성 기능을
							<span className="text-primary font-bold "> 추가 1개월 무료</span>
							로 지원합니다.
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{plans.map((plan) => (
							<div
								key={plan.type}
								className={`group rounded-[1.25rem] shadow-lg transform transition-all duration-300 cursor-pointer
							

									 bg-[#4A4A4A] text-white border-2 border-transparent hover:bg-white hover:text-black hover:border-4 hover:border-gray-200
									`}
								onClick={() =>
									handleSubscribe(
										plan.type as "monthly" | "quarterly" | "yearly",
									)
								}
							>
								<div className="p-6">
									<div className="text-sm mb-2">{plan.title}</div>
									<div className="flex items-end gap-1 mb-1">
										<span className="text-[2rem] font-bold leading-none">
											{plan.price}
										</span>
										<span className="text-sm mb-1">{plan.period}</span>
									</div>
									<div className="text-xs opacity-70">{plan.billingText}</div>
								</div>

								<div className="px-6 mb-6">
									<button className="w-full py-2 rounded-lg text-center text-sm bg-[#666666] text-white hover:bg-primary hover:text-white">
										{plan.buttonText}
									</button>
								</div>

								<div className="px-6 pb-4">
									<ul className="space-y-0">
										{plan.features.map((feature, index) => (
											<li
												key={index}
												className="flex items-start gap-2 py-2 border-b border-gray-600 group-hover:border-gray-200"
											>
												<svg
													className="h-4 w-4 mt-0.5 shrink-0 text-primary"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M5 13l4 4L19 7"
													/>
												</svg>
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* 성공 모달 */}
			<SubscriptionSuccessModal
				isOpen={selectedPlan !== null}
				onClose={handleCompleteModalClose}
				onConfirm={handleConfirm}
				plan={selectedPlan || "monthly"}
				autoGenCnt={autoGenCnt}
			/>
		</>
	);
};

export default PaymentModal;
