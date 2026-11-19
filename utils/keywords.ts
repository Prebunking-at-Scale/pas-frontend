// Keywords as typed in the keyword filter (docs/filters.md, "Keywords"): each one is a
// phrase, spaces included ("climate change" is one keyword), finished with Enter.

/** Trims and collapses spaces: "  climate   change " -> "climate change". */
export const cleanKeyword = (keyword: string) => keyword.trim().replace(/\s+/g, ' ')

/** How keywords compare: ignoring case, accents and hyphens ("Climate-change" = "climate change"). */
export const keywordKey = (keyword: string) =>
  cleanKeyword(keyword.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[-‐‑–—]/g, ' ')).toLowerCase()

/** Adds keywords to a list, keeping its order and skipping empty ones and duplicates. */
export const mergeKeywords = (current: string[], added: string[]) => {
  const seen = new Set(current.map(keywordKey))
  const merged = [...current]
  for (const keyword of added.map(cleanKeyword)) {
    const key = keywordKey(keyword)
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(keyword)
  }
  return merged
}

/** One keyword per line of pasted text, or null when it's a single line (typed as usual). */
export const keywordsFromPaste = (text: string) => {
  const lines = text.split(/\r?\n/).map(cleanKeyword).filter(Boolean)
  return lines.length > 1 ? lines : null
}
