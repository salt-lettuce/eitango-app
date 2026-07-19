function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces occurrences of `word` (and simple inflections like -ed/-ing/-s,
 * e.g. "achieve" -> "achieved") in `text` with underscores, so example
 * sentences don't give away the answer in spelling practice.
 */
export function maskWordInText(text: string, word: string): string {
  if (!text || !word) return text;
  const stem = word.length > 3 && /e$/i.test(word) ? word.slice(0, -1) : word;
  const pattern = new RegExp(`\\b${escapeRegExp(stem)}\\w*`, "gi");
  return text.replace(pattern, (match) => "_".repeat(match.length));
}
