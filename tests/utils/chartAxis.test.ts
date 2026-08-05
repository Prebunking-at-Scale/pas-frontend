/**
 * The dual-axis chart draws gridlines for the left scale only, so the right scale's
 * labels have to be forced onto the same heights. Both scales get an explicit
 * min/max and the same tick count; that only aligns them if the bounds really do
 * divide into exactly tickCount - 1 equal steps, which is what these pin down.
 */
import { describe, it, expect } from 'vitest';
import { niceStep, alignedBounds, bestTickCount, symmetricBounds, type AxisRequest } from '~/utils/chartAxis';

const COUNT = 6;
const DIVISIONS = COUNT - 1;

describe('niceStep', () => {
  it('rounds up into the round-number family', () => {
    expect(niceStep(0.9)).toBe(1);
    expect(niceStep(1.4)).toBe(1.5);
    expect(niceStep(2.3)).toBe(2.5);
    expect(niceStep(4)).toBe(4);
    expect(niceStep(7)).toBe(8);
    expect(niceStep(9.1)).toBe(10);
  });

  it('works across magnitudes', () => {
    expect(niceStep(6_400_000)).toBe(8_000_000);
    expect(niceStep(0.013)).toBeCloseTo(0.015, 10);
  });

  it('never rounds down — a step below the ask would clip the axis', () => {
    for (const raw of [0.31, 1.01, 3.4, 7.83, 61, 6_264_590]) {
      expect(niceStep(raw)).toBeGreaterThanOrEqual(raw);
    }
  });

  it('never returns zero or NaN for degenerate input', () => {
    for (const bad of [0, -5, NaN, Infinity]) expect(niceStep(bad)).toBe(1);
  });
});

describe('alignedBounds', () => {
  const divides = (b: { min: number; max: number; step: number }) => {
    // The whole point: exactly DIVISIONS equal steps from min to max.
    expect(b.max - b.min).toBeCloseTo(b.step * DIVISIONS, 6);
  };

  it('covers the data and divides evenly (reach, zero-based)', () => {
    const b = alignedBounds(0, 31_322_950, COUNT, true);
    expect(b.min).toBe(0);
    expect(b.max).toBeGreaterThanOrEqual(31_322_950);
    divides(b);
  });

  it('covers the data and divides evenly (engagement, floating bottom)', () => {
    const b = alignedBounds(0.7696, 7.3544, COUNT);
    expect(b.min).toBeLessThanOrEqual(0.7696);
    expect(b.max).toBeGreaterThanOrEqual(7.3544);
    divides(b);
  });

  it('lands the engagement axis on round percentages', () => {
    const b = alignedBounds(0.7696, 7.3544, COUNT);
    const ticks = Array.from({ length: COUNT }, (_, i) => b.min + i * b.step);
    // Every tick a clean multiple of the step -> no 1.23% labels.
    for (const t of ticks) expect(Math.abs(t / b.step - Math.round(t / b.step))).toBeLessThan(1e-9);
  });

  it('never lets the top tick fall below the data', () => {
    // Rounding the minimum down eats headroom; the step has to grow to compensate.
    // A line clipped by its own axis is the failure this guards.
    const cases: Array<[number, number]> = [
      [0.7696, 7.3544], [4.9, 5.1], [0.001, 0.002], [12.3, 98.7], [0, 0.0001],
    ];
    for (const [lo, hi] of cases) {
      const b = alignedBounds(lo, hi, COUNT);
      expect(b.max).toBeGreaterThanOrEqual(hi);
      expect(b.min).toBeLessThanOrEqual(lo);
      divides(b);
    }
  });

  it('gives a flat series a real height instead of a zero-span axis', () => {
    const b = alignedBounds(5.0648, 5.0648, COUNT);
    expect(b.max).toBeGreaterThan(b.min);
    divides(b);
  });

  it('handles an all-zero series', () => {
    const b = alignedBounds(0, 0, COUNT, true);
    expect(b.min).toBe(0);
    expect(b.max).toBeGreaterThan(0);
    divides(b);
  });
});

describe('bestTickCount', () => {
  const reachAxis = (max: number) => ({ min: 0, max, zeroBased: true });

  it('picks the count that wastes least headroom', () => {
    // 31.3M over 6 ticks needs a >6.26M step, which rounds to 10M and tops the
    // axis out at 50M. The regression this guards: a third of the plot empty.
    const count = bestTickCount([reachAxis(31_322_950)]);
    const b = alignedBounds(0, 31_322_950, count, true);
    expect(b.max).toBeLessThanOrEqual(31_322_950 * 1.2);
    expect(b.max).toBeGreaterThanOrEqual(31_322_950);
  });

  it('keeps waste modest across magnitudes', () => {
    for (const max of [7, 93, 640, 12_500, 999_999, 31_322_950, 4_500_000_000]) {
      const b = alignedBounds(0, max, bestTickCount([reachAxis(max)]), true);
      expect(b.max).toBeGreaterThanOrEqual(max);
      expect(b.max - max).toBeLessThanOrEqual(max * 0.35);
    }
  });

  it('does not sacrifice the second axis to suit the first', () => {
    // Real data: reach 0-31.3M against engagement 0.42-7.70%. Choosing for reach
    // alone gives 8 ticks, which stretches engagement onto a 0-14% axis — the
    // line then uses half the height it should.
    const reach = reachAxis(31_322_950);
    const engagement = { min: 0.42, max: 7.70 };
    const count = bestTickCount([reach, engagement]);

    const e = alignedBounds(engagement.min, engagement.max, count);
    const stretch = (e.max - e.min) / (engagement.max - engagement.min);
    expect(stretch).toBeLessThan(1.5);

    const r = alignedBounds(0, reach.max, count, true);
    expect(r.max / reach.max).toBeLessThan(1.5);
  });

  it('scores by the worst axis, not the total', () => {
    // A count that is excellent for one axis and terrible for the other must lose
    // to a count that is merely good for both.
    const axes: AxisRequest[] = [reachAxis(1_000), { min: 9.9, max: 10.1 }];
    const count = bestTickCount(axes);
    for (const axis of axes) {
      const b = alignedBounds(axis.min, axis.max, count, axis.zeroBased);
      const span = axis.zeroBased ? axis.max : axis.max - axis.min;
      expect((b.max - b.min) / span).toBeLessThan(30);
    }
  });

  it('returns a usable count for degenerate input', () => {
    expect([5, 6, 7, 8]).toContain(bestTickCount([]));
    for (const bad of [NaN, Infinity]) {
      expect([5, 6, 7, 8]).toContain(bestTickCount([reachAxis(bad)]));
    }
  });
});

describe('symmetricBounds', () => {
  it('puts zero on a gridline, dead centre', () => {
    for (const magnitude of [0.4, 1, 2.3, 17, 250]) {
      const b = symmetricBounds(magnitude);
      expect(b.min).toBeCloseTo(-b.max, 10);
      expect(b.count % 2).toBe(1);            // odd count => a middle tick exists
      const middle = b.min + b.step * ((b.count - 1) / 2);
      expect(middle).toBeCloseTo(0, 10);      // and that middle tick is zero
    }
  });

  it('covers the data it was given', () => {
    for (const magnitude of [0.4, 1, 2.3, 17, 250, 3.7]) {
      const b = symmetricBounds(magnitude);
      expect(b.max).toBeGreaterThanOrEqual(magnitude);
    }
  });

  it('divides into whole steps', () => {
    const b = symmetricBounds(2.3);
    expect(b.max - b.min).toBeCloseTo(b.step * (b.count - 1), 10);
  });

  it('survives degenerate input', () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      const b = symmetricBounds(bad);
      expect(b.max).toBeGreaterThan(0);
      expect(b.min).toBeLessThan(0);
    }
  });
});
