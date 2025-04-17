import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
const Error = () => {
	const navigate = useNavigate();

	return (
		<>
			<SEO
				title="오류 | Dutymate"
				description="오류가 발생했습니다. 다시 시도해주세요."
			/>
			<div className="min-h-screen bg-base-background flex flex-col items-center justify-center px-4">
				<div className="w-full max-w-md text-center space-y-8">
					{/* Error Icon */}
					<div className="w-24 h-24 mx-auto bg-primary-bg rounded-full flex items-center justify-center">
						<svg
							className="w-12 h-12 text-primary-dark"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>

					{/* Error Message */}
					<div className="space-y-4">
						<h1 className="text-2xl font-bold text-base-foreground">
							페이지를 찾을 수 없습니다.
						</h1>
						<p className="text-base-foreground/70">
							요청하신 페이지를 찾을 수 없거나 접근 권한이 없습니다.
						</p>
					</div>

					{/* Action Buttons */}
					<div className="space-y-4">
						<button
							onClick={() => navigate(-1)}
							className="w-full px-4 py-2 text-base-white bg-primary hover:bg-primary-dark transition-colors rounded-lg shadow-sm"
						>
							이전 페이지로 돌아가기
						</button>
						<button
							onClick={() => navigate("/")}
							className="w-full px-4 py-2 text-primary border border-primary hover:bg-primary-10 transition-colors rounded-lg"
						>
							홈으로 가기
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default Error;
