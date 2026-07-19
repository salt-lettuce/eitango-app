import { ProgressMap, Word, WordMeta, WordMetaMap, WordProgress } from "./types";

const PROGRESS_KEY = "eitango:progress";
const CUSTOM_WORDS_KEY = "eitango:customWords";
const WORD_META_KEY = "eitango:wordMeta";

const emptyProgress = (): WordProgress => ({
  status: "new",
  correctCount: 0,
  wrongCount: 0,
  lastReviewed: null,
  box: 0,
  nextReviewAt: null,
});

/** Leitner box -> review interval in days. Box 0 is due immediately. */
const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getWordProgress(progress: ProgressMap, wordId: string): WordProgress {
  return { ...emptyProgress(), ...progress[wordId] };
}

export function recordAnswer(
  progress: ProgressMap,
  wordId: string,
  correct: boolean
): ProgressMap {
  const current = getWordProgress(progress, wordId);
  const correctCount = current.correctCount + (correct ? 1 : 0);
  const wrongCount = current.wrongCount + (correct ? 0 : 1);
  const box = correct ? Math.min(current.box + 1, MAX_BOX) : 0;
  const status: WordProgress["status"] = box >= MAX_BOX ? "known" : "learning";
  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + BOX_INTERVAL_DAYS[box] * 86_400_000).toISOString();

  const updated: ProgressMap = {
    ...progress,
    [wordId]: {
      status,
      correctCount,
      wrongCount,
      lastReviewed: now.toISOString(),
      box,
      nextReviewAt,
    },
  };
  saveProgress(updated);
  return updated;
}

/** Due words are new (never reviewed) or past their scheduled review date. */
export function isDue(progress: ProgressMap, wordId: string): boolean {
  const p = progress[wordId];
  if (!p || !p.nextReviewAt) return true;
  return new Date(p.nextReviewAt).getTime() <= Date.now();
}

export function getDueWords(words: Word[], progress: ProgressMap): Word[] {
  return words.filter((w) => isDue(progress, w.id));
}

export function nextReviewLabel(progress: ProgressMap, wordId: string): string {
  const p = progress[wordId];
  if (!p || !p.nextReviewAt) return "未学習";
  const diffDays = Math.ceil((new Date(p.nextReviewAt).getTime() - Date.now()) / 86_400_000);
  if (diffDays <= 0) return "復習可能";
  return `${diffDays}日後に復習`;
}

export function loadCustomWords(): Word[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_WORDS_KEY);
    return raw ? (JSON.parse(raw) as Word[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomWords(words: Word[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(words));
}

export function loadWordMeta(): WordMetaMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WORD_META_KEY);
    return raw ? (JSON.parse(raw) as WordMetaMap) : {};
  } catch {
    return {};
  }
}

export function saveWordMeta(meta: WordMetaMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORD_META_KEY, JSON.stringify(meta));
}

export function setWordMeta(meta: WordMetaMap, wordId: string, patch: WordMeta): WordMetaMap {
  const updated: WordMetaMap = {
    ...meta,
    [wordId]: { ...meta[wordId], ...patch },
  };
  saveWordMeta(updated);
  return updated;
}

export function applyWordMeta(words: Word[], meta: WordMetaMap): Word[] {
  return words.map((word) => {
    const override = meta[word.id];
    if (!override) return word;
    return {
      ...word,
      partOfSpeech: override.partOfSpeech ?? word.partOfSpeech,
      tags: override.tags ?? word.tags,
    };
  });
}
