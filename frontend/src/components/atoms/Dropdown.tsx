import React, { useState, useRef, useEffect } from "react";
import { Icon, IconName } from "./Icon";

interface DropdownProps {
	variant: keyof typeof OPTIONS;
	value: string | number | null;
	onChange: (value: any) => void;
	label: string;
	disabled?: boolean;
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const OPTIONS = {
	number: [1, 2, 3, 4, 5],
	priority: ["상", "중", "하"],
	authority: ["병동 내보내기", "권한 넘기기"],
	skill: ["상급", "중급", "초급"],
};

const ICONS = {
	skill: {
		상급: "high" as IconName,
		중급: "mid" as IconName,
		초급: "low" as IconName,
	},
};

export const Dropdown: React.FC<DropdownProps> = ({
	variant,
	value,
	onChange,
	label,
	disabled = false,
	position = "bottom-left",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const options = OPTIONS[variant];

	const getDisplayValue = () => {
		if (!value) return label;
		if (variant === "number") return value;
		return value;
	};

	const getDropdownStyle = () => {
		switch (variant) {
			case "number":
				return "inline-block bg-base-white rounded-[9px] border border-base-muted";
			case "priority":
			case "skill":
				return "inline-block bg-base-white rounded-[9px] border border-base-muted";
			case "authority":
				return "inline-block bg-base-white rounded-[9px]";
			default:
				return "";
		}
	};

	const getButtonStyle = () => {
		if (variant === "authority") {
			return `
        px-3 py-2
        bg-base-white
        flex items-center justify-between
        min-h-[44px]
      `;
		}
		return `
      px-4 py-2
      ${
				disabled
					? "text-base-muted cursor-not-allowed"
					: "text-base-foreground hover:border-primary-dark cursor-pointer"
			}
      flex items-center justify-between
      min-h-[44px]
    `;
	};

	const getOptionsPosition = () => {
		switch (position) {
			case "top-left":
				return "bottom-full right-0 mb-1";
			case "top-right":
				return "bottom-full left-0 mb-1";
			case "bottom-left":
				return "top-full right-0 mt-1";
			case "bottom-right":
				return "top-full left-0 mt-1";
			default:
				return "bottom-full right-0 mt-1";
		}
	};

	return (
		<div className={`relative ${getDropdownStyle()}`} ref={dropdownRef}>
			<button
				type="button"
				className={getButtonStyle()}
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
			>
				<div className="flex items-center gap-2">
					{variant === "skill" &&
						value &&
						ICONS.skill[value as keyof typeof ICONS.skill] && (
							<Icon
								name={ICONS.skill[value as keyof typeof ICONS.skill]}
								size={16}
								className="text-primary"
							/>
						)}
					{variant === "authority" ? (
						<Icon name="dots" size={20} className="text-primary" />
					) : (
						<span
							className={`text-base ${variant === "number" && value ? "font-bold" : ""} ${!value ? "text-base-muted" : ""}`}
						>
							{getDisplayValue()}
						</span>
					)}
				</div>
				{variant !== "authority" && (
					<Icon
						name={isOpen ? "left" : "right"}
						size={16}
						className={`${disabled ? "text-base-muted" : "text-primary"} transform rotate-90 ${isOpen ? "rotate-[270deg]" : "rotate-90"} ml-2`}
					/>
				)}
			</button>

			{isOpen && !disabled && (
				<div
					className={`absolute ${getOptionsPosition()} z-50 w-32 py-1 bg-white border rounded-md shadow-lg`}
				>
					<ul className={variant === "authority" ? "py-2" : "py-3"}>
						{options.map((option) => (
							<li key={option}>
								<button
									type="button"
									className={`
                    w-full px-4 py-2 text-base text-left whitespace-nowrap
                    flex items-center gap-2
                    ${
											value === option
												? variant === "authority"
													? "bg-base-muted-30"
													: "text-primary font-medium"
												: "text-base-foreground hover:bg-base-muted-30"
										}
                  `}
									onClick={() => {
										onChange(option);
										setIsOpen(false);
									}}
								>
									{variant === "skill" &&
										ICONS.skill[option as keyof typeof ICONS.skill] && (
											<Icon
												name={ICONS.skill[option as keyof typeof ICONS.skill]}
												size={16}
												className={
													value === option
														? "text-primary"
														: "text-base-foreground"
												}
											/>
										)}
									{option}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};
