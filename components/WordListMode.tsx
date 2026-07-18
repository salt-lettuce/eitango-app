"use client";

import { useState } from "react";
import { ProgressMap, Word } from "@/lib/types";

type Props = {
  words: Word[];
  customWords: Word[];
  progress: ProgressMap;
  onAddWord: (word: Word) => void;
  onDeleteWord: (id: string) => void;
};

const statusLabel: Record<string, string> = {
  new: "未学習",
  learning: "学習中",
  known: "習得済み",
};

const statusStyle: Record<string, string> = {
  new: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  learning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  known: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function WordListMode({ words, customWords, progress, onAddWord, onDeleteWord }: Props) {
  const [en, setEn] = useState("");
  const [ja, setJa] = useState("");
  const [example, setExample] = useState("");
  const customIds = new Set(customWords.map((w) => w.id));

  const handleAdd = () => {
    if (!en.trim() || !ja.trim()) return;
    onAddWord({
      id: `custom-${Date.now()}`,
      en: en.trim(),
      ja: ja.trim(),
      example: example.trim() || undefined,
    });
    setEn("");
    setJa("");
    setExample("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
        <h3 className="font-semibold mb-3">単語を追加</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            placeholder="英単語"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          />
          <input
            value={ja}
            onChange={(e) => setJa(e.target.value)}
            placeholder="意味"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          />
          <input
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="例文（任意）"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          />
        </div>
        <button
          onClick={handleAdd}
          className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          追加する
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {words.map((word) => {
          const status = progress[word.id]?.status ?? "new";
          return (
            <div
              key={word.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:bg-slate-900 dark:border-slate-700"
            >
              <div>
                <p className="font-medium">
                  {word.en} <span className="text-slate-400 font-normal">— {word.ja}</span>
                </p>
                {word.example && <p className="text-xs text-slate-400">{word.example}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[status]}`}>
                  {statusLabel[status]}
                </span>
                {customIds.has(word.id) && (
                  <button
                    onClick={() => onDeleteWord(word.id)}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
