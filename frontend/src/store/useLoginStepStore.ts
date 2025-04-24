import { create } from "zustand";

type LoginStep = "login" | "verify";

export const useLoginStepStore = create<{
  step: LoginStep;
  setStep: (step: LoginStep) => void;
}>((set) => ({
  step: "login",
  setStep: (step) => set({ step }),
}));
