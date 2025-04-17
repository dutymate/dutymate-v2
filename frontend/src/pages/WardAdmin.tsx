import Sidebar from "../components/organisms/WSidebar";
import MSidebar from "../components/organisms/MSidebar";
import Title from "../components/atoms/Title";
import { useState, useEffect } from "react";
import { IoMdMenu } from "react-icons/io";
import WardAdminInfo from "../components/organisms/WardAdminInfo";
import WardAdminTable from "../components/organisms/WardAdminTable";
import { wardService } from "../services/wardService";
// import { WardInfo } from "../services/wardService";
import { toast } from "react-toastify";
import useUserAuthStore from "../store/userAuthStore";
import useWardStore from "../store/wardStore";
import { useLoadingStore } from "@/store/loadingStore";
import { SEO } from "../components/SEO";

const WardAdmin = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const { wardInfo, setWardInfo, addVirtualNurse } = useWardStore();
	const { userInfo } = useUserAuthStore();

	useEffect(() => {
		const fetchWardInfo = async () => {
			try {
				useLoadingStore.getState().setLoading(true);
				const data = await wardService.getWardInfo();
				setWardInfo(data);
			} catch (error) {
				toast.error("병동 정보를 불러오는데 실패했습니다", {
					position: "top-right",
				});
				useLoadingStore.getState().setLoading(false);
			} finally {
				setIsLoading(false);
				useLoadingStore.getState().setLoading(false);
			}
		};

		fetchWardInfo();
	}, [setWardInfo]);

	const handleAddVirtualNurse = async (count: number) => {
		try {
			await addVirtualNurse(count);
			// 임시 간호사 추가 후 병동 정보 다시 불러오기
			const data = await wardService.getWardInfo();
			setWardInfo(data);
			toast.success("임시 간호사가 추가되었습니다.", {
				position: "top-right",
			});
		} catch (error) {
			toast.error("임시 간호사 추가에 실패했습니다.", {
				position: "top-right",
			});
		}
	};

	const handleViewHistory = () => {
		toast.info("준비 중입니다.", {
			position: "top-right",
		});
	};

	return (
		<>
			<SEO
				title="병동 관리 | Dutymate"
				description="병동의 간호사를 관리해보세요."
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
				<div className="flex-1 min-w-0 px-4 lg:px-8 py-6 overflow-y-auto">
					{/* 모바일 메뉴 버튼 */}
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="lg:hidden mb-4 p-2 hover:bg-gray-100 rounded-lg"
					>
						<IoMdMenu className="w-[1.5rem] h-[1.5rem] text-gray-600" />
					</button>

					<div className="mb-3">
						<Title title="병동 관리" subtitle="병동의 간호사를 관리해보세요" />
					</div>
					<div className="mt-6 flex flex-col gap-4">
						{!isLoading && wardInfo && (
							<>
								<WardAdminInfo
									wardInfo={wardInfo}
									onAddTempNurse={handleAddVirtualNurse}
									onViewHistory={handleViewHistory}
								/>
								<WardAdminTable />
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default WardAdmin;
