export const PART_OF_SPEECH_OPTIONS = [
  "名詞",
  "動詞",
  "形容詞",
  "副詞",
  "前置詞",
  "接続詞",
  "その他",
] as const;

export type PartOfSpeech = (typeof PART_OF_SPEECH_OPTIONS)[number];

export type Word = {
  id: string;
  en: string;
  ja: string;
  example?: string;
  partOfSpeech?: PartOfSpeech;
  tags?: string[];
};

export type WordMeta = {
  partOfSpeech?: PartOfSpeech;
  tags?: string[];
};

export type WordMetaMap = Record<string, WordMeta>;

export type MasteryStatus = "new" | "learning" | "known";

export type WordProgress = {
  status: MasteryStatus;
  correctCount: number;
  wrongCount: number;
  lastReviewed: string | null;
  /** Leitner box (0-5). Higher box = longer review interval. */
  box: number;
  /** ISO date string for the next scheduled review, or null if due immediately. */
  nextReviewAt: string | null;
};

export type ProgressMap = Record<string, WordProgress>;
