// import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
// import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import CommunityCategories from "./CommunityCategories";
import { useState, useEffect } from "react";
import { CommunityWriteButton } from "../atoms/Button";
import boardService, {
	AllPostResponse,
	RecommendedPost,
} from "@/services/boardService";
import { formatTimeAgo } from "@/utils/dateUtiles";

interface CommunityFormProps {
	onWrite: () => void;
	onPostClick: (post: any) => void;
}

const CommunityForm = ({ onWrite, onPostClick }: CommunityFormProps) => {
	const [posts, setPosts] = useState<AllPostResponse[]>([]);
	// const location = useLocation();
	// const navigate = useNavigate();

	const [searchParams, setSearchParams] = useSearchParams();
	const category = searchParams.get("category") || "ALL";
	const [selectedCategory, setSelectedCategory] = useState(category);
	const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>(
		[],
	);

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category);
		setSearchParams({ category });
	};

	// 컴포넌트 마운트 시 상단으로 스크롤
	useEffect(() => {
		fetchRecommendedPosts();
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		// location이 변경될 때마다 카테고리를 기본값으로 리셋
		setSelectedCategory(category);
		fetchPosts(category);
	}, [category]);

	const fetchPosts = (category: string) =>
		boardService.getAllPosts(
			category,
			(data) => setPosts(data),
			(error) => console.error(error),
		);

	const fetchRecommendedPosts = () => {
		boardService.getRecommendedPosts(
			// ({boardList}) => setRecommendedPosts(boardList),
			({ boardList }) => {
				setRecommendedPosts(
					boardList.map((post: any) => ({
						...post,
						title:
							post.title.length > 16
								? post.title.slice(0, 16) + "..."
								: post.title,
					})),
				);
			},
			(error) => console.error(error),
		);
	};

	// 빈 카테고리 메시지 표시 여부 확인
	const shouldShowEmptyMessage = posts.length === 0;

	// 추천 게시글 클릭 핸들러
	const handleRecommendedClick = (recommendedId: number) => {
		const post = recommendedPosts.find((p) => p.boardId === recommendedId);
		if (post) {
			onPostClick(post);
		}
	};

	const handlePostClick = (post: any) => {
		onPostClick(post);
	};

	const getEmptyMessage = (category: string) => {
		switch (category) {
			case "ALL":
				return "아직 작성된 글이 없습니다.";
			case "DAILY":
				return "아직 작성된 일상글이 없습니다.";
			case "QNA":
				return "아직 작성된 Q&A가 없습니다.";
			case "INFO":
				return "아직 작성된 이직 정보가 없습니다.";
			case "HOT":
				return "아직 작성된 글이 없습니다.";
			default:
				return "이 카테고리에 첫 번째 글을 작성해보세요!";
		}
	};

	return (
		<>
			<div className="bg-white rounded-xl p-4 lg:p-6 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
				{/* 상단 버튼 영역 */}
				<div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0 mb-6">
					<div className="overflow-x-auto">
						<CommunityCategories
							onCategorySelect={handleCategoryChange}
							selectedCategory={selectedCategory}
						/>
					</div>
					<CommunityWriteButton onClick={onWrite} className="hidden lg:block" />
				</div>

				{/* 추천 게시글 영역 */}
				<div className="mb-6 p-4 border border-gray-200 rounded-lg">
					<div className="flex items-center gap-4">
						<h3 className="text-sm sm:text-base lg:text-lg font-semibold whitespace-nowrap">
							추천 게시글
						</h3>
						<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
							{recommendedPosts.map((recommended) => (
								<button
									key={recommended.boardId}
									onClick={() => handleRecommendedClick(recommended.boardId)}
									className={`px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200`}
								>
									{recommended.title}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* 게시글 목록 */}
				<div className="space-y-4">
					{shouldShowEmptyMessage ? (
						<div className="p-8 text-center text-gray-400 border border-gray-100 rounded-lg">
							{getEmptyMessage(selectedCategory)}
						</div>
					) : (
						posts.map((post) => (
							<div
								key={post.boardId}
								className="p-4 border border-gray-200 rounded-lg hover:border-primary-dark cursor-pointer transition-colors"
								onClick={() => handlePostClick(post)}
							>
								<div className="flex gap-4">
									<div className="flex-1 flex-col">
										{/* 게시글 헤더 */}
										<div className="flex flex-wrap items-center gap-2 mb-2">
											{post.profileImg ? (
												<img
													src={post.profileImg}
													alt="프로필 이미지"
													className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] text-gray-500 rounded-full"
													onError={(e) => {
														e.currentTarget.onerror = null;
														e.currentTarget.style.display = "none";
													}}
												/>
											) : (
												<Icon
													name="user"
													className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] text-gray-500 rounded-full"
												/>
											)}
											<span className="font-medium text-xs sm:text-sm">
												{post.nickname}
											</span>
											<span className="text-gray-400 text-sm">·</span>
											<span className="text-gray-600 text-xs sm:text-sm">
												{post.category === "DAILY"
													? "일상글"
													: post.category === "QNA"
														? "간호지식 Q&A"
														: "이직 정보"}
											</span>
											<span className="text-gray-400 text-sm">·</span>
											<span className="text-gray-400 text-xs sm:text-sm">
												{formatTimeAgo(post.createdAt)}
											</span>
										</div>

										{/* 게시글 내용 */}
										<div className="flex items-center justify-between gap-2">
											<div>
												<h3 className="text-sm sm:text-lg font-medium mb-2 break-words line-clamp-1">
													{post.title}
												</h3>
												<p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 break-words line-clamp-2">
													{post.content}
												</p>

												{/* 게시글 푸터 */}
												<div className="flex items-center gap-4 text-gray-400 text-xs sm:text-sm">
													<div className="flex items-center gap-1">
														<Icon name="heart" size={16} />
														<span>{post.likeCnt}</span>
													</div>
													<div className="flex items-center gap-1">
														<Icon name="message" size={16} />
														<span>{post.commentCnt}</span>
													</div>
													<div className="flex items-center gap-1">
														<Icon name="eye" size={16} />
														<span>{post.viewCnt}</span>
													</div>
												</div>
											</div>

											{/* 이미지 영역 */}
											{post.boardImgUrl !== null &&
												post.boardImgUrl.trim() !== "" && (
													<div className="flex sm:flex items-center justify-center w-[4rem] h-[4rem] md:w-[6rem] md:h-[6em] xl:w-[7.5rem] xl:h-[7.5rem] bg-gray-50 rounded-lg shrink-0">
														<img
															src={post.boardImgUrl}
															alt={post.title}
															className="w-full h-full object-cover rounded-lg"
														/>
													</div>
												)}
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* 모바일 플로팅 버튼 */}
			<button
				onClick={onWrite}
				className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[3.5rem] h-[3.5rem] rounded-full bg-primary-20 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-primary-30 transition-colors"
			>
				<Icon name="edit" size={24} className="text-primary-dark" />
			</button>
		</>
	);
};

export default CommunityForm;
