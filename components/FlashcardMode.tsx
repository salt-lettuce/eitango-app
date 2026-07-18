"use client";

import { useMemo, useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { recordAnswer } from "@/lib/storage";

type Props = {
  words: Word[];
  progress: ProgressMap;
  onProgressChange: (progress: ProgressMap) => void;
};

export default function FlashcardMode({ words, progress, onProgressChange }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(() => words, [words]);
  const word = deck[index % deck.length];

  if (deck.length === 0) {
    return <p className="text-slate-500">単語がありません。単語一覧タブから追加してください。</p>;
  }

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
      <p className="text-sm text-slate-500">
        {index + 1} / {deck.length}
      </p>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full max-w-md h-56 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-3 p-6 text-center transition hover:shadow-md dark:bg-slate-900 dark:border-slate-700"
      >
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
      </button>

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
    </div>
  );
}
