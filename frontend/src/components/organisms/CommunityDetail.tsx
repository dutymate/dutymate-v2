import boardService from "@/services/boardService";
import { formatTimeAgo } from "@/utils/dateUtiles";
import { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaArrowUpLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Icon } from "../atoms/Icon";

interface Comment {
	commentId: number;
	nickname: string;
	profileImg: string;
	content: string;
	createdAt: string;
	isMyWrite: boolean;
}

interface CommunityDetailProps {
	post: {
		boardId: number;
		nickname: string;
		profileImg: string;
		category: string;
		createdAt: string;
		title: string;
		content: string;
		boardImgUrl?: string;
		likeCnt: number;
		commentCnt: number;
		viewCnt: number;
		isMyWrite: boolean;
		isLike: boolean;
		comments: Comment[];
	};
}

const CommunityDetail = ({ post }: CommunityDetailProps) => {
	const [newComment, setNewComment] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const [showCommentDropdown, setShowCommentDropdown] = useState<number | null>(
		null,
	);
	const dropdownRef = useRef<(HTMLDivElement | null)[]>([]);

	const [isLiked, setIsLiked] = useState(post.isLike);
	const [likeCount, setLikeCount] = useState(post.likeCnt);
	const [commentCount, setCommentCount] = useState(post.commentCnt);
	const [commentList, setCommentList] = useState<Comment[]>(post.comments);

	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState<number | null>(null);
	const [editContent, setEditContent] = useState("");

	// 드롭다운 외부 클릭 처리
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			let isOutsideClick = true;

			// 모든 드롭다운을 검사하여 클릭한 요소가 내부에 있는지 확인
			dropdownRef.current.forEach((ref) => {
				if (ref && ref.contains(event.target as Node)) {
					isOutsideClick = false;
				}
			});

			if (isOutsideClick) {
				setShowDropdown(false);
				setShowCommentDropdown(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const editInputRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				editInputRef.current &&
				!editInputRef.current.contains(event.target as Node)
			) {
				setIsEditing(null);
				setEditContent("");
			}
		};

		if (isEditing !== null) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isEditing]); // isEditing이 변경될 때마다 실행

	const handleLikeClick = async () => {
		try {
			isLiked
				? await boardService.deleteBoardLike(post.boardId)
				: await boardService.addBoardLike(post.boardId);
			setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
			setIsLiked(!isLiked);
		} catch (error) {
			console.error(error);
			toast.error("다시 시도해주세요.");
		}
	};

	const handleDeleteBoard = async (event: React.MouseEvent) => {
		event.stopPropagation();

		try {
			await boardService.deleteBoard(post.boardId);
			setShowDropdown(false);
			toast.success("게시글이 성공적으로 삭제 되었습니다.");
			navigate("/community");
		} catch (error) {
			console.error("게시글 삭제 오류:", error);
			toast.error("게시글 삭제를 실패했습니다.");
		}
	};

	const handleUpdateComment = async (commentId: number) => {
		if (isEditing === commentId) {
			// 수정 완료 → API 호출
			try {
				await boardService.updateComment(post.boardId, commentId, editContent);

				// 기존 댓글 리스트에서 수정된 댓글 업데이트
				setCommentList((prevComments) =>
					prevComments.map((comment) =>
						comment.commentId === commentId
							? { ...comment, content: editContent }
							: comment,
					),
				);

				toast.success("댓글이 수정되었습니다.");
				setIsEditing(null);
				setEditContent("");
			} catch (error: any) {
				toast.error(error.message);
			}
		} else {
			// 수정 시작
			setIsEditing(commentId);
			setEditContent(
				commentList.find((c) => c.commentId === commentId)?.content || "",
			);
		}
	};

	const handleDeleteComment = async (
		event: React.MouseEvent,
		commentId: number,
	) => {
		event.stopPropagation();

		try {
			await boardService.deleteComment(post.boardId, commentId);
			setShowCommentDropdown(commentId);
			setCommentList((preComments) =>
				preComments.filter((comment) => comment.commentId !== commentId),
			);
			setCommentCount(commentCount - 1);
			toast.success("댓글이 성공적으로 삭제 되었습니다.");
		} catch (error) {
			console.error("댓글 삭제 오류:", error);
			toast.error("댓글 삭제에 실패했습니다.");
		}
	};

	const handleAddComment = async () => {
		if (!newComment.trim()) {
			toast.error("댓글을 입력해주세요.");
			return;
		}

		try {
			const response = await boardService.writeComment(
				newComment,
				post.boardId,
			);

			const newCommentData: Comment = {
				commentId: response.commentId,
				nickname: response.nickname,
				profileImg: response.profileImg || "",
				content: response.content,
				createdAt: formatTimeAgo(new Date(response.createdAt).toISOString()), // 현재 시간
				isMyWrite: response.isMyWrite,
			};

			setCommentList((preComments) => [...preComments, newCommentData]);
			setCommentCount(commentCount + 1);

			// 댓글 입력창 초기화
			setNewComment("");
		} catch (error: any) {
			console.error("댓글 작성 오류:", error);
			toast.error(error.message);
		}
	};

	const handleEnterPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // 기본 줄바꿈 방지
			handleAddComment(); // 댓글 작성 실행
		}
	};

	const handleEnterEditPress = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
		commentId: number,
	) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // 기본 줄바꿈 방지
			handleUpdateComment(commentId); // 댓글 작성 실행
		}
	};

	return (
		<div className="bg-white rounded-xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
			<div className="flex justify mb-3">
				<button
					onClick={() => navigate("/community")}
					className="text-foreground text-sm sm:text-base"
				>
					← 목록으로
				</button>
			</div>
			{/* 게시글 헤더 */}
			<div className="flex justify-between items-start mb-4">
				<div className="flex flex-wrap items-center gap-2">
					{post.profileImg ? (
						<img
							src={post.profileImg}
							alt="프로필 이미지"
							className="w-[1.5rem] h-[1.5rem] min-w-[1.5rem] text-gray-500 rounded-full"
							onError={(e) => {
								e.currentTarget.onerror = null;
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						<Icon
							name="user"
							className="w-[1.5rem] h-[1.5rem] min-w-[1.5rem] text-gray-500 rounded-full"
						/>
					)}
					<span className="font-medium text-sm sm:text-base">
						{post.nickname}
					</span>
					<span className="text-gray-400">·</span>
					<span className="text-gray-600 text-sm sm:text-base">
						{post.category === "DAILY"
							? "일상글"
							: post.category === "QNA"
								? "간호지식 Q&A"
								: "이직 정보"}
					</span>
					<span className="text-gray-400">·</span>
					<span className="text-gray-400 text-sm sm:text-base">
						{formatTimeAgo(post.createdAt)}
					</span>
				</div>

				{/* 드롭다운 메뉴 */}
				{post.isMyWrite ? (
					<div className="relative" ref={(el) => (dropdownRef.current[0] = el)}>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setShowDropdown(!showDropdown);
							}}
							className="p-1 hover:bg-gray-100 rounded-full"
						>
							<BsThreeDotsVertical className="w-5 h-5 text-gray-500" />
						</button>

						{showDropdown && (
							<div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
								<button
									onClick={handleDeleteBoard}
									className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
								>
									삭제하기
								</button>
							</div>
						)}
					</div>
				) : (
					""
				)}
			</div>

			{/* 게시글 제목 */}
			<h1 className="text-base sm:text-xl lg:text-2xl font-bold mb-4 break-words">
				{post.title}
			</h1>

			{/* 게시글 내용 */}
			<p className="text-gray-800 mb-6 whitespace-pre-wrap break-words sm:text-base text-sm">
				{post.content}
			</p>

			{/* 게시글 이미지 */}
			{post.boardImgUrl && (
				<div className="mb-6">
					<img
						src={post.boardImgUrl}
						alt="게시글 이미지"
						className="rounded-lg w-full"
					/>
				</div>
			)}

			{/* 게시글 상호작용 */}
			<div className="flex items-center gap-4 text-gray-400 text-sm mb-8">
				<button
					onClick={handleLikeClick}
					className="flex items-center gap-1 transition-colors hover:text-primary-dark"
				>
					<Icon
						name={isLiked ? "heartFilled" : "heart"}
						size={24}
						className={
							isLiked
								? "text-primary-dark w-5 h-5 sm:w-7 sm:h-7"
								: "w-5 h-5 sm:w-7 sm:h-7"
						}
					/>
					<span className={isLiked ? "text-primary-dark" : ""}>
						{likeCount}
					</span>
				</button>
				<div className="flex items-center gap-1">
					<Icon name="message" className="w-5 h-5 sm:w-7 sm:h-7" />
					<span>{commentCount}</span>
				</div>
				<div className="flex items-center gap-1">
					<Icon name="eye" className="w-6 h-6 sm:w-8 sm:h-8" />
					<span>{post.viewCnt}</span>
				</div>
			</div>

			{/* 댓글 목록 */}
			<div className="mb-3 divide-y divide-gray-200">
				{commentList.length === 0 ? (
					<div className="py-4 text-center text-gray-400 sm:text-base text-sm">
						댓글이 없습니다.
					</div>
				) : (
					commentList.map((comment, index) => (
						<div key={comment.commentId} className="py-4 first:pt-0 last:pb-0">
							<div className="flex justify-between items-start">
								<div className="flex items-center gap-2">
									{comment.profileImg ? (
										<img
											src={comment.profileImg}
											alt="프로필 이미지"
											className="w-[1.125rem] h-[1.125rem] min-w-[1.125em] text-gray-500 rounded-full"
											onError={(e) => {
												e.currentTarget.onerror = null;
												e.currentTarget.style.display = "none";
											}}
										/>
									) : (
										<Icon
											name="user"
											className="w-[1.125rem] h-[1.125rem] min-w-[1.125em] text-gray-500 rounded-full"
										/>
									)}
									<span className="font-medium text-sm">
										{comment.nickname}
									</span>
									<span className="text-gray-400 text-sm">·</span>
									<span className="text-gray-400 text-sm">
										{formatTimeAgo(comment.createdAt)}
									</span>
								</div>

								{/* 댓글 드롭다운 */}
								{comment.isMyWrite ? (
									<div
										className="relative dropdown-container"
										ref={(el) => (dropdownRef.current[index] = el)}
									>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setShowCommentDropdown(
													showCommentDropdown === comment.commentId
														? null
														: comment.commentId,
												);
											}}
											className="p-1 hover:bg-gray-100 rounded-full"
										>
											<BsThreeDotsVertical className="w-4 h-4 text-gray-500" />
										</button>

										{showCommentDropdown === comment.commentId && (
											<div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleUpdateComment(comment.commentId);
													}}
													className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
												>
													수정하기
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteComment(e, comment.commentId);
													}}
													className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
												>
													삭제하기
												</button>
											</div>
										)}
									</div>
								) : (
									""
								)}
							</div>
							{isEditing === comment.commentId ? (
								<div className="mt-2" ref={editInputRef}>
									<textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										onKeyDown={(e) =>
											handleEnterEditPress(e, comment.commentId)
										}
										className="w-full p-2 border rounded resize-none h-[2rem] mb-2 text-sm"
									/>
									<div className="flex justify-end gap-2">
										<button
											onClick={() => {
												setIsEditing(null);
												setEditContent("");
											}}
											className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
										>
											취소
										</button>
										<button
											onClick={() => {
												handleUpdateComment(comment.commentId);
											}}
											className="px-3 py-1 text-xs text-white bg-primary hover:bg-primary-dark rounded"
										>
											완료
										</button>
									</div>
								</div>
							) : (
								<p className="text-gray-700 text-sm mt-2">{comment.content}</p>
							)}
						</div>
					))
				)}
			</div>

			{/* 댓글 작성 */}
			<div className="relative">
				<textarea
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					onKeyDown={handleEnterPress}
					placeholder="댓글을 입력해주세요."
					className="w-full p-4 border border-gray-200 rounded-lg resize-none h-24 sm:text-base text-xs"
				/>
				<button
					onClick={handleAddComment}
					className="absolute bottom-3 right-1.5 flex px-3 py-1 text-sm text-white bg-primary hover:bg-primary-dark rounded"
				>
					<FaArrowUpLong className="w-4 h-4 sm:hidden" />
					<span className="hidden sm:block">등록</span>
				</button>
			</div>
		</div>
	);
};

export default CommunityDetail;
