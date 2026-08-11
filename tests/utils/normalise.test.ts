/**
 * Z-scores are what make the normalised tab meaningful: reach in the millions and
 * engagement under ten percent only become comparable once both are expressed in
 * their own standard deviations. These pin the definition and the degenerate cases
 * a real narrative will hit — a series that never moves, and a series of one point.
 */
import { describe, it, expect } from 'vitest';
import { mean, stdDev, zScores, formatZScore } from '~/utils/normalise';

describe('mean and stdDev', () => {
  it('computes the population standard deviation, not the sample one', () => {
    // [2,4,4,4,5,5,7,9]: mean 5, population sd 2, sample sd ~2.138.
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(values)).toBe(5);
    expect(stdDev(values)).toBeCloseTo(2, 10);
  });

  it('is 0 for an unmoving series and for no series at all', () => {
    expect(stdDev([7, 7, 7])).toBe(0);
    expect(stdDev([])).toBe(0);
    expect(mean([])).toBe(0);
  });
});

describe('zScores', () => {
  it('centres on the mean and scales by the deviation', () => {
    const z = zScores([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(z[0]).toBeCloseTo(-1.5, 10);  // (2-5)/2
    expect(z[7]).toBeCloseTo(2, 10);     // (9-5)/2
    expect(mean(z)).toBeCloseTo(0, 10);
  });

  it('gives a flat series zeros rather than NaN', () => {
    // 0/0 would blank the line, and a missing line reads as missing data instead of
    // as "this value never changed" — which is the true statement about a narrative
    // whose engagement held steady.
    const z = zScores([7.5, 7.5, 7.5]);
    expect(z).toEqual([0, 0, 0]);
    expect(z.every(Number.isFinite)).toBe(true);
  });

  it('handles a single point and an empty series', () => {
    expect(zScores([42])).toEqual([0]);
    expect(zScores([])).toEqual([]);
  });

  it('puts two wildly different units on the same footing', () => {
    // The whole point of the tab: same shape, same z-scores, regardless of unit.
    // Compared per element rather than deeply — a million-fold difference in scale
    // shifts the last bit of the mantissa.
    const reach = zScores([1_000_000, 2_000_000, 4_000_000]);
    const engagement = zScores([1, 2, 4]);
    reach.forEach((z, i) => expect(z).toBeCloseTo(engagement[i], 12));
  });
});

describe('formatZScore', () => {
  it('always shows the sign, because the sign is the message', () => {
    expect(formatZScore(1.4235)).toBe('+1.42');
    expect(formatZScore(-0.3512)).toBe('-0.35');
    expect(formatZScore(0)).toBe('+0.00');
  });

  it('does not print a stray plus on a value that rounds to negative zero', () => {
    expect(formatZScore(-0.001)).toBe('-0.00');
  });

  it('takes a precision for axis labels', () => {
    expect(formatZScore(1.44, 1)).toBe('+1.4');
    expect(formatZScore(1.46, 1)).toBe('+1.5');
    expect(formatZScore(-2, 1)).toBe('-2.0');
  });
});
