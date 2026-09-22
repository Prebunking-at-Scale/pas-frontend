/**
 * Dates on a Chart.js time axis.
 *
 * The evolution chart places each point at its date rather than spacing labels evenly,
 * so a gap between two days of data shows as a gap. That only holds if every date
 * becomes the right instant and every tick label names the right day, which is what
 * these helpers are for.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Ticks at least this far apart are labelled by month, without a day. */
export const MONTH_TICK_MS = 28 * DAY_MS;

/**
 * Timestamp of local midnight for a date, or null when it cannot be read.
 *
 * Day ticks on a time scale sit on local midnight, so a bare `YYYY-MM-DD` has to be
 * read as a local date: `new Date('2026-09-09')` parses as UTC and lands on the
 * previous evening anywhere west of Greenwich. Full timestamps are truncated to the
 * local day they fall on.
 */
export function dayTimestamp(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateString);
  if (isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Full date for a tooltip title: "Sep 9, 2026", "9. Sept. 2026". */
export function formatDayLong(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(timestamp));
}

/**
 * Tick label, with precision taken from the spacing between ticks.
 *
 * Formatted with Intl rather than date-fns display formats, which would need a date-fns
 * locale bundle per language. Ticks a month or more apart drop the day: they fall on the
 * first of the month, and a lone "1" reads as a data point on that day.
 */
export function formatTimeTick(timestamp: number, tickSpacingMs: number, locale: string): string {
  const format: Intl.DateTimeFormatOptions = tickSpacingMs >= MONTH_TICK_MS
    ? { month: 'short', year: 'numeric' }
    : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat(locale, format).format(new Date(timestamp));
}
