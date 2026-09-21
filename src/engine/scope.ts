/**
 * Scope identifiers used by the rules ("la présente sous-section", "la présente section"):
 *   "ORL/S2/SS1" = 2e partie, chapitre 3 (ORL), section 2, sous-section 1
 *   "P2C1/S8"    = 2e partie, chapitre 1, section 8
 */
export function scopeOf(
  part: string | null,
  chapter: string | null,
  section: string | null,
  subsection: string | null,
): string {
  const partNo = part?.startsWith('PREMIERE') ? 1 : 2;
  const chapterNo = chapter?.match(/^Chapitre (\d+)/)?.[1] ?? '0';
  let id = partNo === 2 && chapterNo === '3' ? 'ORL' : `P${partNo}C${chapterNo}`;
  const s = section?.match(/^Section (\d+)/)?.[1];
  if (s) id += `/S${s}`;
  const ss = subsection?.match(/^Sous-section (\d+)/)?.[1];
  if (ss) id += `/SS${ss}`;
  return id;
}

/** True if `scope` is `container` or lies inside it ("ORL/S2/SS1" is inside "ORL/S2"). */
export function inScope(scope: string, container: string): boolean {
  return scope === container || scope.startsWith(container + '/');
}
