import Sidebar from "../components/organisms/WSidebar";
import MSidebar from "../components/organisms/MSidebar";
import Title from "../components/atoms/Title";
import MyShiftCalendar from "../components/organisms/MyShiftCalendar";
import TodayShiftModal from "../components/organisms/TodayShiftModal";
import { useState, useEffect } from "react";
import { IoMdMenu } from "react-icons/io";
import { dutyService } from "../services/dutyService";
import useUserAuthStore from "../store/userAuthStore";
import { toast } from "react-toastify";
import { useLoadingStore } from "@/store/loadingStore";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
// Duty 타입 변환 유틸리티 함수
const convertDutyType = (
	duty: "D" | "E" | "N" | "O",
): "day" | "evening" | "night" | "off" => {
	const dutyMap = {
		D: "day",
		E: "evening",
		N: "night",
		O: "off",
	} as const;
	return dutyMap[duty];
};

const MyShift = () => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedDuty, setSelectedDuty] = useState<
		"day" | "evening" | "night" | "off"
	>("day");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [myDutyData, setMyDutyData] = useState<{
		year: number;
		month: number;
		shifts: string;
		prevShifts: string;
		nextShifts: string;
	} | null>(null);
	const [dayDutyData, setDayDutyData] = useState<{
		myShift: "D" | "E" | "N" | "O";
		otherShifts: {
			grade: number;
			name: string;
			shift: "D" | "E" | "N" | "O";
		}[];
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const { userInfo } = useUserAuthStore(); // 전역 상태에서 role 가져오기
	const navigate = useNavigate();

	// 초기 데이터 로딩
	useEffect(() => {
		useLoadingStore.getState().setLoading(true);
		const fetchMyDuty = async () => {
			try {
				const today = new Date();
				const data = await dutyService.getMyDuty(
					today.getFullYear(),
					today.getMonth() + 1,
				);
				setMyDutyData(data);
				useLoadingStore.getState().setLoading(false);
			} catch (error) {
				useLoadingStore.getState().setLoading(false);
				console.error("Failed to fetch duty data:", error);
				navigate("/error");
			}
		};
		fetchMyDuty();
	}, [navigate]);

	// 날짜 선택 시 해당 날짜의 근무 데이터 로딩
	const handleDateSelect = async (date: Date) => {
		setSelectedDate(date);
		setLoading(true);
		setDayDutyData(null); // 새로운 요청 시 이전 데이터 초기화
		try {
			const data = await dutyService.getMyDayDuty(
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate(),
			);
			setDayDutyData(data);
			setSelectedDuty(convertDutyType(data.myShift));
		} catch (error) {
			toast.error("해당 날짜의 근무 정보가 없습니다.");
			setSelectedDate(null); // 선택된 날짜 초기화
		} finally {
			setLoading(false);
		}
	};

	// MyShiftCalendar에서 월 변경 시 호출할 핸들러 추가
	const handleMonthChange = async (year: number, month: number) => {
		try {
			const data = await dutyService.getMyDuty(year, month);
			setMyDutyData(data);
		} catch (error) {
			console.error("Failed to fetch duty data:", error);
		}
	};

	return (
		<>
			<SEO
				title="나의 근무표 | Dutymate"
				description="나의 근무 일정을 확인해보세요."
			/>

			<div className="w-full h-screen flex flex-row bg-[#F4F4F4]">
				{/* 데스크톱 Sidebar */}
				<div className="hidden lg:block w-[14.875rem] shrink-0">
					<Sidebar userType={userInfo?.role as "HN" | "RN"} />
				</div>

				{/* 모바일 Sidebar */}
				<MSidebar
					userType={userInfo?.role as "HN" | "RN"}
					isOpen={isSidebarOpen}
					onClose={() => setIsSidebarOpen(false)}
				/>

				{/* 메인 컨텐츠 영역 */}
				<div className="flex-1 min-w-0 px-4 lg:px-8 py-6 h-[calc(100vh-1rem)] lg:h-screen overflow-y-auto">
					{/* 모바일 메뉴 버튼 */}
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="lg:hidden mb-[1rem] p-[0.5rem] hover:bg-gray-100 rounded-lg"
					>
						<IoMdMenu className="w-6 h-6 text-gray-600" />
					</button>

					{/* Title 컴포넌트의 위치 조정 */}
					{/* <div className="mb-[0.75rem] pl-[0.5rem] lg:pl-[1rem]"> */}
					<Title title="나의 듀티표" subtitle="나의 근무 일정을 확인해보세요" />
					{/* </div> */}
					<div className="block lg:flex lg:gap-[2rem] mt-6">
						{/* 캘린더와 모달을 감싸는 컨테이너 */}
						<div className="calendar-modal-container flex flex-col lg:flex-row w-full gap-4">
							{/* 캘린더 영역 - 65% */}
							<div className="relative lg:w-[65%]">
								<MyShiftCalendar
									onDateSelect={handleDateSelect}
									selectedDate={selectedDate}
									dutyData={myDutyData}
									onMonthChange={handleMonthChange}
								/>
							</div>

							{/* 모달 영역 - 35% */}
							{selectedDate && dayDutyData && (
								<>
									{/* 데스크톱 버전 */}
									<div className="hidden lg:block lg:w-[35%]">
										<TodayShiftModal
											date={selectedDate}
											duty={selectedDuty}
											dutyData={dayDutyData}
											isMobile={false}
											onClose={() => setSelectedDate(null)}
											onDateChange={(newDate) => handleDateSelect(newDate)}
											loading={loading}
										/>
									</div>
									{/* 모바일 버전 */}
									<div className="lg:hidden">
										<TodayShiftModal
											date={selectedDate}
											duty={selectedDuty}
											dutyData={dayDutyData}
											isMobile={true}
											onClose={() => setSelectedDate(null)}
											onDateChange={(newDate) => handleDateSelect(newDate)}
											loading={loading}
										/>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default MyShift;
