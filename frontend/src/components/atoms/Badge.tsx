// Badge.tsx

import React from "react";

interface BadgeProps {
	type: "HN" | "RN";
	className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, className }) => {
	const getStyles = () => {
		switch (type) {
			case "HN":
				return {
					bg: "bg-primary-bg",
					text: "text-primary-dark",
					label: "관리자",
				};
			case "RN":
				return {
					bg: "bg-base-muted-30",
					text: "text-base-foreground",
					label: "간호사",
				};
			default:
				return {
					bg: "bg-base-muted-30",
					text: "text-base-foreground",
					label: "간호사",
				};
		}
	};

	const styles = getStyles();

	return (
		<div
			className={`
        inline-flex items-center justify-center
        ${styles.bg} ${styles.text}
        px-3 py-1 rounded-lg
        text-sm font-medium
        ${className || ""}
      `}
		>
			{styles.label}
		</div>
	);
};
