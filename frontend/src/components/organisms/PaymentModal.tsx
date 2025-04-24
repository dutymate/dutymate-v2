import { useState } from "react";
import SubscriptionSuccessModal from "./SubscriptionSuccessModal";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubscribe: (plan: "monthly" | "quarterly" | "yearly") => void;
}

const PaymentModal = ({ isOpen, onClose, onSubscribe }: PaymentModalProps) => {
	const [hoveredPlan, setHoveredPlan] = useState<string | null>("quarterly");
	const [selectedPlan, setSelectedPlan] = useState<
		"monthly" | "quarterly" | "yearly" | null
	>(null);
	const [autoGenCnt] = useState(100); // 기본값 설정

	if (!isOpen) return null;

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleMouseLeave = (planType: string) => {
		setHoveredPlan(planType === "quarterly" ? "quarterly" : null);
	};

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
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8"
				onClick={handleOverlayClick}
			>
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-6 w-[90%] max-w-[900px]"
					onClick={(e) => e.stopPropagation()}
				>
					{plans.map((plan) => (
						<div
							key={plan.type}
							className={`rounded-[20px] shadow-lg transform transition-all duration-300 cursor-pointer
								${
									hoveredPlan === plan.type
										? "bg-white text-black scale-105"
										: "bg-[#4A4A4A] text-white"
								}`}
							onMouseEnter={() => setHoveredPlan(plan.type)}
							onMouseLeave={() => handleMouseLeave(plan.type)}
							onClick={() =>
								handleSubscribe(plan.type as "monthly" | "quarterly" | "yearly")
							}
						>
							{/* 카드 헤더 */}
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

							{/* 구독 버튼 */}
							<div className="px-6 mb-6">
								<button
									className={`w-full py-2 rounded-lg text-center text-sm ${
										hoveredPlan === plan.type
											? "bg-primary text-white hover:bg-primary-dark"
											: "bg-[#666666] text-white hover:bg-[#555555]"
									}`}
								>
									{plan.buttonText}
								</button>
							</div>

							{/* 기능 목록 */}
							<div className="px-6 pb-4">
								<ul className="space-y-0">
									{plan.features.map((feature, index) => (
										<li
											key={index}
											className={`flex items-start gap-2 py-2 border-b ${
												hoveredPlan === plan.type
													? "border-gray-200"
													: "border-gray-600"
											}`}
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
