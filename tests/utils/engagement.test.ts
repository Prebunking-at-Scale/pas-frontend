/**
 * The engagement rate the evolution chart plots is not a frontend invention: it mirrors
 * `engagement_score` from core-api's `get_composite_cohort`, the engagement axis of the
 * Composite Virality Index. The formula is duplicated rather than fetched — the API
 * exposes the percentile, never the raw score — so only a test catches a drift.
 */
import { describe, it, expect } from 'vitest';
import {
  engagementRate,
  formatEngagementRate,
  engagementRateDecimals,
  engagementAxisBounds,
} from '~/utils/engagement';

// The defaults of VIRALITY_SCORE_LIKES_WEIGHT / VIRALITY_SCORE_COMMENTS_WEIGHT.
const WEIGHTS = { likes: 1, comments: 5 };

describe('engagementRate', () => {
  it('weights comments above likes, per view', () => {
    // (1000 * 1 + 100 * 5) / 50000
    expect(engagementRate(1000, 100, 50000, WEIGHTS)).toBeCloseTo(0.03, 10);
  });

  it('honours the configured weights rather than assuming 1 and 5', () => {
    expect(engagementRate(10, 10, 100, { likes: 2, comments: 3 })).toBeCloseTo(0.5, 10);
  });

  it('is 0 when there are no views, matching the backend CASE branch', () => {
    // A narrative nobody watched has no rate. The backend ranks it at 0.0 rather than
    // dividing by zero, and so must we — NaN would poison the whole axis scale.
    expect(engagementRate(10, 10, 0, WEIGHTS)).toBe(0);
    expect(engagementRate(0, 0, 0, WEIGHTS)).toBe(0);
  });

  it('is 0 when interactions are absent but views are not', () => {
    expect(engagementRate(0, 0, 12345, WEIGHTS)).toBe(0);
  });
});

describe('formatEngagementRate', () => {
  it('keeps three decimals by default so small rates stay distinguishable', () => {
    expect(formatEngagementRate(0.0288)).toBe('0.029');
    expect(formatEngagementRate(0)).toBe('0.000');
  });

  it('accepts a wider precision for tooltips', () => {
    expect(formatEngagementRate(0.0288, 4)).toBe('0.0288');
  });
});

describe('engagementRateDecimals', () => {
  it('never prints two neighbouring ticks as the same string', () => {
    // The bug this exists for: a step of 0.0000005 at 3 decimals labelled every
    // gridline "0.075".
    const steps = [0.05, 0.01, 0.001, 0.0005, 0.00002, 0.0000005];
    for (const step of steps) {
      const decimals = engagementRateDecimals(step);
      expect(formatEngagementRate(0.075, decimals))
        .not.toBe(formatEngagementRate(0.075 + step, decimals));
    }
  });

  it('stays at three decimals for comfortable steps', () => {
    expect(engagementRateDecimals(0.01)).toBe(3);
    expect(engagementRateDecimals(0.5)).toBe(3);
  });

  it('falls back to three decimals when there is no usable step', () => {
    expect(engagementRateDecimals(0)).toBe(3);
    expect(engagementRateDecimals(NaN)).toBe(3);
    expect(engagementRateDecimals(-1)).toBe(3);
  });

  it('takes a lower floor for the percentage axis', () => {
    // The chart plots percentage points, where 5.1% is precise enough and
    // 5.100% is noise. Finer steps still win over the floor.
    expect(engagementRateDecimals(0.5, 1)).toBe(1);
    expect(engagementRateDecimals(0.01, 1)).toBe(2);
    expect(engagementRateDecimals(0, 1)).toBe(1);
  });

  it('renders the step exactly, not merely distinguishably', () => {
    // A 0.25 step is distinguishable at one decimal but reads as uneven spacing:
    // 6.5, 6.8, 7.0, 7.3 for gridlines that are in fact evenly placed.
    expect(engagementRateDecimals(0.25, 1)).toBe(2);
    expect(engagementRateDecimals(1.5, 1)).toBe(1);
    expect(engagementRateDecimals(2, 1)).toBe(1);
    expect(engagementRateDecimals(0.025, 1)).toBe(3);
  });

  it('gives every tick of a real axis a distinct, exact label', () => {
    // 0.25 steps from 6.5: the flat two-point case the production data produces.
    const decimals = engagementRateDecimals(0.25, 1);
    const labels = Array.from({ length: 8 }, (_, i) =>
      formatEngagementRate(6.5 + i * 0.25, decimals));
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual([
      '6.50', '6.75', '7.00', '7.25', '7.50', '7.75', '8.00', '8.25',
    ]);
  });
});

describe('engagementAxisBounds', () => {
  it('pads a flat series so float noise is not stretched across the plot', () => {
    // Real seed-data values: identical to seven decimals.
    const flat = [0.07499997440780774, 0.07499998243669935];
    const bounds = engagementAxisBounds(flat)!;
    expect(bounds.max - bounds.min).toBeGreaterThan(0.01);
    // The line stays centred rather than hugging an edge.
    expect(bounds.min).toBeLessThan(flat[0]);
    expect(bounds.max).toBeGreaterThan(flat[1]);
  });

  it('lets real variation fill the axis', () => {
    const bounds = engagementAxisBounds([0.02, 0.05, 0.09])!;
    expect(bounds.min).toBeLessThan(0.02);
    expect(bounds.max).toBeGreaterThan(0.09);
    // Padding, not distortion: no more than ~15% wider than the data on each side.
    expect(bounds.max - bounds.min).toBeLessThan(0.07 * 1.5);
  });

  it('never goes negative — a rate below zero is not a thing', () => {
    expect(engagementAxisBounds([0, 0, 0])!.min).toBe(0);
    expect(engagementAxisBounds([0.0001])!.min).toBeGreaterThanOrEqual(0);
  });

  it('gives the axis a height even when every value is zero', () => {
    const bounds = engagementAxisBounds([0, 0])!;
    expect(bounds.max).toBeGreaterThan(bounds.min);
  });

  it('returns null when there is nothing to bound', () => {
    expect(engagementAxisBounds([])).toBeNull();
    expect(engagementAxisBounds([NaN, Infinity])).toBeNull();
  });

  it('scales its zero-floor to the unit being plotted', () => {
    // The chart passes percentage points, so an all-zero series needs a
    // percentage-sized axis, not a ratio-sized one.
    expect(engagementAxisBounds([0, 0], 1e-2)!.max).toBeCloseTo(0.01, 10);
    expect(engagementAxisBounds([0, 0])!.max).toBeCloseTo(0.0001, 10);
  });

  it('pads a flat percentage series the same way it pads a flat ratio', () => {
    // 5.06% twice over — the production shape for a two-point narrative.
    const bounds = engagementAxisBounds([5.0648, 5.0656], 1e-2)!;
    expect(bounds.max - bounds.min).toBeGreaterThan(1);
    expect(bounds.min).toBeLessThan(5.0648);
    expect(bounds.max).toBeGreaterThan(5.0656);
  });
});
