type SpeechRecognitionResultLike = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionErrorLike = {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

/** Listens for a single utterance and resolves with the recognized transcript. */
export function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      reject(new Error("unsupported"));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let settled = false;

    recognition.onresult = (event) => {
      settled = true;
      resolve(event.results[0]?.[0]?.transcript ?? "");
    };
    recognition.onerror = (event) => {
      if (settled) return;
      settled = true;
      reject(new Error(event.error || "speech-recognition-error"));
    };
    recognition.onend = () => {
      if (!settled) {
        settled = true;
        reject(new Error("no-speech"));
      }
    };

    recognition.start();
  });
}
