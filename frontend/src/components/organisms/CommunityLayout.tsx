import useUserAuthStore from "@/store/userAuthStore";
import { useEffect, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import Title from "../atoms/Title";
import Sidebar from "./WSidebar";
import MSidebar from "./MSidebar";
import CommunityNews from "./CommunityNews";
import { createPortal } from "react-dom";
import { IoNewspaperOutline } from "react-icons/io5";

// 모달 컴포넌트
const Modal = ({ isOpen, onClose, children }: any) => {
	useEffect(() => {
		// ESC 키로 모달 닫기
		const handleEsc = (e: any) => {
			if (e.key === "Escape") onClose();
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEsc);
			// 모달 열릴 때 body 스크롤 방지
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEsc);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
			<div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
			<div className="relative z-50 bg-white rounded-lg p-0 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
				{children}
			</div>
		</div>,
		document.body,
	);
};

const CommunityLayout = ({ title, subtitle, children }: any) => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const { userInfo } = useUserAuthStore();
	const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

	const handleNewsButton = () => {
		setIsNewsModalOpen(true);
	};

	return (
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
			<div className="flex-1 min-w-0 px-4 lg:px-8 py-6 h-[calc(100vh-1rem)] lg:h-screen overflow-y-auto lg:overflow-x-hidden">
				{/* 모바일 메뉴 버튼 */}
				<button
					onClick={() => setIsSidebarOpen(true)}
					className="lg:hidden mb-4 p-2 hover:bg-gray-100 rounded-lg"
				>
					<IoMdMenu className="w-6 h-6 text-gray-600" />
				</button>

				<div className="flex items-center gap-[0.75rem]">
					<div className="flex-1">
						<Title title={title} subtitle={subtitle} />
					</div>
					<button
						onClick={handleNewsButton}
						className="flex-shrink-0 w-[5.75rem] px-[0.75rem] py-[0.5rem] bg-white text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 text-xs lg:text-sm h-[2.25rem] lg:hidden flex items-center gap-2"
					>
						<IoNewspaperOutline className="w-6 h-6 text-gray-600" />
						<span>News</span>
					</button>
				</div>

				<Modal
					isOpen={isNewsModalOpen}
					onClose={() => setIsNewsModalOpen(false)}
				>
					<CommunityNews onClose={() => setIsNewsModalOpen(false)} />
				</Modal>

				{/* 컨텐츠와 뉴스 영역 */}
				<div className="mt-6 flex gap-6">
					{/* 메인 컨텐츠 */}
					<div className="flex-1 min-w-0">{children}</div>
					{/* 뉴스 영역 */}
					<div className="hidden lg:block w-[22rem] shrink-0">
						<CommunityNews />
					</div>
				</div>
			</div>
		</div>
	);
};

export default CommunityLayout;
