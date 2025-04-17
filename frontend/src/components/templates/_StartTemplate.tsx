// StartTemplate.tsx

import { Link } from "react-router-dom";

interface StartTemplateProps {
	children: React.ReactNode;
	isLoginPage?: boolean;
}

const StartTemplate: React.FC<StartTemplateProps> = ({
	children,
	isLoginPage,
}) => {
	return (
		<div className="w-full h-screen lg:grid lg:grid-cols-2">
			{/* 모바일 레이아웃 */}
			<div className="lg:hidden flex flex-col h-screen overflow-hidden">
				<div className="flex-1 bg-base-muted-30 flex flex-col relative">
					<div
						className={`absolute w-full ${
							isLoginPage ? "top-[14rem]" : "top-[5rem]"
						}`}
					>
						<div className="flex justify-center">
							<img
								src="/images/logo.svg"
								alt="DutyMate Logo"
								className="w-[60%] max-w-[17.5rem]"
							/>
						</div>
					</div>

					{!isLoginPage && (
						<div className="px-[2.5rem] py-[5rem] mt-[8rem]">
							<div className="flex flex-col gap-[0.5rem] mb-[2rem] lg:text-left text-center">
								<h1 className="text-[1.5rem] font-bold text-gray-800">
									"듀티표의 마침표, 듀티메이트."
								</h1>
								<p className="text-[1rem] text-gray-600">
									간호사 업무의 효율성과 공정성을 높이는
									<br />
									자동화 듀티표 생성 서비스.
								</p>
							</div>
							<div className="flex justify-center">{children}</div>
						</div>
					)}

					{isLoginPage && (
						<div className="flex-1 flex items-center justify-center">
							{children}
						</div>
					)}

					{!isLoginPage && (
						<div className="absolute -bottom-[17vh] right-[-40%] w-[130%] z-10 hidden lg:block">
							<img
								src="/images/notebook.svg"
								alt="Notebook Preview"
								className="w-full"
							/>
						</div>
					)}
				</div>

				{!isLoginPage && <div className="h-[35vh] bg-primary-20" />}
			</div>

			{/* 데스크톱 레이아웃 - 기존 코드 유지 */}
			<div className="hidden lg:block relative w-full h-full">
				{/* 배경 색상 레이어 */}
				<div className="absolute inset-0">
					<div className="h-[70%] bg-base-muted-30"></div>
					<div className="h-[30%] bg-primary-20 z-0"></div>
				</div>
				{/* 콘텐츠 래퍼 - 전체 세로 중앙 정렬 */}
				<div className="relative h-full flex items-center -translate-y-[8vh]">
					<div className="relative w-full">
						{/* 텍스트와 노트북 컨테이너 */}
						<div className="relative h-[70vh]">
							{/* 메인 텍스트 영역 */}
							<div className="absolute top-[8vh] w-full z-10">
								<div className="pl-[8%] -translate-y-[9vh]">
									<div className="flex flex-col gap-[0.3vw]">
										<h1 className="text-[1.7vw] font-bold text-gray-800">
											"듀티표의 마침표, 듀티메이트."
										</h1>
										<p className="text-[1.1vw] text-gray-600">
											간호사 업무의 효율성과 공정성을 높이는
											<br />
											자동화 듀티표 생성 서비스.
										</p>
									</div>
								</div>
							</div>
							{/* 노트북 이미지 */}
							<div className="absolute top-[14vh] -left-[20%] w-[120%] z-20">
								<img
									src="/images/notebook.svg"
									alt="Notebook Preview"
									className="w-full"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 데스크톱 오른쪽 영역 */}
			<div className="hidden lg:block relative w-full h-full">
				<div className="absolute inset-0">
					<div className="h-[70%] bg-base-muted-30"></div>
					<div className="h-[30%] bg-primary-20"></div>
				</div>

				<div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
					<div className="w-fit flex flex-col items-center justify-center gap-2">
						<Link
							to={"/"}
							className="flex items-center justify-center w-[35%] h-[35%]"
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
		</div>
	);
};

export default StartTemplate;
