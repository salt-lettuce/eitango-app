import { ProgressMap, Word } from "@/lib/types";

type Props = {
  words: Word[];
  progress: ProgressMap;
};

export default function ProgressStats({ words, progress }: Props) {
  const total = words.length;
  const known = words.filter((w) => progress[w.id]?.status === "known").length;
  const learning = words.filter((w) => progress[w.id]?.status === "learning").length;
  const pct = total === 0 ? 0 : Math.round((known / total) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">習得率</span>
        <span className="text-sm text-slate-500">
          {known} / {total} 語（学習中 {learning}）
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
