import React from "react";

interface ApprovalBtnProps {
	onApprove: () => void;
	onReject: () => void;
	onHold: () => void;
	currentStatus: "ACCEPTED" | "DENIED" | "HOLD";
}

export const ApprovalBtn: React.FC<ApprovalBtnProps> = ({
	onApprove,
	onReject,
	onHold,
	currentStatus,
}) => {
	const getButtonStyle = (type: "approve" | "deny" | "hold") => {
		const isActive =
			(type === "approve" && currentStatus === "ACCEPTED") ||
			(type === "deny" && currentStatus === "DENIED") ||
			(type === "hold" && currentStatus === "HOLD");

		switch (type) {
			case "approve":
				return isActive
					? "bg-duty-day-dark text-white font-bold"
					: "bg-base-muted text-white hover:bg-duty-day-bg hover:text-duty-day";
			case "deny":
				return isActive
					? "bg-duty-evening-dark text-white font-bold"
					: "bg-base-muted text-white hover:bg-duty-evening-bg hover:text-duty-evening";
			case "hold":
				return isActive
					? "bg-duty-off-dark text-white font-bold"
					: "bg-base-muted text-white hover:bg-duty-off-bg hover:text-duty-off";
		}
	};

	return (
		<div className="inline-flex rounded-[9px] overflow-hidden">
			<button
				onClick={onApprove}
				disabled={currentStatus === "ACCEPTED"}
				className={`px-4 py-2 ${getButtonStyle("approve")} transition-colors disabled:opacity-100 disabled:cursor-not-allowed`}
			>
				승인
			</button>
			<button
				onClick={onHold}
				disabled={currentStatus === "HOLD"}
				className={`px-4 py-2 ${getButtonStyle("hold")} transition-colors disabled:opacity100 disabled:cursor-not-allowed`}
			>
				대기
			</button>
			<button
				onClick={onReject}
				disabled={currentStatus === "DENIED"}
				className={`px-4 py-2 ${getButtonStyle("deny")} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
			>
				거절
			</button>
		</div>
	);
};
