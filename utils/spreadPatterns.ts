/**
 * The narrative spread-pattern taxonomy, in one place.
 *
 * Everything about the four labels — where their regions sit, what colour they wear,
 * what order they appear in — lives here rather than in the components that render
 * them. The boundaries in particular are a *mirror* of core-api's `core/config.py`
 * (SPREAD_COMPOSITE_LO/MID/HI and SPREAD_ACCEL_LO/MID/HI), which are themselves
 * environment-overridable; a deployment that retunes them has to update this file too.
 * That duplication is deliberate: the frontend draws the regions, so it needs the
 * geometry locally, and one definition that drifts is better than four.
 *
 * See docs/narrative-spread-patterns.md.
 */
import type { RawNarrativeSpreadPattern } from '~/types/api';
import { NarrativeSpreadPattern } from '~/types/api';

export type SpreadBadgeVariant = 'destructive' | 'orange' | 'warning' | 'purple';

/**
 * Region boundaries on the percentile plane. Both axes are percentiles (0..1), so a
 * threshold means a knowable fraction of the cohort rather than an absolute magnitude
 * that drifts as the scraper's coverage changes.
 */
export const SPREAD_BOUNDS = {
  composite: { lo: 0.40, mid: 0.50, hi: 0.80 },
  accel: { lo: 0.40, mid: 0.50, hi: 0.80 },
} as const;

/**
 * The regions as rectangles, in classification order — `viral` is carved out of the
 * `trending` box, so it must be tested first. Each range is [min, max] on its own axis;
 * a boundary is only ever compared to a constant on the same axis, never to the other
 * axis's percentile, which is what lets the two rank over different cohorts.
 */
export const SPREAD_REGIONS: {
  pattern: NarrativeSpreadPattern;
  composite: [number, number];
  accel: [number, number];
  /**
   * A region whose area this one contains but does not own, because that region is
   * tested first. Only affects how the region is *described*: classification order
   * already resolves the overlap, so `classifySpreadPattern` does not read this.
   *
   * Written down because the rectangle alone is a true but incomplete account of
   * `trending`. "Virality ≥ 0.40 ∧ Acceleration ≥ 0.40" reads as though the top-right
   * corner were trending, when every narrative in it is viral. A reader checking a
   * `viral` narrative against the table would find it satisfies the trending row too
   * and conclude the table is wrong, rather than that one row is a superset.
   */
  excludes?: NarrativeSpreadPattern;
}[] = [
  { pattern: NarrativeSpreadPattern.VIRAL,        composite: [SPREAD_BOUNDS.composite.hi, 1], accel: [SPREAD_BOUNDS.accel.hi, 1] },
  { pattern: NarrativeSpreadPattern.EARLY_SURGE,  composite: [0, SPREAD_BOUNDS.composite.lo], accel: [SPREAD_BOUNDS.accel.mid, 1] },
  { pattern: NarrativeSpreadPattern.CONSOLIDATED, composite: [SPREAD_BOUNDS.composite.mid, 1], accel: [0, SPREAD_BOUNDS.accel.lo] },
  { pattern: NarrativeSpreadPattern.TRENDING,     composite: [SPREAD_BOUNDS.composite.lo, 1], accel: [SPREAD_BOUNDS.accel.lo, 1], excludes: NarrativeSpreadPattern.VIRAL },
];

/**
 * Mirror of `NarrativeService._classify`. The backend's answer is authoritative — this
 * exists so the quadrant can shade its regions and so a reader can see why a narrative
 * landed where it did, not to second-guess the stored `spread_pattern`.
 */
export function classifySpreadPattern(
  compositePct: number,
  accelPct: number,
): NarrativeSpreadPattern | null {
  for (const region of SPREAD_REGIONS) {
    if (
      compositePct >= region.composite[0] && compositePct <= region.composite[1]
      && accelPct >= region.accel[0] && accelPct <= region.accel[1]
    ) {
      return region.pattern;
    }
  }
  return null;
}

/**
 * Display order: the two that call for attention first, then the two that describe a
 * state. This is a reading order, not a severity ranking — the taxonomy has no ladder,
 * `consolidated` is not a milder `viral`.
 */
export const SPREAD_PATTERN_ORDER: NarrativeSpreadPattern[] = [
  NarrativeSpreadPattern.VIRAL,
  NarrativeSpreadPattern.EARLY_SURGE,
  NarrativeSpreadPattern.TRENDING,
  NarrativeSpreadPattern.CONSOLIDATED,
];

/**
 * Colour by meaning rather than by severity: red, orange and yellow for the three that
 * are moving, purple for large-and-settled. The old palette ran a red→yellow→orange→grey
 * ladder, which misread `consolidated` as a lesser alarm when it is simply a different
 * statement about a narrative.
 */
export const SPREAD_PATTERN_VARIANT: Record<NarrativeSpreadPattern, SpreadBadgeVariant> = {
  [NarrativeSpreadPattern.VIRAL]: 'destructive',
  [NarrativeSpreadPattern.EARLY_SURGE]: 'orange',
  [NarrativeSpreadPattern.TRENDING]: 'warning',
  [NarrativeSpreadPattern.CONSOLIDATED]: 'purple',
};

/** Translucent tints for section backgrounds, keyed to the badge colours. */
export const SPREAD_PATTERN_TINT: Record<NarrativeSpreadPattern, string> = {
  [NarrativeSpreadPattern.VIRAL]: 'bg-red-500/10',
  [NarrativeSpreadPattern.EARLY_SURGE]: 'bg-orange-500/10',
  [NarrativeSpreadPattern.TRENDING]: 'bg-yellow-500/10',
  [NarrativeSpreadPattern.CONSOLIDATED]: 'bg-purple-500/10',
};

/** Solid fills, for the filter checkboxes and the quadrant regions. */
export const SPREAD_PATTERN_FILL: Record<NarrativeSpreadPattern, string> = {
  [NarrativeSpreadPattern.VIRAL]: 'bg-red-600 text-white',
  [NarrativeSpreadPattern.EARLY_SURGE]: 'bg-orange-500 text-white',
  [NarrativeSpreadPattern.TRENDING]: 'bg-yellow-500 text-white',
  [NarrativeSpreadPattern.CONSOLIDATED]: 'bg-purple-600 text-white',
};

/**
 * The patterns the dashboard overview gives a section to.
 *
 * `trending` is excluded. It is the broad middle by construction — the largest region
 * on the plane and roughly 43% of the classifiable cohort — so a "top 6 trending" box
 * is a near-arbitrary sample of the majority, and it crowds out the three sections that
 * make a specific claim. It remains a badge and a filter, so nothing becomes
 * unreachable; it just stops competing for the overview.
 */
export const SPREAD_PATTERN_OVERVIEW: NarrativeSpreadPattern[] = SPREAD_PATTERN_ORDER.filter(
  (pattern) => pattern !== NarrativeSpreadPattern.TRENDING,
);

/**
 * Which axis ranks a pattern's narratives in a list. `early_surge` is defined by movement
 * from a small base, so composite would sort it backwards; everything else reads better
 * biggest-first.
 */
export const SPREAD_PATTERN_SORT: Record<NarrativeSpreadPattern, 'composite' | 'acceleration'> = {
  [NarrativeSpreadPattern.VIRAL]: 'composite',
  [NarrativeSpreadPattern.EARLY_SURGE]: 'acceleration',
  [NarrativeSpreadPattern.TRENDING]: 'composite',
  [NarrativeSpreadPattern.CONSOLIDATED]: 'composite',
};

const ACTIVE_PATTERNS = new Set<string>(Object.values(NarrativeSpreadPattern));

/**
 * Coerce whatever the API sent into a pattern we can render, or null.
 *
 * `none`, `alert` and `watch` are retired. They are mapped to null rather than to a
 * nearest-equivalent because the new regions are drawn on different boundaries, so no
 * such equivalent exists — a narrative still holding one is simply unbadged until the
 * next pipeline run reclassifies it, which is at most a day.
 */
export function normalizeSpreadPattern(
  raw: RawNarrativeSpreadPattern | string | null | undefined,
): NarrativeSpreadPattern | null {
  if (!raw || !ACTIVE_PATTERNS.has(raw)) return null;
  return raw as NarrativeSpreadPattern;
}

/** Drop retired and unknown values from a list of filter selections. */
export function normalizeSpreadPatterns(
  raw: readonly (RawNarrativeSpreadPattern | string)[] | null | undefined,
): NarrativeSpreadPattern[] {
  if (!raw) return [];
  return raw.map(normalizeSpreadPattern).filter((pattern): pattern is NarrativeSpreadPattern => pattern !== null);
}
