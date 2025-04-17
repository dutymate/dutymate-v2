// HistoryList.tsx

import { Icon } from "../atoms/Icon";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import useShiftStore from "../../store/shiftStore";
import type { DutyHistory } from "../../services/dutyService";
import { useCallback, useMemo, useState } from "react";

const HistoryList = () => {
	const histories = useShiftStore((state) => state.dutyInfo?.histories || []);
	const fetchDutyInfo = useShiftStore((state) => state.fetchDutyInfo);
	const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(
		null,
	);

	// 최신 수정 기록이 위에 오도록 정렬
	const sortedHistories = useMemo(
		() => [...histories].sort((a, b) => b.idx - a.idx),
		[histories],
	);

	const handleRevert = useCallback(
		async (historyIdx: number) => {
			setSelectedHistoryIdx(historyIdx);
			await fetchDutyInfo(undefined, undefined, historyIdx);
		},
		[fetchDutyInfo],
	);

	const renderChangeIndicator = (item: DutyHistory) => {
		if (item.isAutoCreated) {
			return (
				<div className="flex items-center gap-2 bg-duty-day-bg px-2 py-1 rounded-md">
					<div className="flex items-center gap-1">
						<Icon name="schedule" size={14} className="text-duty-day" />
						<span className="text-sm text-duty-day">자동 생성됨</span>
					</div>
				</div>
			);
		}

		return (
			<div className="flex items-center gap-2">
				<DutyBadgeEng
					type={item.before as "D" | "E" | "N" | "O" | "X"}
					size="xs"
					variant="filled"
				/>
				<Icon name="right" size={12} className="text-gray-400" />
				<DutyBadgeEng
					type={item.after as "D" | "E" | "N" | "O" | "X"}
					size="xs"
					variant="filled"
				/>
			</div>
		);
	};

	return (
		<div className="flex flex-1 bg-white rounded-xl p-[1.25rem] shadow-lg relative overflow-hidden">
			{/* 헤더 고정 */}
			<div className="hidden sm:flex items-top justify-center pr-[1rem] sticky top-0 bg-white z-10">
				<Icon name="history" size={24} className="text-gray-600" />
			</div>

			{/* 스크롤 영역 */}
			<div className="relative h-[18.75rem] flex-1 w-full min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
				{sortedHistories.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						수정 기록이 없습니다.
					</div>
				) : (
					<div className="space-y-0">
						{sortedHistories.map((item) => (
							<div
								key={item.idx}
								className={`flex items-center w-full gap-[0.75rem] px-0 py-[0.25rem] hover:bg-gray-50 ${
									item.idx === selectedHistoryIdx ? "bg-gray-100" : ""
								}`}
							>
								<div className="flex items-center gap-[0.75rem] flex-1 min-w-0">
									<span
										className={`w-[4.3rem] px-[0.375rem] py-[0.1875rem] rounded-md ${
											item.isAutoCreated ? "bg-duty-off-bg" : "bg-duty-off-bg"
										}`}
									>
										<span className="font-medium text-sm text-center truncate whitespace-nowrap block">
											{item.isAutoCreated ? "근무표" : item.name}
										</span>
									</span>
									<span className="text-foreground text-sm">
										{item.isAutoCreated ? "" : `${item.modifiedDay}일`}
									</span>
									{renderChangeIndicator(item)}
								</div>
								<button
									className="flex items-center gap-[0.25rem] text-gray-400 hover:text-gray-600 px-[0.5rem] py-[0.25rem] rounded-md hover:bg-gray-100"
									onClick={() => handleRevert(item.idx)}
								>
									<span className="text-sm whitespace-nowrap">돌아가기</span>
									<Icon name="undo" size={16} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default HistoryList;
