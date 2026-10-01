/**
 * Timeframes travel through localStorage and the `?created=` query param, so the guard
 * has to reject anything a stale bookmark or a hand-edited URL might carry. The windows
 * are resolved against `now`, which lets these pin exact bounds.
 */
import { describe, it, expect } from 'vitest';
import { Timeframe, TIMEFRAMES, isTimeframe, timeframeInterval } from '~/utils/timeframes';

const NOW = new Date('2026-09-21T12:00:00.000Z');

describe('timeframeInterval', () => {
  it('ends every bounded window at now', () => {
    for (const timeframe of TIMEFRAMES.filter((t) => t !== Timeframe.ALL_TIME)) {
      expect(timeframeInterval(timeframe, NOW)?.end).toEqual(NOW);
    }
  });

  it('starts 24 hours, 7 days and one calendar month back', () => {
    expect(timeframeInterval(Timeframe.LAST_24_HOURS, NOW)?.start).toEqual(new Date('2026-09-20T12:00:00.000Z'));
    expect(timeframeInterval(Timeframe.LAST_WEEK, NOW)?.start).toEqual(new Date('2026-09-14T12:00:00.000Z'));
    expect(timeframeInterval(Timeframe.LAST_MONTH, NOW)?.start).toEqual(new Date('2026-08-21T12:00:00.000Z'));
  });

  it('returns null for all time, meaning no filter', () => {
    expect(timeframeInterval(Timeframe.ALL_TIME, NOW)).toBeNull();
  });
});

describe('isTimeframe', () => {
  it('accepts every timeframe value', () => {
    for (const timeframe of TIMEFRAMES) {
      expect(isTimeframe(timeframe)).toBe(true);
    }
  });

  it('rejects anything else a URL or storage might hold', () => {
    for (const value of ['bogus', 'LAST_WEEK', '', null, undefined, ['lastWeek'], 7]) {
      expect(isTimeframe(value)).toBe(false);
    }
  });
});
