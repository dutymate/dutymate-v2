import Sidebar from "../components/organisms/WSidebar";
import MSidebar from "../components/organisms/MSidebar";
import Title from "../components/atoms/Title";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import useUserAuthStore from "../store/userAuthStore";
import { WormGameModal } from "../components/organisms/WormGameModal";
import { Button } from "../components/atoms/Button";
import { SEO } from "../components/SEO";

const Game = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isGameOpen, setIsGameOpen] = useState(false);
	const { userInfo } = useUserAuthStore();

	return (
		<>
			<SEO
				title="게임 | Dutymate"
				description="듀티메이트의 미니게임을 체험해보세요!"
			/>
			<div className="w-full h-screen flex flex-row bg-[#F4F4F4]">
				{/* 데스크톱 Sidebar */}
				<div className="hidden lg:block w-[238px] shrink-0">
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
						<IoMdMenu className="w-6 h-6 text-gray-600" />
					</button>

					<Title
						title="DutyWorm Game"
						subtitle="듀티메이트의 미니게임을 체험해보세요!"
					/>

					<div className="mt-8 flex flex-col items-center justify-center">
						<div className="max-w-md w-full bg-white rounded-xl p-6 shadow-md">
							<h2 className="text-xl font-bold text-center mb-4">게임 설명</h2>
							<p className="text-gray-600 mb-6">
								방향키를 사용하여 지렁이를 조작하고, 듀티 뱃지를 먹어 점수를
								획득하세요! 벽이나 자신의 몸에 부딪히지 않도록 주의하세요.
							</p>
							<div className="flex justify-center">
								<Button
									onClick={() => setIsGameOpen(true)}
									color="primary"
									size="lg"
									className="w-full max-w-xs"
								>
									게임 시작하기
								</Button>
							</div>
						</div>
					</div>

					<WormGameModal
						isOpen={isGameOpen}
						onClose={() => setIsGameOpen(false)}
					/>
				</div>
			</div>
		</>
	);
};

export default Game;
