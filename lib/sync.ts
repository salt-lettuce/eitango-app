import { supabase } from "./supabase";
import { ProgressMap, Word, WordMetaMap } from "./types";

export type CloudData = {
  progress: ProgressMap;
  customWords: Word[];
  wordMeta: WordMetaMap;
};

const TABLE = "user_data";

function mergeProgress(local: ProgressMap, remote: ProgressMap): ProgressMap {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const merged: ProgressMap = {};
  for (const id of ids) {
    const l = local[id];
    const r = remote[id];
    if (!l) {
      merged[id] = r;
      continue;
    }
    if (!r) {
      merged[id] = l;
      continue;
    }
    const lTime = l.lastReviewed ? new Date(l.lastReviewed).getTime() : -1;
    const rTime = r.lastReviewed ? new Date(r.lastReviewed).getTime() : -1;
    merged[id] = rTime > lTime ? r : l;
  }
  return merged;
}

function mergeCustomWords(local: Word[], remote: Word[]): Word[] {
  const byId = new Map<string, Word>();
  for (const w of local) byId.set(w.id, w);
  for (const w of remote) byId.set(w.id, w);
  return Array.from(byId.values());
}

/**
 * Merges two devices' data: per word, whichever side reviewed it more
 * recently wins (so a stale device can't clobber newer progress); custom
 * words are unioned by id; word metadata is a shallow merge, remote wins.
 */
export function mergeCloudData(local: CloudData, remote: CloudData): CloudData {
  return {
    progress: mergeProgress(local.progress, remote.progress),
    customWords: mergeCustomWords(local.customWords, remote.customWords),
    wordMeta: { ...local.wordMeta, ...remote.wordMeta },
  };
}

export async function fetchCloudData(userId: string): Promise<CloudData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("progress, custom_words, word_meta")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    progress: (data.progress as ProgressMap) ?? {},
    customWords: (data.custom_words as Word[]) ?? [],
    wordMeta: (data.word_meta as WordMetaMap) ?? {},
  };
}

export async function pushCloudData(userId: string, data: CloudData): Promise<void> {
  if (!supabase) return;
  await supabase.from(TABLE).upsert({
    user_id: userId,
    progress: data.progress,
    custom_words: data.customWords,
    word_meta: data.wordMeta,
    updated_at: new Date().toISOString(),
  });
}
