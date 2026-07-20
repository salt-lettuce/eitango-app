"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { getWeakWords, recordAnswer } from "@/lib/storage";
import { maskWordInText } from "@/lib/maskWord";
import { playCorrectSound, playWrongSound } from "@/lib/sound";
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

export default function WeakWordsMode({ words, progress, onProgressChange }: Props) {
  const weakWords = useMemo(() => getWeakWords(words, progress), [words, progress]);
  const [practicing, setPracticing] = useState(false);
  const [order, setOrder] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (practicing) inputRef.current?.focus();
  }, [practicing, index]);

  const startPractice = () => {
    setOrder(shuffle(weakWords));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setResult(null);
    setInput("");
    setPracticing(true);
  };

  const current = order[index];
  const finished = order.length > 0 && index >= order.length;

  const handleSubmit = () => {
    if (result !== null || !current) return;
    const correct = normalize(input) === normalize(current.en);
    setResult(correct ? "correct" : "wrong");
    const updated = recordAnswer(progress, current.id, correct);
    onProgressChange(updated);
    if (correct) playCorrectSound();
    else playWrongSound();
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const handleNext = () => {
    setResult(null);
    setInput("");
    setIndex((i) => i + 1);
  };

  if (!practicing) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
          <p className="text-sm text-slate-500">
            間違えた回数が多く、正答率が低い単語を自動でリストアップします。
          </p>
        </div>

        {weakWords.length === 0 ? (
          <p className="text-slate-500">
            苦手な単語はまだありません。クイズやスペル入力を続けると、間違いが多い単語がここに表示されます。
          </p>
        ) : (
          <>
            <ul className="w-full max-w-md flex flex-col gap-2">
              {weakWords.map((w) => {
                const p = progress[w.id];
                return (
                  <li
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{w.en}</span>
                      <SpeakButton text={w.en} />
                      <span className="text-sm text-slate-500">{w.ja}</span>
                    </div>
                    <span className="text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      ✗ {p.wrongCount} / {p.correctCount + p.wrongCount}
                    </span>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={startPractice}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              苦手単語を集中特訓する（{weakWords.length}語）
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {finished ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-semibold">
            結果: {score.correct} / {score.total} 問正解
          </p>
          <div className="flex gap-3">
            <button
              onClick={startPractice}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              もう一度挑戦する
            </button>
            <button
              onClick={() => setPracticing(false)}
              className="px-5 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              一覧に戻る
            </button>
          </div>
        </div>
      ) : (
        current && (
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
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950 anim-correct"
                    : result === "wrong"
                      ? "border-rose-400 bg-rose-50 dark:bg-rose-950 anim-wrong"
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
        )
      )}
    </div>
  );
}
