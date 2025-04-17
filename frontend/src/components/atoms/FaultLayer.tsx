import { useEffect, useRef, useState, useCallback } from "react";
import ViolationMessage from "./ViolationMessage";

interface FaultLayerProps {
	startDate: number;
	endDate: number;
	messages: string[];
	children?: React.ReactNode;
	index?: number;
	total?: number;
	className?: string;
}

function FaultLayer({
	startDate,
	endDate,
	children,
	messages,
	index = 0,
	total = 1,
	className = "",
}: FaultLayerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const dotRef = useRef<HTMLDivElement>(null);
	const [cellWidth, setCellWidth] = useState(0);
	const [isHovered, setIsHovered] = useState(false);

	const updateWidth = useCallback(() => {
		if (!containerRef.current) return;

		const parentCell = containerRef.current.closest("td");
		if (!parentCell) return;

		const rect = parentCell.getBoundingClientRect();
		setCellWidth(rect.width);
	}, []);

	useEffect(() => {
		if (!containerRef.current) return;

		const parentCell = containerRef.current.closest("td");
		if (!parentCell) return;

		const observer = new ResizeObserver(updateWidth);
		observer.observe(parentCell);

		updateWidth();

		return () => observer.disconnect();
	}, [updateWidth]);

	// 실제 표시될 너비 계산
	const width = Math.max(cellWidth, (endDate - startDate + 1) * cellWidth);

	// // 메시지 위치 계산
	// const getMessagePosition = () => {
	// 	// 메시지 간 간격 (픽셀)
	// 	const MESSAGE_GAP = 30;

	// 	if (total === 1) return { top: "top-8" };

	// 	// 여러 메시지가 있을 경우 위아래로 배치
	// 	const isEven = index % 2 === 0;
	// 	const offset = Math.floor(index / 2) * MESSAGE_GAP;

	// 	if (isEven) {
	// 		return {
	// 			top: `top-[${32 + offset}px]`,
	// 			transform: "-translate-x-1/2",
	// 		};
	// 	} else {
	// 		return {
	// 			bottom: `bottom-[${32 + offset}px]`,
	// 			transform: "-translate-x-1/2",
	// 		};
	// 	}
	// };

	// const messagePosition = getMessagePosition();

	return (
		<div
			ref={containerRef}
			style={{
				width: `${width}px`,
				left: "0",
				position: "absolute",
				opacity: total > 1 ? 0.7 : 1, // 여러 개일 경우 약간 투명하게
			}}
			className={`absolute z-[2] h-8 rounded-lg border-2 border-red-500 bg-red-100/30 transition-opacity duration-200 ${className}`}
		>
			{/* 메시지 표시를 위한 점 */}
			<div
				ref={dotRef}
				className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-red-500 cursor-help transition-transform hover:scale-125"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* 점 안에 위반 개수 표시 */}
				<span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
					{messages.length}
				</span>
			</div>
			{children}
			<ViolationMessage
				messages={messages}
				targetRef={dotRef}
				index={index}
				total={total}
				isVisible={isHovered}
			/>
		</div>
	);
}

export default FaultLayer;
