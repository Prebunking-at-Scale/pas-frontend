/**
 * Making two independent y-axes share one set of gridlines.
 *
 * A dual-axis chart draws gridlines for the left scale only — the right scale sets
 * `drawOnChartArea: false`, otherwise the two grids cross-hatch the plot. But each
 * scale still picks its own tick count, so the right-hand labels land wherever its
 * own algorithm put them: between the visible gridlines, which reads as though the
 * labels belong to nothing.
 *
 * The fix is to give both scales an explicit min, max and tick `count`. Chart.js then
 * spaces `count` ticks evenly from min to max on each, so tick *i* sits at the same
 * height on both — and the right-hand labels line up with the left-hand gridlines.
 *
 * That only works if both ranges are chosen so their steps are still readable, which
 * is what `alignedBounds` is for: it rounds the step to a 1/2/2.5/5 × 10ⁿ value and
 * widens the range to fit, rather than accepting whatever (max - min) / (count - 1)
 * happens to be.
 */

/**
 * The next "round" number at or above `raw`.
 *
 * Wider than the textbook 1 / 2 / 2.5 / 5 / 10 family on purpose. Because both
 * axes must share a tick count, a coarse family forces one of them to round its
 * step up a long way: 31.3M over 4 divisions wants 7.83M, and with only 5 or 10
 * available it takes 10M and wastes 28% of the plot. 8M steps are just as
 * readable and waste 2%.
 */
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export function niceStep(raw: number): number {
  if (!isFinite(raw) || raw <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const nice = NICE_STEPS.find(candidate => normalised <= candidate + 1e-9) ?? 10;
  return nice * magnitude;
}

export interface AlignedBounds {
  min: number;
  max: number;
  step: number;
}

/**
 * A range covering [min, max] in exactly `tickCount - 1` steps of a round size.
 *
 * `zeroBased` pins the bottom to 0 (reach, a count). Otherwise the bottom is rounded
 * down to a multiple of the step (engagement, a rate that never approaches zero).
 *
 * The loop grows the step until the range reaches `max`: rounding the minimum down
 * can eat one step's worth of headroom, and a chart whose top tick sits below its own
 * data would clip the line.
 */
export function alignedBounds(
  min: number,
  max: number,
  tickCount: number,
  zeroBased = false
): AlignedBounds {
  const divisions = Math.max(1, tickCount - 1);
  const lo = zeroBased ? 0 : Math.min(min, max);
  const hi = Math.max(max, lo);

  // A flat series has no span to divide; invent one so the axis still has height.
  const span = hi - lo || Math.abs(hi) * 0.1 || 1;

  let step = niceStep(span / divisions);
  for (let guard = 0; guard < 8; guard++) {
    const base = zeroBased ? 0 : Math.floor(lo / step) * step;
    if (base + step * divisions >= hi) {
      return { min: base, max: base + step * divisions, step };
    }
    step = niceStep(step * 1.5);
  }

  // Unreachable in practice; a sane range beats an exception.
  return { min: lo, max: hi, step: (hi - lo) / divisions };
}

/**
 * A range centred on zero, with zero landing exactly on a gridline.
 *
 * For the z-score view, where 0 is the series mean and the sign is the whole message:
 * an axis whose zero falls between gridlines makes "above average" a matter of
 * squinting. Only odd tick counts are offered, because an even count has no middle
 * tick to put zero on.
 */
export function symmetricBounds(
  magnitude: number,
  candidates = [5, 7, 9]
): AlignedBounds & { count: number } {
  const extent = isFinite(magnitude) && magnitude > 0 ? Math.abs(magnitude) : 1;

  let best = { min: -extent, max: extent, step: extent, count: candidates[0] };
  let leastWaste = Infinity;
  for (const count of candidates) {
    const half = (count - 1) / 2;
    const step = niceStep(extent / half);
    const waste = step * half - extent;
    if (waste < leastWaste - 1e-9) {
      leastWaste = waste;
      best = { min: -step * half, max: step * half, step, count };
    }
  }
  return best;
}

export interface AxisRequest {
  min: number;
  max: number;
  /** Pin the bottom to zero — true for counts, false for rates. */
  zeroBased?: boolean;
}

/**
 * How many gridlines to draw, given that both axes must use the same number.
 *
 * The count cannot be fixed, because a fixed count plus a rounded step wastes
 * however much headroom the rounding happens to cost: 31.3M of reach over 6 ticks
 * needs a step above 6.26M, which rounds to 10M and tops the axis out at 50M — a
 * third of the plot left empty with the line squashed below it.
 *
 * Nor can it be chosen from one axis alone. Picking purely for reach lands on 8
 * ticks, which suits reach (11.7% headroom) and ruins engagement: a 2% step over
 * 7 divisions stretches a 0.8–7.4% series across a 0–14% axis, so the line uses
 * half the height.
 *
 * So the score is the WORST stretch across the axes, not the total: a count is
 * only as good as the axis it treats worst. Ties go to the denser grid.
 */
export function bestTickCount(axes: AxisRequest[], candidates = [5, 6, 7, 8]): number {
  const usable = axes.filter(a => isFinite(a.min) && isFinite(a.max));
  if (usable.length === 0) return candidates[0];

  let best = candidates[0];
  let bestScore = Infinity;
  for (const count of candidates) {
    let worst = 0;
    for (const axis of usable) {
      const dataSpan = (axis.zeroBased ? axis.max : axis.max - axis.min) || 1;
      const b = alignedBounds(axis.min, axis.max, count, axis.zeroBased);
      worst = Math.max(worst, (b.max - b.min) / dataSpan);
    }
    if (worst < bestScore - 1e-9 || (Math.abs(worst - bestScore) <= 1e-9 && count > best)) {
      bestScore = Math.min(bestScore, worst);
      best = count;
    }
  }
  return best;
}
