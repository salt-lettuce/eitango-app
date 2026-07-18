"use client";

import { useEffect, useMemo, useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { recordAnswer } from "@/lib/storage";

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

function buildQuestion(words: Word[], word: Word) {
  const distractors = shuffle(words.filter((w) => w.id !== word.id)).slice(0, 3);
  const options = shuffle([word, ...distractors]);
  return options;
}

export default function QuizMode({ words, progress, onProgressChange }: Props) {
  const [order, setOrder] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<Word[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setOrder(shuffle(words));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
  }, [words]);

  const current = order[index];

  useEffect(() => {
    if (current) {
      setOptions(buildQuestion(words, current));
      setSelected(null);
    }
  }, [current, words]);

  const finished = order.length > 0 && index >= order.length;

  if (words.length < 4) {
    return <p className="text-slate-500">クイズには最低4つの単語が必要です。単語を追加してください。</p>;
  }

  if (order.length === 0) {
    return null;
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-semibold">
          結果: {score.correct} / {score.total} 問正解
        </p>
        <button
          onClick={() => {
            setOrder(shuffle(words));
            setIndex(0);
            setScore({ correct: 0, total: 0 });
          }}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          もう一度挑戦する
        </button>
      </div>
    );
  }

  const handleSelect = (option: Word) => {
    if (selected) return;
    setSelected(option.id);
    const correct = option.id === current.id;
    const updated = recordAnswer(progress, current.id, correct);
    onProgressChange(updated);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => setIndex((i) => i + 1), 700);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-slate-500">
        {index + 1} / {order.length}
      </p>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center dark:bg-slate-900 dark:border-slate-700">
        <p className="text-3xl font-semibold">{current.en}</p>
        <p className="text-xs text-slate-400 mt-2">この単語の意味は?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const isCorrectOption = option.id === current.id;
          let style = "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700";
          if (selected) {
            if (isCorrectOption) style = "bg-emerald-100 border-emerald-400 dark:bg-emerald-950";
            else if (isSelected) style = "bg-rose-100 border-rose-400 dark:bg-rose-950";
          }
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`px-4 py-3 rounded-lg border text-left font-medium transition ${style}`}
            >
              {option.ja}
            </button>
          );
        })}
      </div>
    </div>
  );
}
