import React from "react";
import { IoIosAddCircleOutline } from "react-icons/io";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "register";
type ButtonWidth = "short" | "long" | "fit" | "full";
type ButtonColor =
	| "primary"
	| "evening"
	| "night"
	| "day"
	| "off"
	| "muted"
	| "secondary"
	| "tertiary";

interface ButtonProps {
	size?: ButtonSize;
	width?: ButtonWidth;
	color?: ButtonColor;
	children: React.ReactNode;
	onClick?: () => void;
	fullWidth?: boolean;
	disabled?: boolean;
	className?: string;
	type?: "button" | "submit" | "reset";
}

const sizeStyles: Record<ButtonSize, string> = {
	xs: `h-[1.5rem] sm:h-[2rem] rounded-[0.25rem] px-[0.5rem] py-[0.125rem] text-[0.75rem] sm:text-sm`,
	sm: `h-[1.75rem] sm:h-[1.9rem] rounded-[0.375rem] px-[0.625rem] py-[0.25rem] text-sm sm:text-base`,
	md: `h-[2rem] sm:h-[3rem] rounded-[0.5rem] px-[0.75rem] py-[0.375rem] text-base sm:text-lg`,
	lg: `h-[2.5rem] sm:h-[3.5rem] rounded-[0.625rem] px-[0.875rem] py-[0.5rem] text-lg sm:text-xl`,
	xl: `h-[3rem] sm:h-[4rem] rounded-[0.75rem] px-[1rem] py-[0.625rem] text-xl sm:text-2xl`,
	register: `h-[2.25rem] rounded-lg px-[2rem] min-w-[8rem] text-md`,
};

const widthStyles: Record<ButtonWidth, Record<ButtonSize, string>> = {
	// Short 버튼: sm 사이즈 기준으로 xs는 조금 작게, md는 조금 크게
	short: {
		xs: "w-[4.5rem]",
		sm: "w-full sm:w-[7rem]", // 모바일에서는 full, 데스크톱에서는 7rem
		md: "w-[4.6875rem] sm:w-[7.5rem]",
		lg: "w-[5rem] sm:w-[8rem]",
		xl: "w-full",
		register: "w-[7rem]",
	},
	// Long 버튼: sm 사이즈 기준으로 xs는 조금 작게, md는 조금 크게
	long: {
		xs: "w-[12rem]",
		sm: "w-full sm:w-[20.625rem]", // 모바일에서는 full, 데스크톱에서는 20.625rem
		md: "w-[11.75rem] sm:w-[21.875rem]",
		lg: "w-[12.5rem] sm:w-[23.125rem]",
		xl: "w-full",
		register: "w-[7rem]",
	},

	fit: {
		xs: "w-fit",
		sm: "w-full sm:w-fit", // 모바일에서는 full, 데스크톱에서는 fit
		md: "w-fit",
		lg: "w-fit",
		xl: "w-full",
		register: "w-fit",
	},

	full: {
		xs: "w-full",
		sm: "w-full",
		md: "w-full",
		lg: "w-full",
		xl: "w-full",
		register: "w-full",
	},
};

const colorStyles: Record<
	ButtonColor,
	{ active: string; hover: string; pressed: string }
> = {
	primary: {
		active: "bg-primary-bg text-primary",
		hover: "hover:bg-primary hover:text-white",
		pressed: "active:bg-primary-dark active:text-white",
	},
	evening: {
		active: "bg-duty-evening-bg text-duty-evening",
		hover: "hover:bg-duty-evening hover:text-white",
		pressed: "active:bg-duty-evening-dark active:text-white",
	},
	night: {
		active: "bg-duty-night-bg text-duty-night",
		hover: "hover:bg-duty-night hover:text-white",
		pressed: "active:bg-duty-night-dark active:text-white",
	},
	day: {
		active: "bg-duty-day-bg text-duty-day",
		hover: "hover:bg-duty-day hover:text-white",
		pressed: "active:bg-duty-day-dark active:text-white",
	},
	off: {
		active: "bg-duty-off-bg text-duty-off",
		hover: "hover:bg-duty-off hover:text-white",
		pressed: "active:bg-duty-off-dark active:text-white",
	},
	muted: {
		active: "bg-base-muted-30 text-base-muted",
		hover: "hover:bg-base-muted hover:text-white",
		pressed: "active:bg-base-foreground active:text-white",
	},
	secondary: {
		active: "bg-secondary-bg text-secondary",
		hover: "hover:bg-secondary hover:text-white",
		pressed: "active:bg-secondary-dark active:text-white",
	},
	tertiary: {
		active: "bg-tertiary-bg text-tertiary",
		hover: "hover:bg-tertiary hover:text-white",
		pressed: "active:bg-tertiary-dark active:text-white",
	},
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			size = "md",
			width = "fit",
			color = "primary",
			children,
			onClick,
			fullWidth,
			disabled,
			className,
			type = "button",
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				type={type}
				onClick={onClick}
				disabled={disabled}
				className={`
        ${sizeStyles[size]} 
        ${fullWidth ? "w-full" : widthStyles[width][size]}
        ${
					disabled
						? "bg-base-muted text-white cursor-not-allowed"
						: `${colorStyles[color].active} ${colorStyles[color].hover} ${colorStyles[color].pressed}`
				}
        font-semibold 
        shadow-xs 
        focus-visible:outline-2 
        focus-visible:outline-offset-2 
        focus-visible:outline-indigo-600
        flex items-center justify-center
        transition-colors
        ${className || ""}
      `}
			>
				{children}
			</button>
		);
	},
);

// 임시 간호사 추가 버튼
interface TempNurseButtonProps {
	onClick?: () => void;
	className?: string;
}

export const TempNurseButton = ({
	onClick,
	className,
}: TempNurseButtonProps) => {
	return (
		<button
			onClick={onClick}
			className={`flex items-center justify-center gap-1.5 py-1 w-[100px] rounded-lg border transition-colors bg-[#999786] hover:bg-[#88866f] ${className}`}
		>
			<IoIosAddCircleOutline className="text-white text-[0.95rem]" />
			<span className="text-[0.8rem] text-white">임시 간호사</span>
		</button>
	);
};

// 연동하지 않고 추가하기 버튼
export const ConnectButton = ({
	onClick,
	className,
}: {
	onClick: () => void;
	className?: string;
}) => {
	return (
		<button
			onClick={onClick}
			className={`w-[90vw] max-w-[400px] h-[44px] bg-primary-20 hover:bg-primary text-primary hover:text-white transition-colors whitespace-nowrap rounded-lg ${className}`}
		>
			연동하지 않고 추가하기
		</button>
	);
};

//
export const EnterWardLogoutButton = ({
	onClick,
	className,
}: {
	onClick: () => void;
	className?: string;
}) => {
	return (
		<button
			onClick={onClick}
			className={`w-full lg:w-[9rem] px-[0.75rem] py-[0.5rem] bg-primary-20 text-primary hover:text-white transition-colors rounded-[0.25rem] hover:bg-primary text-[0.75rem] lg:text-[0.875rem] h-[2.1875rem] ml-[0.75rem] ${className}`}
		>
			로그인으로 돌아가기
		</button>
	);
};

// 커뮤니티 전용 버튼
export const CommunityWriteButton = ({
	onClick,
	className,
}: { onClick?: () => void; className?: string }) => {
	return (
		<button
			onClick={onClick}
			className={`px-6 py-2 min-w-[7rem] bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm ${className || ""}`}
		>
			글쓰기
		</button>
	);
};

export const CommunityRegisterButton = ({
	onClick,
	className,
	disabled,
}: {
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
}) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`px-8 py-2.5 min-w-[8rem] ${
				disabled
					? "bg-gray-300 cursor-not-allowed"
					: "bg-primary hover:bg-primary-dark"
			} text-white rounded-lg transition-colors text-sm ${className || ""}`}
		>
			등록
		</button>
	);
};

export type { ButtonProps, ButtonSize, ButtonWidth, ButtonColor };
