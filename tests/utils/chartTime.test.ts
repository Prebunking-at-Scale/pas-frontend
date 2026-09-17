/**
 * The evolution chart's x-axis is a time scale: each point sits at its date, so uneven
 * gaps between days of data show as uneven gaps. These pin down the two ways that can
 * quietly go wrong — a date landing on the wrong day, and a tick label naming a day
 * the tick is not on.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DAY_MS, MONTH_TICK_MS, dayTimestamp, formatDayLong, formatTimeTick } from '~/utils/chartTime';

const LOCALES = ['en', 'de', 'fr', 'es'];

/**
 * Runs a block of tests under a given timezone. Node re-reads process.env.TZ when it is
 * assigned, so local-time Date methods follow it.
 */
function inTimezone(tz: string, body: () => void) {
  describe(`in ${tz}`, () => {
    const original = process.env.TZ;
    beforeAll(() => { process.env.TZ = tz; });
    afterAll(() => {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    });
    body();
  });
}

describe('dayTimestamp', () => {
  // West of Greenwich is where a UTC parse goes wrong; east of it is where the team is.
  for (const tz of ['America/New_York', 'Europe/Madrid', 'UTC', 'Pacific/Auckland']) {
    inTimezone(tz, () => {
      it('actually runs in that timezone', () => {
        const expected = tz === 'UTC' ? 0 : tz === 'America/New_York' ? 240 : null;
        const offset = new Date(2026, 8, 9).getTimezoneOffset();
        if (expected !== null) expect(offset).toBe(expected);
        else expect(offset).not.toBe(0);
      });

      it('reads a bare date as local midnight of that same day', () => {
        const date = new Date(dayTimestamp('2026-09-09')!);
        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 9]);
        expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()])
          .toEqual([0, 0, 0, 0]);
      });

      it('labels a bare date with its own day', () => {
        const ts = dayTimestamp('2026-09-09')!;
        expect(formatDayLong(ts, 'en')).toBe('Sep 9, 2026');
        expect(formatTimeTick(ts, DAY_MS, 'en')).toBe('Sep 9');
      });

      it('handles the first of the month and of the year', () => {
        expect(new Date(dayTimestamp('2026-01-01')!).getDate()).toBe(1);
        expect(new Date(dayTimestamp('2026-01-01')!).getFullYear()).toBe(2026);
      });

      it('keeps days proportionally apart', () => {
        const a = dayTimestamp('2026-08-01')!;
        const b = dayTimestamp('2026-08-02')!;
        const c = dayTimestamp('2026-08-30')!;
        expect(b - a).toBe(DAY_MS);
        // Proportionality is the point of the axis: 29 days is 29 times one day.
        expect((c - a) / (b - a)).toBe(29);
      });

      it('truncates a full timestamp to the local day it falls on', () => {
        const local = new Date(2026, 8, 9, 15, 42, 7);
        expect(dayTimestamp(local.toISOString())).toBe(new Date(2026, 8, 9).getTime());
      });
    });
  }

  it('returns null for missing or unreadable input', () => {
    expect(dayTimestamp(undefined)).toBeNull();
    expect(dayTimestamp(null)).toBeNull();
    expect(dayTimestamp('')).toBeNull();
    expect(dayTimestamp('not a date')).toBeNull();
  });
});

describe('formatTimeTick', () => {
  const sep9 = new Date(2026, 8, 9).getTime();
  const sep1 = new Date(2026, 8, 1).getTime();

  it('names the day when ticks are less than a month apart', () => {
    expect(formatTimeTick(sep9, DAY_MS, 'en')).toBe('Sep 9');
    expect(formatTimeTick(sep9, 7 * DAY_MS, 'en')).toBe('Sep 9');
    expect(formatTimeTick(sep9, MONTH_TICK_MS - 1, 'en')).toBe('Sep 9');
  });

  it('drops the day once ticks are a month apart', () => {
    expect(formatTimeTick(sep1, MONTH_TICK_MS, 'en')).toBe('Sep 2026');
    expect(formatTimeTick(sep1, 31 * DAY_MS, 'en')).toBe('Sep 2026');
  });

  it('falls back to day labels when the spacing is unknown', () => {
    // A single tick gives the callback nothing to measure against.
    expect(formatTimeTick(sep9, 0, 'en')).toBe('Sep 9');
  });

  it.each(LOCALES)('formats in %s', (locale) => {
    const day = formatTimeTick(sep9, DAY_MS, locale);
    const month = formatTimeTick(sep1, MONTH_TICK_MS, locale);
    expect(day).toMatch(/sep/i);
    expect(day).toMatch(/\b9\b/);
    expect(day).not.toMatch(/2026/);
    expect(month).toMatch(/sep/i);
    expect(month).toMatch(/2026/);
    expect(month).not.toMatch(/\b1\b/);
  });

  it('follows each locale\'s own order', () => {
    // Day-first everywhere but English — the reason for Intl over a fixed pattern.
    expect(formatTimeTick(sep9, DAY_MS, 'en')).toMatch(/^Sep/);
    for (const locale of ['de', 'fr', 'es']) {
      expect(formatTimeTick(sep9, DAY_MS, locale)).toMatch(/^9/);
    }
  });
});

describe('formatDayLong', () => {
  it.each(LOCALES)('includes day, month and year in %s', (locale) => {
    const label = formatDayLong(new Date(2026, 8, 9).getTime(), locale);
    expect(label).toMatch(/\b9\b/);
    expect(label).toMatch(/sep/i);
    expect(label).toMatch(/2026/);
  });
});
