// NextTemplate.tsx

import { Link } from "react-router-dom";

interface NextTemplateProps {
	children: React.ReactNode;
	isLandingPage?: boolean;
}

const NextTemplate: React.FC<NextTemplateProps> = ({
	children,
	isLandingPage,
}) => {
	return (
		<div className="w-full h-screen lg:grid lg:grid-cols-2">
			{/* 모바일 레이아웃 */}
			<div className="lg:hidden flex flex-col h-screen overflow-hidden">
				<div className="flex-1 bg-base-muted-30 animate-wave-bg flex flex-col relative">
					{isLandingPage ? (
						// 로딩 페이지일 때의 레이아웃
						<>
							<div className="absolute w-full top-[25%]">
								<div className="flex justify-center">
									<Link
										to={"/"}
										className="flex items-center justify-center w-[50%] max-w-[17.5rem] mb-[3rem]"
									>
										<img
											src="/images/logo.svg"
											alt="DutyMate Logo"
											className="w-full h-full object-contain"
										/>
									</Link>
								</div>
							</div>
							<div className="absolute w-full top-[40%]">
								<div className="flex justify-center">{children}</div>
							</div>
						</>
					) : (
						// 폼 페이지들(로그인, 부가정보, 병동생성, 병동입장)의 레이아웃
						<>
							<div className="absolute w-full top-[11%]">
								<div className="flex justify-center">
									<Link
										to={"/"}
										className="flex items-center justify-center w-[50%] max-w-[17.5rem] mb-[3rem]"
									>
										<img
											src="/images/logo.svg"
											alt="DutyMate Logo"
											className="w-full h-full object-contain"
										/>
									</Link>
								</div>
							</div>
							<div className="absolute w-full top-[22%]">
								<div className="flex justify-center">{children}</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* 데스크톱 레이아웃 */}
			<div className="hidden lg:block relative w-full h-full">
				{/* 배경 색상 레이어 */}
				<div className="absolute inset-0">
					<div className="h-full bg-base-muted-30"></div>
				</div>
				{/* 콘텐츠 래퍼 - 전체 세로 중앙 정렬 */}
				<div className="relative h-full flex items-center">
					<div className="relative w-full">
						{/* 메인 텍스트 영역 */}
						<div className="pl-[8%]">
							<div className="flex flex-col gap-[0.3rem]">
								<h1 className="text-[1.7rem] font-bold text-gray-800">
									Welcome
								</h1>
								<p className="text-[1.1rem] text-gray-600">
									Start your journey with us
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 데스크톱 오른쪽 영역 */}
			<div className="hidden lg:block relative w-full h-full">
				<div className="absolute inset-0">
					<div className="h-full bg-base-muted-30"></div>
				</div>
				<div className="relative z-10 h-full flex flex-col items-center justify-center translate-y-[5rem]">
					<Link
						to={"/"}
						className="flex items-center justify-center w-[60%] max-w-[17.5rem] mb-[3rem]"
					>
						<img
							src="/images/logo.svg"
							alt="DutyMate Logo"
							className="w-full h-full object-contain"
						/>
					</Link>
					{children}
				</div>
			</div>
		</div>
	);
};

export default NextTemplate;
