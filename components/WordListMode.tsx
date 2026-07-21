"use client";

import { useMemo, useState } from "react";
import { PART_OF_SPEECH_OPTIONS, PartOfSpeech, ProgressMap, Word, WordMeta } from "@/lib/types";
import { wordsFromCsvText } from "@/lib/csv";
import { nextReviewLabel } from "@/lib/storage";
import SpeakButton from "@/components/SpeakButton";

type Props = {
  words: Word[];
  customWords: Word[];
  progress: ProgressMap;
  onAddWord: (word: Word) => void;
  onAddWords: (words: Word[]) => void;
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
  reviewLabel,
  isCustom,
  onDelete,
  onUpdateMeta,
}: {
  word: Word;
  status: string;
  reviewLabel: string;
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
          <p className="font-medium flex items-center gap-1.5">
            {word.en}
            <SpeakButton text={word.en} className="text-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
            <span className="text-slate-400 font-normal">— {word.ja}</span>
          </p>
          {word.example && <p className="text-xs text-slate-400">{word.example}</p>}
          <p className="text-xs text-slate-400 mt-0.5">{reviewLabel}</p>
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
  onAddWords,
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
  const [csvText, setCsvText] = useState("");
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

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
      id: crypto.randomUUID(),
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

  const handleCsvImport = () => {
    const { words: imported, skipped } = wordsFromCsvText(csvText);
    if (imported.length === 0) {
      setCsvMessage("有効な行が見つかりませんでした。「英単語,意味」が入力されているか確認してください。");
      return;
    }
    onAddWords(imported);
    setCsvMessage(
      `${imported.length}件を追加しました${skipped > 0 ? `（${skipped}件はスキップされました）` : ""}。`
    );
    setCsvText("");
  };

  const handleCsvFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setCsvMessage(null);
    };
    reader.readAsText(file);
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
        <h3 className="font-semibold mb-1">CSVで一括追加</h3>
        <p className="text-xs text-slate-400 mb-3">
          1行1単語で「英単語,意味,例文,品詞,タグ」の順に入力してください（例文・品詞・タグは省略可、タグは
          <code className="mx-1">;</code>区切り）。1行目に見出し（en など）があっても自動でスキップされます。
        </p>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setCsvMessage(null);
          }}
          placeholder={"resilient,回復力のある,She showed a resilient attitude.,形容詞,性格;上級\nnegotiate,交渉する,,動詞,ビジネス"}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono dark:bg-slate-800 dark:border-slate-600"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm px-3 py-2 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
            CSVファイルを選択
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleCsvFile(e.target.files?.[0])}
            />
          </label>
          <button
            onClick={handleCsvImport}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            インポートする
          </button>
          {csvMessage && <span className="text-sm text-slate-500">{csvMessage}</span>}
        </div>
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
            reviewLabel={nextReviewLabel(progress, word.id)}
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
