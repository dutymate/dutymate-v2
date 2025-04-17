import { createPortal } from "react-dom";
import { useEffect, useState, useCallback } from "react";
import { throttle } from "lodash";
import { RefObject } from "react";

interface ViolationMessageProps {
	messages: string[];
	targetRef: RefObject<HTMLDivElement>;
	index?: number;
	total?: number;
	isVisible: boolean;
}

function ViolationMessage({
	messages,
	targetRef,
	index = 0,
	// total = 1,
	isVisible,
}: ViolationMessageProps) {
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const updatePosition = useCallback(() => {
		if (!targetRef.current) return;

		const rect = targetRef.current.getBoundingClientRect();
		// const MESSAGE_GAP = 30;

		// // 여러 메시지가 있을 경우 위아래로 배치
		// const isEven = index % 2 === 0;
		// const offset = Math.floor(index / 2) * MESSAGE_GAP;

		setPosition({
			// 점의 왼쪽 위에 메시지 표시
			top: rect.top - 10 + window.scrollY,
			left: rect.left + rect.width + 5,
		});
	}, [targetRef, index]);

	useEffect(() => {
		if (!isVisible) return;

		// 초기 위치 설정
		updatePosition();

		// 스크롤과 리사이즈 이벤트 쓰로틀링
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
				transform: "translateY(0%dl)",
				opacity: isVisible ? 1 : 0,
				visibility: isVisible ? "visible" : "hidden",
			}}
		>
			<div className="bg-duty-evening-bg px-3 py-2 rounded-md shadow-lg">
				<ul className="space-y-1.5">
					{messages.map((message, idx) => (
						<li key={idx} className="text-xs text-red-600 whitespace-nowrap">
							• {message}
						</li>
					))}
				</ul>
				<div className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-white" />
			</div>
		</div>,
		document.body,
	);
}

export default ViolationMessage;
