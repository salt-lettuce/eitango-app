import { useEffect, useRef, useState } from "react";
import { ProgressMap, Word, WordMetaMap } from "./types";
import { isSupabaseConfigured, supabase } from "./supabase";
import { CloudData, fetchCloudData, mergeCloudData, pushCloudData } from "./sync";
import { saveCustomWords, saveProgress, saveWordMeta } from "./storage";

export type CloudSyncStatus = "signed-out" | "syncing" | "synced" | "error";

type Params = {
  /** True once local state has been hydrated from localStorage. */
  ready: boolean;
  customWords: Word[];
  progress: ProgressMap;
  wordMeta: WordMetaMap;
  onCustomWords: (words: Word[]) => void;
  onProgress: (progress: ProgressMap) => void;
  onWordMeta: (meta: WordMetaMap) => void;
};

type SyncPhase = "idle" | "syncing" | "synced" | "error";

const PUSH_DEBOUNCE_MS = 800;

export function useCloudSync({
  ready,
  customWords,
  progress,
  wordMeta,
  onCustomWords,
  onProgress,
  onWordMeta,
}: Params) {
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const [userId, setUserId] = useState<string | null>(null);
  const hasMergedRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLocalRef = useRef<CloudData>({ progress, customWords, wordMeta });

  useEffect(() => {
    latestLocalRef.current = { progress, customWords, wordMeta };
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // One-time merge of local + cloud data whenever a user signs in. Waits for
  // `ready` so it never runs before localStorage has been loaded into state
  // (otherwise it would merge against empty local data and overwrite disk
  // storage with cloud-only data).
  useEffect(() => {
    if (!userId) {
      hasMergedRef.current = false;
      return;
    }
    if (!ready || hasMergedRef.current) return;
    hasMergedRef.current = true;

    let cancelled = false;
    setPhase("syncing");

    (async () => {
      const remote = await fetchCloudData(userId);
      const local = latestLocalRef.current;
      const merged = remote ? mergeCloudData(local, remote) : local;
      if (cancelled) return;

      saveProgress(merged.progress);
      saveCustomWords(merged.customWords);
      saveWordMeta(merged.wordMeta);
      onProgress(merged.progress);
      onCustomWords(merged.customWords);
      onWordMeta(merged.wordMeta);

      await pushCloudData(userId, merged);
      if (!cancelled) setPhase("synced");
    })().catch(() => {
      if (!cancelled) setPhase("error");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ready]);

  // Push local changes to the cloud after the initial merge has happened.
  useEffect(() => {
    if (!userId || !hasMergedRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      setPhase("syncing");
      pushCloudData(userId, { progress, customWords, wordMeta })
        .then(() => setPhase("synced"))
        .catch(() => setPhase("error"));
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [userId, progress, customWords, wordMeta]);

  const status: CloudSyncStatus = !userId ? "signed-out" : phase === "idle" ? "syncing" : phase;

  return { status };
}
