// import Signup from "@/pages/Signup";
import axiosInstance from "../lib/axios";
import axios from "axios";

// Response Types
export interface AllPostResponse {
	boardId: number;
	nickname: string;
	profileImg: string | null;
	title: string;
	content: string;
	boardImgUrl: string | null;
	category: string;
	createdAt: string;
	viewCnt: number;
	likeCnt: number;
	commentCnt: number;
}

export interface BoardImgResponse {
	boardImgUrl: string;
}

export interface BoardRequest {
	category: string;
	title: string;
	content: string;
	boardImgUrl: string;
}

export interface NewsResponse {
	title: string;
	description: string;
	link: string;
}

export interface RecommendedPost {
	boardId: number;
	title: string;
}

export interface RecommendedPostsResponse {
	boardList: RecommendedPost[];
}

export interface ApiErrorResponse {
	message: string;
	timestamp: string;
	status: string;
}

// API Functions
export const boardService = {
	/**
	 * 전체 게시판 조회
	 * @param code - 카테고리
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	getAllPosts: async (
		category: string,
		success: (data: AllPostResponse[]) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		return axiosInstance
			.get(`/board`, {
				params: { category },
			})
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},

	/**
	 * 게시글 이미지 업로드
	 * @param file - 이미지 파일
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	uploadBoardImage: async (
		file: File,
		success: (data: BoardImgResponse) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		const formData = new FormData();
		formData.append("file", file);

		return axiosInstance
			.post(`/board/image`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			})
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},

	/**
	 * 게시글 작성
	 * @param formData
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	writePost: async (
		formData: BoardRequest,
		success: (data: BoardImgResponse) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		return axiosInstance
			.post(`/board`, formData)
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},

	/**
	 * 게시글 하나 조회
	 * @param boardId
	 * @returns
	 */
	getSinglePosts: async (boardId: number) => {
		return axiosInstance
			.get(`/board/${boardId}`)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	/**
	 *  게시글 삭제하기기
	 * @param boardId
	 * @returns
	 */
	deleteBoard: async (boardId: number) => {
		return axiosInstance
			.delete(`/board/${boardId}`)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	/**
	 * 댓글 작성하기기
	 * @param contents
	 * @param boardId
	 * @returns
	 */
	writeComment: async (contents: string, boardId: number) => {
		return axiosInstance
			.post(`/board/${boardId}/comment`, { content: contents })
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	/**
	 * 댓글 삭제하기기
	 * @param boardId
	 * @param commentId
	 * @returns
	 */
	deleteComment: async (boardId: number, commentId: number) => {
		return axiosInstance
			.delete(`/board/${boardId}/comment/${commentId}`)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	updateComment: async (
		boardId: number,
		commentId: number,
		content: string,
	) => {
		return axiosInstance
			.put(`/board/${boardId}/comment/${commentId}`, { content: content })
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	addBoardLike: async (boardId: number) => {
		return axiosInstance
			.post(`/board/${boardId}/like`)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	deleteBoardLike: async (boardId: number) => {
		return axiosInstance
			.delete(`/board/${boardId}/like`)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					throw error.response?.data;
				}
				if (error.response) {
					switch (error.response.status) {
						case 401:
							window.location.href = "/login";
							break;
						default:
							throw error;
					}
				}
				throw error;
			});
	},

	/**
	 * 뉴스 조회회
	 * @param code - 카테고리
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	getNews: async (
		success: (data: NewsResponse[]) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		return axiosInstance
			.get(`/news`)
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},

	/**
	 * 추천 게시글 조회
	 * @param code - 카테고리
	 * @param success - 성공 시 콜백 함수
	 * @param fail - 실패 시 콜백 함수
	 */
	getRecommendedPosts: async (
		success: (data: RecommendedPostsResponse) => void,
		fail: (error: ApiErrorResponse) => void,
	) => {
		return axiosInstance
			.get(`/board/recommend`)
			.then((response) => {
				success(response.data);
			})
			.catch((error) => {
				if (axios.isAxiosError(error)) {
					fail(error.response?.data);
				}
				throw error;
			});
	},
};

export default boardService;
