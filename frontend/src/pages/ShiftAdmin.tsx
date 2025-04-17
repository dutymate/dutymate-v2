import Sidebar from "../components/organisms/WSidebar";
import MSidebar from "../components/organisms/MSidebar";
import ShiftAdminTable from "../components/organisms/ShiftAdminTable";
import RuleCheckList from "../components/organisms/RuleCheckList";
import HistoryList from "../components/organisms/HistoryList";
import { useState, useEffect } from "react";
import { IoMdMenu } from "react-icons/io";
import useUserAuthStore from "../store/userAuthStore";
import useShiftStore from "../store/shiftStore";
import PageLoadingSpinner from "@/components/atoms/Loadingspinner";
import { SEO } from "../components/SEO";
const DutyManagement = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const { userInfo } = useUserAuthStore();

	const { dutyInfo, loading, error, fetchDutyInfo } = useShiftStore();

	useEffect(() => {
		// URL에서 year와 month 파라미터 가져오기
		const url = new URL(window.location.href);
		const urlYear = url.searchParams.get("year");
		const urlMonth = url.searchParams.get("month");

		// year가 2000-2099 범위를 벗어나거나 유효하지 않은 숫자인 경우
		if (urlYear) {
			const yearNum = parseInt(urlYear);
			if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2099) {
				window.location.href = "/error";
				return;
			}
		}

		// month가 1-12 범위를 벗어나거나 유효하지 않은 숫자인 경우
		if (urlMonth) {
			const monthNum = parseInt(urlMonth);
			if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
				window.location.href = "/error";
				return;
			}
		}

		// URL에 파라미터가 있으면 해당 값으로, 없으면 undefined로 호출
		fetchDutyInfo(
			urlYear ? parseInt(urlYear) : undefined,
			urlMonth ? parseInt(urlMonth) : undefined,
		);
	}, []);

	if (loading && !dutyInfo) {
		return <PageLoadingSpinner />;
	}
	if (error) return <div>Error: {error}</div>;
	if (!dutyInfo) return null;

	return (
		<>
			<SEO
				title="근무표 관리 | Dutymate"
				description="근무표를 관리해보세요."
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
				<div className="flex-1 min-w-0 px-[1rem] lg:px-[2rem] py-[1.5rem] h-[calc(100vh-1rem)] lg:h-screen overflow-y-auto">
					{/* 모바일 메뉴 버튼 */}
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="lg:hidden mb-[1rem] p-[0.5rem] hover:bg-gray-100 rounded-lg"
					>
						<IoMdMenu className="w-6 h-6 text-gray-600" />
					</button>

					<div className="flex flex-col gap-[0.75rem] pb-[2rem]">
						<ShiftAdminTable
							dutyData={dutyInfo.duty}
							invalidCnt={dutyInfo.invalidCnt}
							year={dutyInfo.year}
							month={dutyInfo.month}
							onUpdate={fetchDutyInfo}
							issues={dutyInfo.issues}
						/>
						<div className="flex flex-col xl:flex-row gap-[1rem] w-full">
							<RuleCheckList />
							<HistoryList />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default DutyManagement;
