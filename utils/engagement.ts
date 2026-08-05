/**
 * Engagement, as the backend defines it.
 *
 * This is the *same* quantity the Composite Virality Index scores on its engagement
 * axis (`engagement_score` in core-api's `get_composite_cohort`): weighted interactions
 * per view, not a raw interaction count. Comments are worth more than likes because they
 * cost more to produce.
 *
 * Keep this in step with `VIRALITY_SCORE_LIKES_WEIGHT` / `VIRALITY_SCORE_COMMENTS_WEIGHT`
 * in core-api's `core/config.py` — the weights come from the same environment variable
 * names so one deployment env configures both sides.
 */
export interface EngagementWeights {
  likes: number;
  comments: number;
}

/**
 * Weighted interactions per view. Views of 0 yield 0, matching the backend's
 * `CASE WHEN ns.views > 0 ... ELSE 0.0` — an unwatched narrative has no rate, and 0 is
 * the value the composite axis ranks it at.
 */
export function engagementRate(
  likes: number,
  comments: number,
  views: number,
  weights: EngagementWeights
): number {
  if (!views || views <= 0) return 0;
  return (likes * weights.likes + comments * weights.comments) / views;
}

/** Rates sit around 0.0x, so a fixed decimal count reads better than `toLocaleString`. */
export function formatEngagementRate(value: number, decimals = 3): string {
  return value.toFixed(decimals);
}

/**
 * How many decimals it takes to tell two neighbouring axis ticks apart.
 *
 * A fixed 3 was wrong: when the rate barely moves, Chart.js picks a tick step far below
 * 0.001 and every label rounds to the same string — an axis reading `0.075` six times
 * over. The step decides the precision, not our taste.
 */
export function engagementRateDecimals(step: number, minDecimals = 3): number {
  if (!isFinite(step) || step <= 0) return minDecimals;

  // Enough decimals to write the step itself exactly, which is strictly more than
  // "enough to tell two ticks apart". A 0.25 step needs two: at one decimal the
  // gridlines read 6.5, 6.8, 7.0, 7.3 — even spacing rendered as uneven numbers.
  for (let decimals = 0; decimals <= 8; decimals++) {
    const scaled = step * Math.pow(10, decimals);
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) {
      return Math.min(8, Math.max(minDecimals, decimals));
    }
  }
  return 8;
}

/**
 * Bounds for the engagement axis.
 *
 * The axis is not zero-based — a rate lives in a narrow band and pinning it to zero
 * flattens every real movement — but letting Chart.js fit the data exactly has the
 * opposite failure: a rate that is *genuinely* flat gets its last few float digits
 * stretched across the full plot height, drawing a dramatic curve out of nothing.
 *
 * So the band is padded to at least 20% of the value it sits around. Real variation
 * still fills the chart; noise stays visibly flat.
 */
export function engagementAxisBounds(
  values: number[],
  minAbsoluteHalfSpan = 1e-4
): { min: number; max: number } | null {
  const finite = values.filter(v => isFinite(v));
  if (finite.length === 0) return null;

  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const centre = (lo + hi) / 2;

  // The absolute floor only bites when the values sit at zero, where a relative
  // floor has nothing to be relative to. Scale it with the unit being plotted:
  // 1e-4 suits a 0-1 ratio, 1e-2 suits percentages.
  const minHalfSpan = Math.max(centre * 0.1, minAbsoluteHalfSpan);
  const halfSpan = Math.max((hi - lo) / 2 * 1.15, minHalfSpan);

  return { min: Math.max(0, centre - halfSpan), max: centre + halfSpan };
}
