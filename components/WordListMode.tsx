"use client";

import { useMemo, useState } from "react";
import { PART_OF_SPEECH_OPTIONS, PartOfSpeech, ProgressMap, Word, WordMeta } from "@/lib/types";

type Props = {
  words: Word[];
  customWords: Word[];
  progress: ProgressMap;
  onAddWord: (word: Word) => void;
  onDeleteWord: (id: string) => void;
  onUpdateMeta: (id: string, patch: WordMeta) => void;
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

const parseTags = (raw: string): string[] =>
  raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function EditableWordRow({
  word,
  status,
  isCustom,
  onDelete,
  onUpdateMeta,
}: {
  word: Word;
  status: string;
  isCustom: boolean;
  onDelete: () => void;
  onUpdateMeta: (patch: WordMeta) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pos, setPos] = useState<PartOfSpeech | "">(word.partOfSpeech ?? "");
  const [tagsInput, setTagsInput] = useState((word.tags ?? []).join(", "));

  const handleSave = () => {
    onUpdateMeta({
      partOfSpeech: pos || undefined,
      tags: parseTags(tagsInput),
    });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {word.en} <span className="text-slate-400 font-normal">— {word.ja}</span>
          </p>
          {word.example && <p className="text-xs text-slate-400">{word.example}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {word.partOfSpeech && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {word.partOfSpeech}
              </span>
            )}
            {(word.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[status]}`}>
            {statusLabel[status]}
          </span>
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            {editing ? "閉じる" : "編集"}
          </button>
          {isCustom && (
            <button onClick={onDelete} className="text-xs text-rose-500 hover:text-rose-700">
              削除
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value as PartOfSpeech | "")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          >
            <option value="">品詞を選択</option>
            {PART_OF_SPEECH_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="タグ（カンマ区切り）"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            保存
          </button>
        </div>
      )}
    </div>
  );
}

export default function WordListMode({
  words,
  customWords,
  progress,
  onAddWord,
  onDeleteWord,
  onUpdateMeta,
}: Props) {
  const [en, setEn] = useState("");
  const [ja, setJa] = useState("");
  const [example, setExample] = useState("");
  const [pos, setPos] = useState<PartOfSpeech | "">("");
  const [tagsInput, setTagsInput] = useState("");
  const [posFilter, setPosFilter] = useState<PartOfSpeech | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");

  const customIds = new Set(customWords.map((w) => w.id));

  const allTags = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => (w.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [words]);

  const filteredWords = words.filter((w) => {
    if (posFilter !== "all" && w.partOfSpeech !== posFilter) return false;
    if (tagFilter !== "all" && !(w.tags ?? []).includes(tagFilter)) return false;
    return true;
  });

  const handleAdd = () => {
    if (!en.trim() || !ja.trim()) return;
    onAddWord({
      id: `custom-${Date.now()}`,
      en: en.trim(),
      ja: ja.trim(),
      example: example.trim() || undefined,
      partOfSpeech: pos || undefined,
      tags: parseTags(tagsInput),
    });
    setEn("");
    setJa("");
    setExample("");
    setPos("");
    setTagsInput("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
        <h3 className="font-semibold mb-3">単語を追加</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value as PartOfSpeech | "")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
          >
            <option value="">品詞を選択（任意）</option>
            {PART_OF_SPEECH_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="タグ（カンマ区切り、任意）"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:bg-slate-800 dark:border-slate-600"
          />
        </div>
        <button
          onClick={handleAdd}
          className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          追加する
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-slate-400">絞り込み:</span>
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value as PartOfSpeech | "all")}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-600"
        >
          <option value="all">すべての品詞</option>
          {PART_OF_SPEECH_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-600"
        >
          <option value="all">すべてのタグ</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {filteredWords.map((word) => (
          <EditableWordRow
            key={word.id}
            word={word}
            status={progress[word.id]?.status ?? "new"}
            isCustom={customIds.has(word.id)}
            onDelete={() => onDeleteWord(word.id)}
            onUpdateMeta={(patch) => onUpdateMeta(word.id, patch)}
          />
        ))}
        {filteredWords.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">該当する単語がありません。</p>
        )}
      </div>
    </div>
  );
}
