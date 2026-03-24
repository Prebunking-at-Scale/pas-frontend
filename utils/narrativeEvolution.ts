export interface EvolutionEntry {
  date: Date | null;
  text: string;
}

/**
 * Parses the evolution_description field into structured entries.
 *
 * Format: entries separated by \n\n--{ISO timestamp}--\n\n
 * The first entry has no preceding timestamp (original description).
 */
export function parseEvolutionDescription(raw: string): EvolutionEntry[] {
  const parts = raw.split(/\n\n--(.+?)--\n\n/);
  const entries: EvolutionEntry[] = [];

  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i].trim();
    if (!trimmed) continue;

    if (i === 0) {
      // First part is always the original description (no timestamp)
      entries.push({ date: null, text: trimmed });
    } else if (i % 2 === 1) {
      // Odd indices are timestamps — pair with the next part
      const timestamp = new Date(trimmed);
      const text = parts[i + 1]?.trim() || '';
      if (text) {
        entries.push({ date: isNaN(timestamp.getTime()) ? null : timestamp, text });
      }
    }
    // Even indices > 0 are already consumed by the odd-index branch
  }

  return entries;
}
