import { ProgressMap, Word, WordMeta, WordMetaMap, WordProgress } from "./types";

const PROGRESS_KEY = "eitango:progress";
const CUSTOM_WORDS_KEY = "eitango:customWords";
const WORD_META_KEY = "eitango:wordMeta";

const emptyProgress = (): WordProgress => ({
  status: "new",
  correctCount: 0,
  wrongCount: 0,
  lastReviewed: null,
});

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
  return progress[wordId] ?? emptyProgress();
}

export function recordAnswer(
  progress: ProgressMap,
  wordId: string,
  correct: boolean
): ProgressMap {
  const current = getWordProgress(progress, wordId);
  const correctCount = current.correctCount + (correct ? 1 : 0);
  const wrongCount = current.wrongCount + (correct ? 0 : 1);
  let status: WordProgress["status"] = current.status;
  if (correct) {
    status = correctCount >= 3 ? "known" : "learning";
  } else {
    status = "learning";
  }
  const updated: ProgressMap = {
    ...progress,
    [wordId]: {
      status,
      correctCount,
      wrongCount,
      lastReviewed: new Date().toISOString(),
    },
  };
  saveProgress(updated);
  return updated;
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
