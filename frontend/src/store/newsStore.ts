import { create } from "zustand";
import { boardService, NewsResponse } from "../services/boardService";

interface NewsState {
	newsies: NewsResponse[];
	fetchNewsies: () => void;
}

export const useNewsStore = create<NewsState>((set) => ({
	newsies: [],
	fetchNewsies: async () => {
		try {
			const data = await new Promise<NewsResponse[]>((resolve, reject) => {
				boardService.getNews(
					(data) => resolve(data),
					(error) => reject(error),
				);
			});
			set({ newsies: data });
		} catch (error) {
			console.error(error);
		}
	},
}));
