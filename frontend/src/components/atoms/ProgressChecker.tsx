// ProgressChecker.tsx

import React from "react";

interface ProgressCheckerProps {
	value: number;
	size?: number;
	strokeWidth?: number;
	backgroundColor?: string;
	progressColor?: string;
	showLabel?: boolean;
}

export const ProgressChecker: React.FC<ProgressCheckerProps> = ({
	value,
	size = 120,
	strokeWidth = 8,
	showLabel = true,
}) => {
	// 0-100 사이의 값으로 제한
	const normalizedValue = Math.min(100, Math.max(0, value));

	// SVG 원의 중심점과 반지름 계산
	const center = size / 2;
	const radius = (size - strokeWidth) / 2;

	// SVG 원의 둘레 계산
	const circumference = 2 * Math.PI * radius;

	// 진행도에 따른 stroke-dashoffset 계산
	const offset = circumference - (normalizedValue / 100) * circumference;

	return (
		<div className="relative inline-flex items-center justify-center">
			<svg className="transform -rotate-90" width={size} height={size}>
				{/* 배경 원 */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					className="stroke-base-muted-30"
					strokeWidth={strokeWidth}
					fill="none"
				/>
				{/* 진행도를 나타내는 원 */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					className="stroke-primary"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					fill="none"
					style={{
						transition: "stroke-dashoffset 0.3s ease-in-out",
					}}
				/>
			</svg>
			{showLabel && (
				<div className="absolute flex flex-col items-center justify-center">
					<span className="text-base font-bold text-base-foreground">
						{Math.round(normalizedValue)}%
					</span>
					<span className="text-xs text-base-foreground">완성도</span>
				</div>
			)}
		</div>
	);
};
