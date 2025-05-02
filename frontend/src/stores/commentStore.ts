import { create } from "zustand";

export interface Comment {
	commentId: number;
	nickname: string;
	profileImg: string;
	createdAt: string;
	content: string;
	isMyWrite: boolean;
}

interface CommentStore {
	editedComments: Record<number, string>;
	setEditedComment: (commentId: number, content: string) => void;
	resetEditedComment: (commentId: number) => void;
	getEditedContent: (commentId: number, originalContent: string) => string;
}

const useCommentStore = create<CommentStore>((set, get) => ({
	editedComments: {},
	setEditedComment: (commentId, content) =>
		set((state) => ({
			editedComments: {
				...state.editedComments,
				[commentId]: content,
			},
		})),
	resetEditedComment: (commentId) =>
		set((state) => {
			const newEditedComments = { ...state.editedComments };
			delete newEditedComments[commentId];
			return { editedComments: newEditedComments };
		}),
	getEditedContent: (commentId, originalContent) =>
		get().editedComments[commentId] ?? originalContent,
}));

export default useCommentStore;
