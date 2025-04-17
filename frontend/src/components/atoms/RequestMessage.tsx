import { createPortal } from "react-dom";
import { useEffect, useState, useCallback } from "react";
import { throttle } from "lodash";
import { RefObject } from "react";

interface RequestMessageProps {
	message: string;
	targetRef: RefObject<HTMLDivElement>;
	isVisible: boolean;
}

function RequestMessage({
	message,
	targetRef,
	isVisible,
}: RequestMessageProps) {
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const updatePosition = useCallback(() => {
		if (!targetRef || !targetRef.current) return;

		const rect = targetRef.current.getBoundingClientRect();
		setPosition({
			top: rect.top - 10 + window.scrollY,
			left: rect.left + rect.width + 5,
		});
	}, [targetRef]);

	useEffect(() => {
		if (!isVisible) return;

		updatePosition();

		const throttledUpdate = throttle(updatePosition, 100);

		window.addEventListener("scroll", throttledUpdate);
		window.addEventListener("resize", throttledUpdate);

		return () => {
			window.removeEventListener("scroll", throttledUpdate);
			window.removeEventListener("resize", throttledUpdate);
			throttledUpdate.cancel();
		};
	}, [isVisible, updatePosition]);

	if (!isVisible) return null;

	return createPortal(
		<div
			className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
			style={{
				top: position.top,
				left: position.left,
				transform: "translateY(0%)",
				opacity: isVisible ? 1 : 0,
				visibility: isVisible ? "visible" : "hidden",
			}}
		>
			<div className="bg-white px-3 py-2 rounded-md shadow-lg">
				<p className="text-xs text-foreground whitespace-nowrap">
					{message ? `사유: ${message}` : "메시지가 없습니다."}
				</p>
				<div className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-white" />
			</div>
		</div>,
		document.body,
	);
}

export default RequestMessage;
