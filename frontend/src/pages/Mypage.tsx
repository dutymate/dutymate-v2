import { useState } from "react";
import Sidebar from "../components/organisms/WSidebar";
import MSidebar from "../components/organisms/MSidebar";
import Title from "../components/atoms/Title";
import MypageProfile from "../components/organisms/MypageProfile";
import MypagePassword from "../components/organisms/MypagePassword";
import MypageExit from "../components/organisms/MypageExit";
import { IoMdMenu } from "react-icons/io";
import useUserAuthStore from "../store/userAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ApiErrorResponse, profileService } from "@/services/profileService";
import { AxiosError } from "axios";
import { SEO } from "../components/SEO";
const Mypage = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const { userInfo } = useUserAuthStore();
	const navigate = useNavigate();
	const userAuthStore = useUserAuthStore();

	const handleLogoutButton = async () => {
		try {
			await profileService.logout(
				() => {
					userAuthStore.logout();
					toast.success("로그아웃되었습니다.");
					navigate("/login");
				},
				(error: ApiErrorResponse) => {
					console.error("로그아웃 실패:", error);
					if (error instanceof Error) {
						if (error.message === "서버 연결 실패") {
							toast.error("잠시 후 다시 시도해주세요.");
							return;
						}
						if (error.message === "UNAUTHORIZED") {
							navigate("/login");
							return;
						}
					}
					if ((error as unknown as AxiosError)?.response?.status === 400) {
						toast.error("잘못된 요청입니다.");
						return;
					}
					// 그 외의 모든 에러는 에러 페이지로 이동
					navigate("/error");
				},
			);
		} catch (error) {
			console.error("로그아웃 중 에러 발생:", error);
			navigate("/error");
		}
	};

	return (
		<>
			<SEO
				title="마이페이지 | Dutymate"
				description="듀티메이트의 마이페이지입니다."
			/>
			<div className="w-full min-h-screen flex flex-row bg-[#F4F4F4]">
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
						className="lg:hidden mb-2 p-2 hover:bg-gray-100 rounded-lg"
					>
						<IoMdMenu className="w-6 h-6 text-gray-600" />
					</button>
					<div className="flex items-center gap-[0.75rem]">
						<div className="flex-1">
							<Title title="마이페이지" subtitle="나의 정보를 확인해보세요" />
						</div>
						<button
							onClick={handleLogoutButton}
							className="flex-shrink-0 w-[6.25rem] px-[0.75rem] py-[0.5rem] bg-white text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 text-xs lg:text-sm h-[2.25rem]"
						>
							로그아웃
						</button>
					</div>
					<div className="mt-4 flex justify-center">
						<div className="w-full lg:w-[87.5rem] space-y-4">
							<MypageProfile />
							<MypagePassword />
							<MypageExit />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Mypage;
