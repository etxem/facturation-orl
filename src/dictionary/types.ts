/** Compact nomenclature dictionary (src/data/dictionary.json), loaded on demand. */

export interface DictSection {
  part: string | null;
  chapter: string | null;
  section: string | null;
  subsection: string | null;
  group: string | null;
  scope: string;
}

/** [code, official label, coefficient (null for fixed amounts), official tariff, PDF page, position, section index] */
export type DictCode = [string, string, number | null, number, number, string | null, number];

export interface DictRemark {
  /** Index in `sections`. */
  s: number;
  /** Remark number ("1", "2"…) or null for a single unnumbered remark. */
  n: string | null;
  t: string;
  /** PDF page. */
  p: number;
}

export interface DictArticle {
  id: string;
  title: string | null;
  paragraphs: string[];
  page: number;
}

export interface DictionaryData {
  version: string;
  pdfUrl: string;
  sections: DictSection[];
  codes: DictCode[];
  remarks: DictRemark[];
  articles: DictArticle[];
}
