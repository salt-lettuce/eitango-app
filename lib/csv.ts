import { PART_OF_SPEECH_OPTIONS, PartOfSpeech, Word } from "./types";

const HEADER_KEYWORDS = new Set(["en", "english", "英単語", "単語"]);

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function normalizePartOfSpeech(raw: string): PartOfSpeech | undefined {
  const trimmed = raw.trim();
  return (PART_OF_SPEECH_OPTIONS as readonly string[]).includes(trimmed)
    ? (trimmed as PartOfSpeech)
    : undefined;
}

export type CsvImportResult = {
  words: Word[];
  skipped: number;
};

export function wordsFromCsvText(text: string): CsvImportResult {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return { words: [], skipped: 0 };

  const firstCell = rows[0][0]?.trim().toLowerCase() ?? "";
  const startIndex = HEADER_KEYWORDS.has(firstCell) ? 1 : 0;

  const words: Word[] = [];
  let skipped = 0;
  const now = Date.now();

  for (let i = startIndex; i < rows.length; i++) {
    const [en = "", ja = "", example = "", partOfSpeech = "", tags = ""] = rows[i];
    const enTrimmed = en.trim();
    const jaTrimmed = ja.trim();
    if (!enTrimmed || !jaTrimmed) {
      skipped++;
      continue;
    }
    words.push({
      id: `custom-${now}-${i}`,
      en: enTrimmed,
      ja: jaTrimmed,
      example: example.trim() || undefined,
      partOfSpeech: normalizePartOfSpeech(partOfSpeech),
      tags: tags
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return { words, skipped };
}
