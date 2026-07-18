export type Word = {
  id: string;
  en: string;
  ja: string;
  example?: string;
};

export type MasteryStatus = "new" | "learning" | "known";

export type WordProgress = {
  status: MasteryStatus;
  correctCount: number;
  wrongCount: number;
  lastReviewed: string | null;
};

export type ProgressMap = Record<string, WordProgress>;
