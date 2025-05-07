import { create } from 'zustand';

interface RequestCountState {
  count: number;
  setCount: (count: number) => void;
}

export const useRequestCountStore = create<RequestCountState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
