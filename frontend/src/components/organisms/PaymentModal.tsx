import { useState } from "react";
import { IoMdClose } from "react-icons/io";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubscribe: (plan: "monthly" | "quarterly" | "yearly") => void;
}

const PaymentModal = ({ isOpen, onClose, onSubscribe }: PaymentModalProps) => {
	const [selectedPlan, setSelectedPlan] = useState<
		"monthly" | "quarterly" | "yearly"
	>("quarterly");

	if (!isOpen) return null;

	const plans = [
		{
			type: "monthly",
			title: "scale",
			price: "4,900",
			period: "WON",
			billingText: "Billed months",
			buttonText: "1개월 구독",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"커뮤니티 다크 모드 지원",
				"1개월 근무표 무한 자동 생성 가능",
			],
			background: "bg-gray-700",
			textColor: "text-white",
		},
		{
			type: "quarterly",
			title: "scale",
			price: "12,900",
			period: "WON",
			billingText: "Billed every 3 months",
			buttonText: "3개월 구독",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"커뮤니티 다크 모드 지원",
				"3개월 근무표 무한 자동 생성 가능",
			],
			background: "bg-white",
			textColor: "text-black",
			isPopular: true,
		},
		{
			type: "yearly",
			title: "scale",
			price: "50,000",
			period: "WON",
			billingText: "Billed annually",
			buttonText: "1년 구독",
			features: [
				"병동 단위 결제",
				"광고 제거 기능",
				"커뮤니티 다크 모드 지원",
				"1년 근무표 무한 자동 생성 가능",
			],
			background: "bg-gray-700",
			textColor: "text-white",
		},
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
			<div className="bg-white rounded-xl shadow-lg w-[90%] max-w-[900px] my-8 relative">
				{/* 닫기 버튼 */}
				<button
					onClick={onClose}
					className="absolute right-4 top-4 text-gray-600 hover:text-gray-800 z-10"
				>
					<IoMdClose size={24} />
				</button>

				{/* 헤더 */}
				<div className="p-6 text-center">
					<h2 className="text-2xl font-bold mb-2">자동 생성 구독하기</h2>
					<p className="text-gray-600">
						듀티메이트의 자동 생성 기능을 무제한으로 사용해보세요
					</p>
				</div>

				{/* 요금제 */}
				<div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
					{plans.map((plan) => (
						<div
							key={plan.type}
							className={`rounded-xl overflow-hidden shadow-lg ${plan.background} ${
								plan.textColor
							} transition-transform duration-300 ${
								selectedPlan === plan.type
									? "transform scale-105 border-2 border-primary"
									: ""
							} cursor-pointer`}
							onClick={() => setSelectedPlan(plan.type as any)}
						>
							{/* 카드 헤더 */}
							<div className="p-6">
								<div className="text-lg mb-2">{plan.title}</div>
								<div className="flex items-end">
									<span className="text-4xl font-bold">{plan.price}</span>
									<span className="ml-2 mb-1">{plan.period}</span>
								</div>
								<div className="text-sm opacity-70 mt-1">
									{plan.billingText}
								</div>
							</div>

							{/* 구독 버튼 */}
							<div className="px-6 mb-6">
								<button
									className={`w-full py-3 rounded-lg text-center font-medium ${
										plan.isPopular
											? "bg-[#F8A076] text-white hover:bg-[#F6926A]"
											: "bg-gray-500 text-white hover:bg-gray-600"
									}`}
									onClick={() => onSubscribe(plan.type as any)}
								>
									{plan.buttonText}
								</button>
							</div>

							{/* 기능 목록 */}
							<div className="px-6 pb-6">
								<ul className="space-y-4">
									{plan.features.map((feature, index) => (
										<li key={index} className="flex items-start">
											<svg
												className={`h-5 w-5 mr-2 text-[#F8A076]`}
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

				{/* 안내 문구 */}
				<div className="px-6 pb-6 text-center text-sm text-gray-500">
					구독은 선택한 기간동안 자동으로 갱신되며, 언제든지 해지할 수 있습니다.
				</div>
			</div>
		</div>
	);
};

export default PaymentModal;
