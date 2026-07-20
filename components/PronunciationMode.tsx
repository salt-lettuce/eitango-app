"use client";

import { useState } from "react";
import { ProgressMap, Word } from "@/lib/types";
import { recordAnswer } from "@/lib/storage";
import { useReviewDeck } from "@/lib/useReviewDeck";
import { maskWordInText } from "@/lib/maskWord";
import { playCorrectSound, playWrongSound } from "@/lib/sound";
import { isSpeechRecognitionSupported, listenOnce } from "@/lib/speechRecognition";
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

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[.,!?]/g, "");

function isMatch(transcript: string, target: string): boolean {
  const normTranscript = normalize(transcript);
  const normTarget = normalize(target);
  if (normTranscript === normTarget) return true;
  return normTranscript.split(/\s+/).includes(normTarget);
}

export default function PronunciationMode({ words, progress, onProgressChange }: Props) {
  const { deck, dueOnly, setDueOnly, dueCount, totalCount } = useReviewDeck(words, progress);
  const [order, setOrder] = useState<Word[]>(() => shuffle(deck));
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "listening" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [session, setSession] = useState({ dueOnly, words });

  if (session.dueOnly !== dueOnly || session.words !== words) {
    setSession({ dueOnly, words });
    setOrder(shuffle(deck));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setResult(null);
    setTranscript("");
    setStatus("idle");
    setErrorMessage("");
  }

  const supported = isSpeechRecognitionSupported();
  const current = order[index];
  const finished = order.length > 0 && index >= order.length;

  const handleListen = async () => {
    if (!current || status === "listening") return;
    setStatus("listening");
    setErrorMessage("");
    try {
      const heard = await listenOnce();
      setTranscript(heard);
      const correct = isMatch(heard, current.en);
      setResult(correct ? "correct" : "wrong");
      const updated = recordAnswer(progress, current.id, correct);
      onProgressChange(updated);
      if (correct) playCorrectSound();
      else playWrongSound();
      setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      const message = e instanceof Error ? e.message : "unknown-error";
      setErrorMessage(
        message === "not-allowed"
          ? "マイクの使用が許可されていません。ブラウザの設定を確認してください。"
          : message === "no-speech"
            ? "音声が聞き取れませんでした。もう一度お試しください。"
            : "音声認識でエラーが発生しました。もう一度お試しください。"
      );
    }
  };

  const handleNext = () => {
    setResult(null);
    setTranscript("");
    setStatus("idle");
    setErrorMessage("");
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setOrder(shuffle(deck));
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setResult(null);
    setTranscript("");
    setStatus("idle");
    setErrorMessage("");
  };

  if (!supported) {
    return (
      <p className="text-slate-500">
        お使いのブラウザは音声認識に対応していません。Chrome や Edge でお試しください。
      </p>
    );
  }

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

          <div
            className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center dark:bg-slate-900 dark:border-slate-700 ${
              result === "correct" ? "anim-correct border-emerald-400" : ""
            } ${result === "wrong" ? "anim-wrong border-rose-400" : ""}`}
          >
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
            <p className="text-xs text-slate-400 mt-2">この意味の英単語を声に出して発音してください</p>
          </div>

          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <button
              onClick={handleListen}
              disabled={status === "listening" || result !== null}
              className={`w-20 h-20 rounded-full text-3xl flex items-center justify-center transition disabled:opacity-50 ${
                status === "listening"
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
              aria-label="発音を録音"
            >
              🎤
            </button>
            <p className="text-xs text-slate-400">
              {status === "listening" ? "聞き取り中..." : result === null ? "タップして発音" : ""}
            </p>

            {status === "error" && <p className="text-sm text-rose-600">{errorMessage}</p>}

            {result !== null && (
              <div className="flex flex-col items-center gap-2 text-sm">
                <p className="text-slate-500">聞き取った内容: 「{transcript || "(なし)"}」</p>
                {result === "correct" ? (
                  <span className="text-emerald-600 font-medium">正解！</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-medium">
                      不正解 — 正解は「{current.en}」
                    </span>
                    <SpeakButton text={current.en} />
                  </div>
                )}
              </div>
            )}

            {result !== null && (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                次へ →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
