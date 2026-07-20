"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultWords } from "@/lib/wordData";
import {
  applyWordMeta,
  loadCustomWords,
  loadProgress,
  loadWordMeta,
  saveCustomWords,
  setWordMeta,
} from "@/lib/storage";
import { ProgressMap, Word, WordMeta, WordMetaMap } from "@/lib/types";
import FlashcardMode from "@/components/FlashcardMode";
import QuizMode from "@/components/QuizMode";
import SpellingMode from "@/components/SpellingMode";
import PronunciationMode from "@/components/PronunciationMode";
import WeakWordsMode from "@/components/WeakWordsMode";
import WordListMode from "@/components/WordListMode";
import ProgressStats from "@/components/ProgressStats";
import { getWeakWords } from "@/lib/storage";

type Tab = "flashcard" | "quiz" | "spelling" | "pronunciation" | "weak" | "list";

const tabs: { key: Tab; label: string }[] = [
  { key: "flashcard", label: "フラッシュカード" },
  { key: "quiz", label: "クイズ" },
  { key: "spelling", label: "スペル入力" },
  { key: "pronunciation", label: "発音チェック" },
  { key: "weak", label: "苦手克服" },
  { key: "list", label: "単語一覧" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("flashcard");
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [wordMeta, setWordMetaState] = useState<WordMetaMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustomWords(loadCustomWords());
    setProgress(loadProgress());
    setWordMetaState(loadWordMeta());
    setReady(true);
  }, []);

  const words = useMemo(
    () => applyWordMeta([...defaultWords, ...customWords], wordMeta),
    [customWords, wordMeta]
  );

  const weakCount = useMemo(() => getWeakWords(words, progress).length, [words, progress]);

  const handleUpdateMeta = (id: string, patch: WordMeta) => {
    setWordMetaState((prev) => setWordMeta(prev, id, patch));
  };

  const handleAddWord = (word: Word) => {
    const updated = [...customWords, word];
    setCustomWords(updated);
    saveCustomWords(updated);
  };

  const handleAddWords = (newWords: Word[]) => {
    const updated = [...customWords, ...newWords];
    setCustomWords(updated);
    saveCustomWords(updated);
  };

  const handleDeleteWord = (id: string) => {
    const updated = customWords.filter((w) => w.id !== id);
    setCustomWords(updated);
    saveCustomWords(updated);
  };

  if (!ready) return null;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">英単語暗記アプリ</h1>
        <p className="text-sm text-slate-500 mt-1">フラッシュカード・クイズ・スペル入力で単語を覚えよう</p>
      </header>

      <ProgressStats words={words} progress={progress} />

      <nav className="flex justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t.label}
            {t.key === "weak" && weakCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                {weakCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <section>
        {tab === "flashcard" && (
          <FlashcardMode words={words} progress={progress} onProgressChange={setProgress} />
        )}
        {tab === "quiz" && (
          <QuizMode words={words} progress={progress} onProgressChange={setProgress} />
        )}
        {tab === "spelling" && (
          <SpellingMode words={words} progress={progress} onProgressChange={setProgress} />
        )}
        {tab === "pronunciation" && (
          <PronunciationMode words={words} progress={progress} onProgressChange={setProgress} />
        )}
        {tab === "weak" && (
          <WeakWordsMode words={words} progress={progress} onProgressChange={setProgress} />
        )}
        {tab === "list" && (
          <WordListMode
            words={words}
            customWords={customWords}
            progress={progress}
            onAddWord={handleAddWord}
            onAddWords={handleAddWords}
            onDeleteWord={handleDeleteWord}
            onUpdateMeta={handleUpdateMeta}
          />
        )}
      </section>
    </main>
  );
}
