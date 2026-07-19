import { useMemo, useState } from "react";
import { ProgressMap, Word } from "./types";
import { getDueWords } from "./storage";

export function useReviewDeck(words: Word[], progress: ProgressMap) {
  const [dueOnly, setDueOnly] = useState(true);
  const dueWords = useMemo(() => getDueWords(words, progress), [words, progress]);
  const deck = dueOnly ? dueWords : words;
  return { deck, dueOnly, setDueOnly, dueCount: dueWords.length, totalCount: words.length };
}
