"use client";

import { speak } from "@/lib/speech";

type Props = {
  text: string;
  className?: string;
};

export default function SpeakButton({ text, className }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`${text} を発音`}
      title="発音を再生"
      className={
        className ??
        "text-lg leading-none text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      }
    >
      🔊
    </button>
  );
}
