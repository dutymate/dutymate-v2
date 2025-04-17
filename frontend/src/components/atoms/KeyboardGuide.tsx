import DutyBadgeEng from "./DutyBadgeEng";

const KeyboardGuide = () => {
	return (
		<div className="keyboard-guide flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg text-[11px] border border-gray-200 whitespace-nowrap">
			{/* 근무 타입 */}
			<div className="flex items-center gap-2">
				<span className="text-xs font-bold text-gray-500">입력 키</span>
				<div className="flex items-center gap-1">
					<DutyBadgeEng type="D" size="xs" />
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						D
					</kbd>
				</div>
				<div className="flex items-center gap-1">
					<DutyBadgeEng type="E" size="xs" />
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						E
					</kbd>
				</div>
				<div className="flex items-center gap-1">
					<DutyBadgeEng type="N" size="xs" />
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						N
					</kbd>
				</div>
				<div className="flex items-center gap-1">
					<DutyBadgeEng type="O" size="xs" />
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						O
					</kbd>
				</div>
			</div>

			<div className="h-5 w-[1px] bg-gray-200" />

			{/* 삭제 */}
			<div className="flex items-center gap-1">
				<span className="text-xs font-bold text-gray-500">삭제</span>
				<div className="flex gap-1">
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						X
					</kbd>
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						Delete
					</kbd>
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						Backspace
					</kbd>
				</div>
			</div>

			<div className="h-5 w-[1px] bg-gray-200" />

			{/* 이동 */}
			<div className="flex items-center gap-1">
				<span className="text-xs font-bold text-gray-500">이동</span>
				<div className="flex gap-0.5">
					<kbd className="px-1 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						← → ↑ ↓
					</kbd>
				</div>
			</div>
		</div>
	);
};

export default KeyboardGuide;
