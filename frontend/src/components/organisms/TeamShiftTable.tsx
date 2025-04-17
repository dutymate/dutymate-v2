import { useEffect, useState, useRef } from "react";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import { Button } from "../atoms/Button";
// import { Icon } from "../atoms/Icon";
import ReqShiftModal from "./ReqShiftModal";
import { dutyService } from "../../services/dutyService"; //실제 API 호출에 필요한 axios import
import { toast } from "react-toastify";
import { useLoadingStore } from "@/store/loadingStore";
import { toPng } from "html-to-image";
// import mockData from "../../services/response-json/duty/GetApiDutyWard.json"; // 임시 데이터 import

// interface DutyMember {
// 	memberId: number;
// 	name: string;
// 	shifts: string;
// }

// interface DutyInfo {
// 	id: string;
// 	year: number;
// 	month: number;
// 	duty: DutyMember[];
// }

interface WardDuty {
	id: string;
	year: number;
	month: number;
	duty: {
		memberId: number;
		name: string;
		shifts: string;
		role: string;
		grade: number;
	}[];
}

const TeamShiftTable = () => {
	const [wardDuty, setWardDuty] = useState<WardDuty | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isReqModalOpen, setIsReqModalOpen] = useState(false);
	const [currentDate] = useState(() => {
		const now = new Date();
		return {
			year: now.getFullYear(),
			month: now.getMonth() + 1,
		};
	});
	const tableRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchWardDuty = async () => {
			useLoadingStore.getState().setLoading(true);
			try {
				const data = await dutyService.getWardDuty(
					currentDate.year,
					currentDate.month,
				);
				setWardDuty(data);
			} catch (error) {
				console.error("병동 근무표 조회 실패:", error);
				toast.error("병동 근무표를 불러오는데 실패했습니다");
			} finally {
				setIsLoading(false);
				useLoadingStore.getState().setLoading(false);
			}
		};

		fetchWardDuty();
	}, [currentDate]);

	if (isLoading) {
		return <div>로딩 중...</div>;
	}

	if (!wardDuty) return null;

	// 해당 월의 실제 일수 계산
	const daysInMonth = new Date(wardDuty.year, wardDuty.month, 0).getDate();
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

	// 주말 체크 함수 추가
	const isWeekend = (year: number, month: number, day: number) => {
		const date = new Date(year, month - 1, day);
		return date.getDay() === 0 || date.getDay() === 6;
	};

	// 근무표 다운로드 기능
	const handleDownloadWardSchedule = async () => {
		const tableElement = tableRef.current?.querySelector(".duty-table-content");
		if (!tableElement) return;

		try {
			const dataUrl = await toPng(tableElement as HTMLElement, {
				quality: 1.0,
				pixelRatio: 2,
				width: tableElement.scrollWidth + 5,
				height: tableElement.scrollHeight + 5,
				backgroundColor: "#FFFFFF",
				style: {
					borderCollapse: "collapse",
				},
			});

			const link = document.createElement("a");
			link.download = `듀티표_${currentDate.year}년_${currentDate.month}월.png`;
			link.href = dataUrl;
			link.click();

			toast.success("듀티표가 다운로드되었습니다.");
		} catch (error) {
			console.error("Download error:", error);
			toast.error("듀티표 다운로드에 실패했습니다.");
		}
	};

	const sortedDuty = wardDuty.duty.sort((a, b) => {
		// 먼저 role로 정렬 (HN이 위로)
		if (a.role === "HN" && b.role !== "HN") return -1;
		if (a.role !== "HN" && b.role === "HN") return 1;

		// role이 같은 경우 grade로 정렬 (내림차순)
		return b.grade - a.grade;
	});

	return (
		<div
			ref={tableRef}
			className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-4 sm:p-6"
		>
			<div className="flex flex-col sm:flex-row items-center justify-between mb-4">
				<div className="w-[11.25rem] hidden sm:block">
					{/* 왼쪽 여백 공간 */}
				</div>
				<div className="flex items-center gap-4 sm:gap-14 mb-4 sm:mb-0">
					{/* <Icon
						name="left"
						size={24}
						className="cursor-pointer text-gray-300 hover:text-gray-400"
						onClick={handlePrevMonth}
					/> */}
					<div className="text-[0.9rem] lg:text-lg font-medium whitespace-nowrap">
						{wardDuty.year}년 {wardDuty.month}월
					</div>
					{/* <Icon
						name="right"
						size={24}
						className="cursor-pointer text-gray-300 hover:text-gray-400"
						onClick={handleNextMonth}
					/> */}
				</div>
				<div className="flex gap-2 w-full sm:w-[11.25rem] justify-end sm:justify-end shrink-0">
					<Button
						color="primary"
						className="whitespace-nowrap px-7 w-[45%] sm:w-auto text-base"
						onClick={() => setIsReqModalOpen(true)}
					>
						근무 요청
					</Button>
					<Button
						color="off"
						className="whitespace-nowrap px-4 w-[45%] sm:w-auto text-base"
						onClick={handleDownloadWardSchedule}
					>
						다운로드
					</Button>
				</div>
			</div>
			<div className="overflow-x-auto relative w-full">
				<div className="duty-table-content min-w-[640px]">
					<table className="w-full border-separate border-spacing-0 rounded-lg">
						<thead>
							<tr className="bg-gray-50">
								<th className="w-[3.75rem] lg:w-[7.5rem] px-1 lg:px-2 py-2 sticky left-0 bg-gray-50 z-20 opacity-100">
									<span className="text-gray-50">공백</span>
								</th>
								{days.map((day) => (
									<th
										key={day}
										className={`w-[calc((100%-7.5rem)/31)] px-1 py-2 ${
											isWeekend(wardDuty.year, wardDuty.month, day)
												? "text-red-500"
												: ""
										} font-normal`}
									>
										{day}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{sortedDuty.map((member) => (
								<tr key={member.memberId} className="border-b border-gray-100">
									<td className="w-[3.75rem] lg:w-[7.5rem] pl-1 lg:pl-2 pr-1 lg:pr-2 py-2 font-medium sticky left-0 bg-white z-20 before:absolute before:content-[''] before:top-0 before:left-[-9999px] before:bottom-0 before:w-[9999px] before:bg-white text-center group">
										<div className="bg-gray-50 rounded-lg px-1 lg:px-2 py-0.5 relative">
											<span className="block truncate max-w-[3.75rem] lg:max-w-[7.5rem] text-xs lg:text-base">
												{member.name}
											</span>
											{member.name.length > 3 && (
												<div className="absolute left-0 -top-8 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-30">
													{member.name}
												</div>
											)}
										</div>
									</td>
									{member.shifts.split("").map((shift, index) => (
										<td
											key={index}
											className="w-[calc((100%-7.5rem)/31)] px-1 py-1.5 text-center"
										>
											<DutyBadgeEng
												type={
													(shift === "X" ? "X" : shift) as
														| "D"
														| "E"
														| "N"
														| "O"
														| "X"
												}
												variant="letter"
												size="sm"
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			{isReqModalOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={() => setIsReqModalOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<ReqShiftModal onClose={() => setIsReqModalOpen(false)} />
					</div>
				</div>
			)}
		</div>
	);
};

export default TeamShiftTable;
