import { useNewsStore } from "@/store/newsStore";
import { useEffect } from "react";
import { GoDotFill } from "react-icons/go";
import { IoMdClose } from "react-icons/io";

const CommunityNews = ({ onClose }: any) => {
	const { newsies, fetchNewsies } = useNewsStore();

	useEffect(() => {
		if (newsies.length === 0) {
			fetchNewsies();
		}
	}, []);

	return (
		// {/* 광고 배너 영역 - 데스크톱에서만 표시 */}
		<div className={`shrink-0 px-1 flex-col items-center`}>
			<div className="bg-white rounded-lg p-3 min-h-[37.5rem] sticky top-6 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)] relative">
				{/* Title with dots */}
				<div className="flex flex-col items-center justify-center gap-1 mb-3">
					<button
						className="lg:hidden absolute right-3 top-3 p-2"
						onClick={onClose}
					>
						<IoMdClose className="w-6 h-6 text-gray-600" />
					</button>
					<h2 className="mt-2 text-primary-dark font-semibold whitespace-nowrap">
						오늘의 간호 NEWS
					</h2>
					<div className="mt-2 text-[#b0b0b0] font-semibold whitespace-nowrap text-sm flex items-center">
						<GoDotFill />
						<span>GPT가 추천하는 뉴스 TOP 5</span>
						<GoDotFill />
					</div>
				</div>

				{/* News Cards */}
				<div className="space-y-4">
					{newsies.map((news, index) => (
						<a
							key={index}
							href={news.link}
							target="_blank"
							rel="noopener noreferrer"
							className="block hover:border-primary border-2 rounded-lg"
						>
							<div className="rounded-lg overflow-hidden">
								<div className="bg-white px-3 pt-3 pb-0">
									<h3 className="font-medium text-foreground flex-1 truncate text-md">
										{news.title}
									</h3>
								</div>
								<div className="bg-white px-3 pb-3 pt-1">
									<p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
										{news.description}
									</p>
								</div>
							</div>
						</a>
					))}
				</div>
				<div className="text-sm text-gray-500 ml-2 mt-2  ">
					*뉴스는 6시, 14시, 21시에 업데이트됩니다.
				</div>
			</div>
		</div>
	);
};

export default CommunityNews;
