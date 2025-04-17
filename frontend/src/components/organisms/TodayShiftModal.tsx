// TodayShiftModal.tsx

import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { DutyBadgeKor } from "../atoms/DutyBadgeKor";
import { convertDutyType } from "../../utils/dutyUtils";

// 상수를 컴포넌트 외부로 이동
const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
type WeekDay = (typeof weekDays)[number];

// 한글 요일 매핑
const koreanWeekDays: Record<WeekDay, string> = {
	SUN: "일요일",
	MON: "월요일",
	TUE: "화요일",
	WED: "수요일",
	THU: "목요일",
	FRI: "금요일",
	SAT: "토요일",
};

interface TodayShiftModalProps {
	date: Date | null;
	duty: "day" | "evening" | "night" | "off";
	dutyData: {
		myShift: "D" | "E" | "N" | "O" | "X";
		otherShifts: {
			grade: number;
			name: string;
			shift: "D" | "E" | "N" | "O" | "X";
		}[];
	};
	isMobile: boolean;
	onClose?: () => void;
	onDateChange: (newDate: Date) => void;
	loading?: boolean;
}

const TodayShiftModal = ({
	date,
	duty,
	dutyData,
	isMobile,
	onClose,
	onDateChange,
	loading = false,
}: TodayShiftModalProps) => {
	if (!date) return null;

	const formatMonth = (month: number) => {
		return month < 10 ? `0${month}` : month;
	};

	const handlePrevDay = () => {
		const newDate = new Date(date);
		newDate.setDate(date.getDate() - 1);
		onDateChange(newDate);
	};

	const handleNextDay = () => {
		const newDate = new Date(date);
		newDate.setDate(date.getDate() + 1);
		onDateChange(newDate);
	};

	const modalContent = (
		<div
			className={`bg-white rounded-[1rem] p-[1rem] shadow-sm ${
				isMobile
					? "w-full max-w-[25rem] h-[28rem] py-6"
					: "w-full h-full min-h-[37.5rem]"
			} flex flex-col relative`}
		>
			{isMobile && (
				<button
					onClick={onClose}
					className="absolute top-[1rem] right-[1rem] z-20"
				>
					<IoMdClose className="w-6 h-6 text-gray-600" />
				</button>
			)}

			{loading ? (
				<div className="flex justify-center items-center flex-1">
					<div className="animate-spin rounded-full h-[2rem] w-[2rem] border-[0.125rem] border-primary border-t-transparent"></div>
				</div>
			) : !dutyData ? (
				<div className="text-center py-[2rem] flex-1 flex items-center justify-center">
					<p className="text-base-muted">해당 날짜의 근무 정보가 없습니다.</p>
					<button
						onClick={onClose}
						className="mt-[1rem] px-[1rem] py-[0.5rem] bg-primary text-white rounded-lg hover:bg-primary/90"
					>
						닫기
					</button>
				</div>
			) : (
				<div className="flex flex-col h-full">
					<div className="flex-none">
						<div className="text-center mb-[0.5rem] lg:mb-[1rem]">
							<div className="flex items-center justify-center gap-[2rem] lg:gap-[4rem] mb-[0.25rem] lg:mb-[0.5rem]">
								<button onClick={handlePrevDay}>
									<IoChevronBack className="w-6 h-6 text-base-muted hover:text-gray-600" />
								</button>
								<h3 className="text-base-foreground text-[1.125rem] font-medium">
									{formatMonth(date.getMonth() + 1)}월 {date.getDate()}일{" "}
									{koreanWeekDays[weekDays[date.getDay()]]}
								</h3>
								<button onClick={handleNextDay}>
									<IoChevronForward className="w-6 h-6 text-base-muted hover:text-gray-600" />
								</button>
							</div>
							{dutyData.myShift !== "X" && (
								<div className="inline-block">
									<p className="text-base-foreground text-[1rem] mb-[0.25rem] lg:mb-[0.5rem]">
										오늘의 근무 일정은{" "}
										<span className={`text-duty-${duty} font-medium`}>
											{duty.toUpperCase()}
										</span>{" "}
										입니다!
									</p>
									<div className={`h-1 bg-duty-${duty}-bg w-full`} />
								</div>
							)}
						</div>
						<div className="border-t border-gray-900 mb-[0.25rem] lg:mb-[0.5rem]" />
					</div>

					<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
						<div className="space-y-[0.0625rem] lg:space-y-[0.125rem]">
							{dutyData.otherShifts
								.sort((a, b) => {
									const dutyOrder = {
										D: 0, // day
										E: 1, // evening
										N: 2, // night
										O: 3, // off
										X: 4, // 근무 없음
									};
									return dutyOrder[a.shift] - dutyOrder[b.shift];
								})
								.map((nurse, index) => (
									<div
										key={index}
										className="flex items-center justify-between py-[0.0625rem] lg:py-[0.125rem]"
									>
										<div className="flex items-center gap-[0.25rem] lg:gap-[0.5rem] flex-1 min-w-0">
											<span
												className="text-base-foreground w-[6rem] truncate text-[0.875rem]"
												title={nurse.name}
											>
												{nurse.name}
											</span>
											<span className="text-base-foreground text-center flex-1 text-[0.875rem] whitespace-nowrap">
												{nurse.grade}년차
											</span>
										</div>
										{nurse.shift !== "X" ? (
											<div>
												<DutyBadgeKor
													type={convertDutyType(nurse.shift)}
													size="xxs"
												/>
											</div>
										) : (
											<div className="w-[4.0625rem] h-[1.875rem]" />
										)}
									</div>
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);

	if (isMobile) {
		return (
			<div
				className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-[1rem]"
				onClick={(e) => {
					if (e.target === e.currentTarget && onClose) {
						onClose();
					}
				}}
			>
				{modalContent}
			</div>
		);
	}

	return modalContent;
};

export default TodayShiftModal;
