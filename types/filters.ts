/** Shared shapes for the filter controls under `components/filters/`. */

/**
 * An inclusive day range in `YYYY-MM-DD` form. Either end may be null, filtering on one
 * side only. Bare days rather than instants because that is what the picker edits;
 * `startOfDayISO`/`endOfDayISO` convert at the call site.
 */
export interface DateRange {
  start: string | null;
  end: string | null;
}
