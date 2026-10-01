import { interval, sub, type NormalizedInterval } from 'date-fns';

// Relative windows offered wherever a list can be scoped to "recent" data (dashboard,
// narratives list). Values double as i18n keys under `timeframes.*` and as the `created`
// query param, so a dashboard link can hand its window to the narratives list.
export enum Timeframe {
  LAST_24_HOURS = 'last24Hours',
  LAST_WEEK = 'lastWeek',
  LAST_MONTH = 'lastMonth',
  ALL_TIME = 'allTime',
}

export const TIMEFRAMES = Object.values(Timeframe);

export const isTimeframe = (value: unknown): value is Timeframe =>
  typeof value === 'string' && (TIMEFRAMES as string[]).includes(value);

// Resolved against `now` at call time, so a window is always relative to the moment the
// data is fetched rather than to when the user picked it. ALL_TIME means no filter.
export const timeframeInterval = (timeframe: Timeframe, now = new Date()): NormalizedInterval<Date> | null => {
  switch (timeframe) {
    case Timeframe.LAST_24_HOURS:
      return interval(sub(now, { hours: 24 }), now);
    case Timeframe.LAST_WEEK:
      return interval(sub(now, { days: 7 }), now);
    case Timeframe.LAST_MONTH:
      return interval(sub(now, { months: 1 }), now);
    case Timeframe.ALL_TIME:
    default:
      return null;
  }
};
