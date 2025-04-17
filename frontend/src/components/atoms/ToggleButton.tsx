import React from "react";

interface ToggleButtonProps {
	options: Array<{
		text: string;
		icon?: string;
	}>;
	selectedIndex: number;
	onChange: (index: number) => void;
	variant?: "gender" | "nurse" | "request" | "default";
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
	options,
	selectedIndex,
	onChange,
	variant = "default",
}) => {
	const getButtonStyle = (isSelected: boolean) => {
		return isSelected
			? "bg-base-white border border-primary text-primary"
			: "bg-transparent border border-transparent text-base-foreground";
	};

	const getHoverStyle = (isSelected: boolean) => {
		return isSelected
			? "hover:text-primary-dark hover:border-primary-dark"
			: "hover:bg-base-muted";
	};

	const handleClick = (e: React.MouseEvent, index: number) => {
		e.preventDefault(); // Prevent form submission
		onChange(index);
	};

	return (
		<div className="flex bg-base-muted-30 rounded-lg p-1 w-full max-w-[25rem]">
			{options.map((option, index) => {
				const isSelected = selectedIndex === index;
				return (
					<button
						key={index}
						type="button" // Explicitly set button type
						className={[
							"flex-1",
							variant === "request" ? "p-3" : "p-3",
							"rounded-md",
							getButtonStyle(isSelected),
							"cursor-pointer",
							"transition-all",
							"duration-300",
							variant === "request" ? "text-base" : "text-base",
							"flex",
							"items-center",
							"justify-center",
							"gap-2",
							getHoverStyle(isSelected),
						].join(" ")}
						onClick={(e) => handleClick(e, index)}
					>
						{option.icon && (
							<span
								className={`${variant === "gender" ? "text-base" : "text-sm"}`}
							>
								{option.icon}
							</span>
						)}
						{option.text}
					</button>
				);
			})}
		</div>
	);
};

// 마이페이지용 작은 토글버튼 컴포넌트 추가
interface MypageToggleButtonProps {
	options: Array<{
		text: string;
		icon?: string;
	}>;
	selectedIndex: number;
	onChange: (index: number) => void;
}

export const MypageToggleButton: React.FC<MypageToggleButtonProps> = ({
	options,
	selectedIndex,
	onChange,
}) => {
	const getButtonStyle = (isSelected: boolean) => {
		return isSelected
			? "bg-base-white border border-primary text-primary"
			: "bg-transparent border border-transparent text-base-foreground";
	};

	const getHoverStyle = (isSelected: boolean) => {
		return isSelected
			? "hover:text-primary-dark hover:border-primary-dark"
			: "hover:bg-base-muted";
	};

	return (
		<div className="flex bg-base-muted-30 rounded-lg p-0.5 w-full max-w-[16rem]">
			{options.map((option, index) => {
				const isSelected = selectedIndex === index;
				return (
					<button
						key={index}
						type="button"
						className={[
							"flex-1",
							"py-1.5 px-2",
							"rounded-md",
							getButtonStyle(isSelected),
							"cursor-pointer",
							"transition-all",
							"duration-300",
							"text-sm",
							"flex",
							"items-center",
							"justify-center",
							"gap-1",
							getHoverStyle(isSelected),
						].join(" ")}
						onClick={() => onChange(index)}
					>
						{option.icon && <span className="text-sm">{option.icon}</span>}
						{option.text}
					</button>
				);
			})}
		</div>
	);
};

export default ToggleButton;
