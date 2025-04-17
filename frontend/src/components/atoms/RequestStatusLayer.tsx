import { useEffect, useRef, useState, useCallback } from "react";
import RequestMessage from "./RequestMessage";

interface RequestStatusLayerProps {
	date: number;
	status: "ACCEPTED" | "HOLD" | "DENIED";
	message: string;
	className?: string;
}

function RequestStatusLayer({
	// date,
	status,
	message,
	className = "",
}: RequestStatusLayerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
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

	const getStatusColor = () => {
		switch (status) {
			case "ACCEPTED":
				return "bg-green-100/30 border-green-500";
			case "HOLD":
				return "bg-yellow-100/30 border-yellow-500";
			default:
				return "";
		}
	};

	const getCircleColor = () => {
		switch (status) {
			case "ACCEPTED":
				return "bg-green-500";
			case "HOLD":
				return "bg-yellow-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div
			ref={containerRef}
			style={{
				width: `${cellWidth}px`,
				left: "0",
				position: "absolute",
				opacity: 1,
			}}
			className={`absolute z-[1] h-8 rounded-lg border-2 ${getStatusColor()} transition-opacity duration-200 ${className}`}
		>
			<div
				className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getCircleColor()} cursor-help transition-transform hover:scale-125`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
					i
				</span>
			</div>
			{isHovered && (
				<RequestMessage
					message={message}
					targetRef={containerRef}
					isVisible={isHovered}
				/>
			)}
		</div>
	);
}

export default RequestStatusLayer;
