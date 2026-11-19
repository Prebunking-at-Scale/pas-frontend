/**
 * Z-score normalisation, for putting two series with different units on one scale.
 *
 * Reach is a count in the millions and engagement is a percentage under ten; plotted
 * against their own axes they can only be compared by eye, and the comparison is a lie
 * — the axes are scaled independently, so "the lines cross here" means nothing.
 *
 * Expressing both as standard deviations from their own mean makes them genuinely
 * comparable: a point at +1 is one deviation above that series' average, whichever
 * series it belongs to. What the shape then shows is *relative* movement — whether
 * engagement rose faster than usual at the moment reach did.
 *
 * Population standard deviation (÷ N), not sample (÷ N-1): the series is the whole
 * population here, not a sample drawn from a larger one. There is no wider set of
 * days we are inferring about.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mu = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Each value as standard deviations from the series mean.
 *
 * A series that never moves has no deviation to measure, so every point is 0 — flat at
 * the mean, which is exactly what it is. Returning NaN there (0/0) would blank the line
 * instead, and a missing line reads as missing data rather than as "this never changed".
 */
export function zScores(values: number[], population?: number[]): number[] {
  if (values.length === 0) return [];
  // `population` lets the caller score points against a different set than the one
  // being scored. The chart needs that: it inserts vertices to draw a step, and
  // those are drawing instructions rather than observations. Scored against
  // themselves they would pull the mean toward whichever moments happen to have a
  // step, and "standard deviations from the mean" would be measured against a
  // population that includes points nobody recorded.
  const basis = population && population.length > 0 ? population : values;
  const mu = mean(basis);
  const sigma = stdDev(basis);
  if (sigma === 0) return values.map(() => 0);
  return values.map(v => (v - mu) / sigma);
}

/** "+1.42" / "−0.35" — sign always shown, because the sign is the point. */
export function formatZScore(value: number, decimals = 2): string {
  const rounded = value.toFixed(decimals);
  return value >= 0 && !rounded.startsWith('-') ? `+${rounded}` : rounded;
}
