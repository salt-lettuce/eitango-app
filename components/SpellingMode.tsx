"use client";

import { useEffect, useRef, useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { recordAnswer } from "@/lib/storage";
import { useReviewDeck } from "@/lib/useReviewDeck";
import { maskWordInText } from "@/lib/maskWord";
import ReviewToggle from "@/components/ReviewToggle";
import SpeakButton from "@/components/SpeakButton";

type Props = {
  words: Word[];
  progress: ProgressMap;
  onProgressChange: (progress: ProgressMap) => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const normalize = (s: string) => s.trim().toLowerCase();

export default function SpellingMode({ words, progress, onProgressChange }: Props) {
  const { deck, dueOnly, setDueOnly, dueCount, totalCount } = useReviewDeck(words, progress);
  const [order, setOrder] = useState<Word[]>(() => shuffle(deck));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [session, setSession] = useState({ dueOnly, words });
  const inputRef = useRef<HTMLInputElement>(null);

  if (session.dueOnly !== dueOnly || session.words !== words) {
    setSession({ dueOnly, words });
    setOrder(shuffle(deck));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setResult(null);
    setInput("");
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, order]);

  const current = order[index];
  const finished = order.length > 0 && index >= order.length;

  const handleSubmit = () => {
    if (result !== null || !current) return;
    const correct = normalize(input) === normalize(current.en);
    setResult(correct ? "correct" : "wrong");
    const updated = recordAnswer(progress, current.id, correct);
    onProgressChange(updated);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const handleNext = () => {
    setResult(null);
    setInput("");
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setOrder(shuffle(deck));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setResult(null);
    setInput("");
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ReviewToggle
        dueOnly={dueOnly}
        setDueOnly={setDueOnly}
        dueCount={dueCount}
        totalCount={totalCount}
      />

      {deck.length === 0 && (
        <p className="text-slate-500">
          {dueOnly ? "今日復習が必要な単語はありません。" : "単語がありません。単語一覧タブから追加してください。"}
        </p>
      )}

      {deck.length > 0 && finished && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-semibold">
            結果: {score.correct} / {score.total} 問正解
          </p>
          <button
            onClick={restart}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            もう一度挑戦する
          </button>
        </div>
      )}

      {deck.length > 0 && !finished && current && (
        <>
          <p className="text-sm text-slate-500">
            {index + 1} / {order.length}
          </p>

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center dark:bg-slate-900 dark:border-slate-700">
            {current.partOfSpeech && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {current.partOfSpeech}
              </span>
            )}
            <p className="text-2xl font-semibold mt-2">{current.ja}</p>
            {current.example && (
              <p className="text-sm text-slate-400 italic mt-1">
                {result === null
                  ? maskWordInText(current.example, current.en)
                  : current.example}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">この意味の英単語をつづってください</p>
          </div>

          <div className="w-full max-w-md flex flex-col gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (result === null) handleSubmit();
                  else handleNext();
                }
              }}
              disabled={result !== null}
              placeholder="英単語を入力..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`w-full rounded-lg border px-4 py-3 text-lg text-center font-mono dark:bg-slate-800 ${
                result === "correct"
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                  : result === "wrong"
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950"
                    : "border-slate-300 dark:border-slate-600"
              }`}
            />

            {result !== null && (
              <div className="flex items-center justify-center gap-2 text-sm">
                {result === "correct" ? (
                  <span className="text-emerald-600 font-medium">正解！</span>
                ) : (
                  <span className="text-rose-600 font-medium">
                    不正解 — 正解は「{current.en}」
                  </span>
                )}
                <SpeakButton text={current.en} />
              </div>
            )}

            <button
              onClick={result === null ? handleSubmit : handleNext}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              {result === null ? "答え合わせ" : "次へ →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
