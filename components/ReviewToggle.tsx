"use client";

type Props = {
  dueOnly: boolean;
  setDueOnly: (v: boolean) => void;
  dueCount: number;
  totalCount: number;
};

export default function ReviewToggle({ dueOnly, setDueOnly, dueCount, totalCount }: Props) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <span className="text-slate-500">
        今日の復習: <span className="font-semibold">{dueCount}</span> / {totalCount} 語
      </span>
      <button
        onClick={() => setDueOnly(!dueOnly)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
          dueOnly
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {dueOnly ? "復習対象のみ表示中" : "すべての単語を表示中"}
      </button>
    </div>
  );
}
