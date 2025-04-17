import { ReactNode } from "react";
import { Icon, IconName } from "./Icon";

interface TooltipProps {
	content: ReactNode;
	icon?: {
		name: string;
		size?: number;
		className?: string;
	};
	width?: string;
	className?: string;
}

export const Tooltip = ({
	content,
	icon = {
		name: "alert",
		size: 16,
		className: "text-gray-400 hover:text-gray-600 cursor-help",
	},
	width = "w-80",
	className = "",
}: TooltipProps) => {
	return (
		<div className={`relative group ${className}`}>
			<Icon
				name={icon.name as IconName}
				size={icon.size}
				className={icon.className}
			/>
			<div
				className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${width} bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}
			>
				<div className="absolute left-1/2 -translate-x-1/2 -top-2 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900" />
				{content}
			</div>
		</div>
	);
};
