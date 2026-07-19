"use client";

import { useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { recordAnswer } from "@/lib/storage";
import { useReviewDeck } from "@/lib/useReviewDeck";
import ReviewToggle from "@/components/ReviewToggle";
import SpeakButton from "@/components/SpeakButton";

type Props = {
  words: Word[];
  progress: ProgressMap;
  onProgressChange: (progress: ProgressMap) => void;
};

export default function FlashcardMode({ words, progress, onProgressChange }: Props) {
  const { deck, dueOnly, setDueOnly, dueCount, totalCount } = useReviewDeck(words, progress);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [prevDueOnly, setPrevDueOnly] = useState(dueOnly);

  if (prevDueOnly !== dueOnly) {
    setPrevDueOnly(dueOnly);
    setIndex(0);
    setFlipped(false);
  }

  const word = deck[index % Math.max(deck.length, 1)];

  const goNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % deck.length);
  };

  const handleAnswer = (correct: boolean) => {
    const updated = recordAnswer(progress, word.id, correct);
    onProgressChange(updated);
    goNext();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ReviewToggle
        dueOnly={dueOnly}
        setDueOnly={setDueOnly}
        dueCount={dueCount}
        totalCount={totalCount}
      />

      {deck.length === 0 ? (
        <p className="text-slate-500">
          {dueOnly
            ? "今日復習が必要な単語はありません。"
            : "単語がありません。単語一覧タブから追加してください。"}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {index + 1} / {deck.length}
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f);
            }}
            className="relative w-full max-w-md h-56 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-3 p-6 text-center transition hover:shadow-md cursor-pointer dark:bg-slate-900 dark:border-slate-700"
          >
            <div className="absolute top-3 right-3">
              <SpeakButton text={word.en} />
            </div>
            {word.partOfSpeech && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {word.partOfSpeech}
              </span>
            )}
            {!flipped ? (
              <span className="text-3xl font-semibold">{word.en}</span>
            ) : (
              <>
                <span className="text-2xl font-semibold">{word.ja}</span>
                {word.example && (
                  <span className="text-sm text-slate-500 italic">{word.example}</span>
                )}
              </>
            )}
            <span className="text-xs text-slate-400 mt-2">
              {flipped ? "タップして単語を表示" : "タップして意味を表示"}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(false)}
              className="px-5 py-2 rounded-lg bg-rose-100 text-rose-700 font-medium hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
            >
              もう一度
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="px-5 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
            >
              覚えた
            </button>
          </div>

          <button onClick={goNext} className="text-sm text-slate-400 hover:text-slate-600">
            スキップ →
          </button>
        </>
      )}
    </div>
  );
}
