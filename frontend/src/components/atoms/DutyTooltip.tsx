import React from "react";

interface DutyTooltipProps {
	children: React.ReactNode;
	message: string;
}

const DutyTooltip = ({ children, message }: DutyTooltipProps) => {
	return (
		<div className="group relative">
			{children}
			<div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
				{message}
				<div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 border-8 border-transparent border-b-gray-800" />
			</div>
		</div>
	);
};

export default DutyTooltip;
