import React from "react";
import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "register";
type ButtonWidth = "short" | "long" | "fit" | "full";
type ButtonColor =
	| "primary"
	| "evening"
	| "night"
	| "day"
	| "mid"
	| "off"
	| "muted"
	| "secondary"
	| "tertiary"
	| "black";

/**
 * ButtonProps는 Button 컴포넌트의 props 타입을 정의합니다.
 */
interface ButtonProps {
	size?: ButtonSize;
	width?: ButtonWidth;
	color?: ButtonColor;
	children: React.ReactNode;
	onPress?: () => void;
	fullWidth?: boolean;
	disabled?: boolean;
	className?: string;
	style?: StyleProp<ViewStyle>;
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
	short: {
		xs: "w-[4.5rem]",
		sm: "w-full sm:w-[7rem]",
		md: "w-[4.6875rem] sm:w-[7.5rem]",
		lg: "w-[5rem] sm:w-[8rem]",
		xl: "w-full",
		register: "w-[7rem]",
	},
	long: {
		xs: "w-[12rem]",
		sm: "w-full sm:w-[20.625rem]",
		md: "w-[11.75rem] sm:w-[21.875rem]",
		lg: "w-[12.5rem] sm:w-[23.125rem]",
		xl: "w-full",
		register: "w-[7rem]",
	},

	fit: {
		xs: "w-fit",
		sm: "w-full sm:w-fit",
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
	mid: {
		active: "bg-duty-mid-bg text-duty-mid",
		hover: "hover:bg-duty-mid hover:text-white",
		pressed: "active:bg-duty-mid-dark active:text-white",
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
	black: {
		active: "bg-black text-white",
		hover: "hover:bg-black hover:text-white",
		pressed: "active:bg-black active:text-white",
	},
};

/**
 * Button 컴포넌트는 다양한 크기와 색상을 지원하는 버튼입니다.
 * @param size
 * @param width
 * @param color
 * @param children
 * @param onPress
 * @param fullWidth
 * @param disabled
 * @param className
 * @param style
 */
export const Button = React.forwardRef<View, ButtonProps>(
	(
		{
			size = "md",
			width = "fit",
			color = "primary",
			children,
			onPress,
			fullWidth,
			disabled,
			className = "",
			style,
		},
		ref,
	) => {
		const colorClass = disabled
			? "bg-base-muted text-white opacity-60"
			: `${colorStyles[color].active} ${colorStyles[color].hover} ${colorStyles[color].pressed}`;

		return (
			<TouchableOpacity
				ref={ref}
				onPress={onPress}
				disabled={disabled}
				className={`
                          ${sizeStyles[size]}
                          ${fullWidth ? "w-full" : widthStyles[width][size]}
                          ${colorClass}
                          font-semibold
                          shadow-xs
                          focus-visible:outline-2 
                          focus-visible:outline-offset-2
                          focus-visible:outline-indigo-600         
                          flex items-center justify-center
                          transition-colors
                          ${className || ""}
               `}
				style={style}
			>
				{children}
			</TouchableOpacity>
		);
	},
);
