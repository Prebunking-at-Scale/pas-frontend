/**
 * The narrative alert taxonomy, in one place.
 *
 * Everything about the four labels — where their regions sit, what colour they wear,
 * what order they appear in — lives here rather than in the components that render
 * them. The boundaries in particular are a *mirror* of core-api's `core/config.py`
 * (ALERT_COMPOSITE_LO/MID/HI and ALERT_ACCEL_LO/MID/HI), which are themselves
 * environment-overridable; a deployment that retunes them has to update this file too.
 * That duplication is deliberate: the frontend draws the regions, so it needs the
 * geometry locally, and one definition that drifts is better than four.
 *
 * See docs/narrative-alert-levels.md.
 */
import type { RawNarrativeAlertLevel } from '~/types/api';
import { NarrativeAlertLevel } from '~/types/api';

export type AlertBadgeVariant = 'destructive' | 'orange' | 'secondary' | 'blue';

/**
 * Region boundaries on the percentile plane. Both axes are percentiles (0..1), so a
 * threshold means a knowable fraction of the cohort rather than an absolute magnitude
 * that drifts as the scraper's coverage changes.
 */
export const ALERT_BOUNDS = {
  composite: { lo: 0.40, mid: 0.50, hi: 0.80 },
  accel: { lo: 0.40, mid: 0.50, hi: 0.80 },
} as const;

/**
 * The regions as rectangles, in classification order — `viral` is carved out of the
 * `trending` box, so it must be tested first. Each range is [min, max] on its own axis;
 * a boundary is only ever compared to a constant on the same axis, never to the other
 * axis's percentile, which is what lets the two rank over different cohorts.
 */
export const ALERT_REGIONS: {
  level: NarrativeAlertLevel;
  composite: [number, number];
  accel: [number, number];
}[] = [
  { level: NarrativeAlertLevel.VIRAL,        composite: [ALERT_BOUNDS.composite.hi, 1], accel: [ALERT_BOUNDS.accel.hi, 1] },
  { level: NarrativeAlertLevel.EARLY_SURGE,  composite: [0, ALERT_BOUNDS.composite.lo], accel: [ALERT_BOUNDS.accel.mid, 1] },
  { level: NarrativeAlertLevel.CONSOLIDATED, composite: [ALERT_BOUNDS.composite.mid, 1], accel: [0, ALERT_BOUNDS.accel.lo] },
  { level: NarrativeAlertLevel.TRENDING,     composite: [ALERT_BOUNDS.composite.lo, 1], accel: [ALERT_BOUNDS.accel.lo, 1] },
];

/**
 * Mirror of `NarrativeService._classify`. The backend's answer is authoritative — this
 * exists so the quadrant can shade its regions and so a reader can see why a narrative
 * landed where it did, not to second-guess the stored `alert_level`.
 */
export function classifyAlertLevel(
  compositePct: number,
  accelPct: number,
): NarrativeAlertLevel | null {
  for (const region of ALERT_REGIONS) {
    if (
      compositePct >= region.composite[0] && compositePct <= region.composite[1]
      && accelPct >= region.accel[0] && accelPct <= region.accel[1]
    ) {
      return region.level;
    }
  }
  return null;
}

/**
 * Display order: the two that call for attention first, then the two that describe a
 * state. This is a reading order, not a severity ranking — the taxonomy has no ladder,
 * `consolidated` is not a milder `viral`.
 */
export const ALERT_LEVEL_ORDER: NarrativeAlertLevel[] = [
  NarrativeAlertLevel.VIRAL,
  NarrativeAlertLevel.EARLY_SURGE,
  NarrativeAlertLevel.TRENDING,
  NarrativeAlertLevel.CONSOLIDATED,
];

/**
 * Colour by meaning rather than by severity: red and orange for the two that are
 * climbing, neutral grey for the broad middle, blue for large-and-settled. The old
 * palette ran a red→yellow→orange→grey ladder, which misread `consolidated` as a
 * lesser alarm when it is simply a different statement.
 */
export const ALERT_LEVEL_VARIANT: Record<NarrativeAlertLevel, AlertBadgeVariant> = {
  [NarrativeAlertLevel.VIRAL]: 'destructive',
  [NarrativeAlertLevel.EARLY_SURGE]: 'orange',
  [NarrativeAlertLevel.TRENDING]: 'secondary',
  [NarrativeAlertLevel.CONSOLIDATED]: 'blue',
};

/** Translucent tints for section backgrounds, keyed to the badge colours. */
export const ALERT_LEVEL_TINT: Record<NarrativeAlertLevel, string> = {
  [NarrativeAlertLevel.VIRAL]: 'bg-red-500/10',
  [NarrativeAlertLevel.EARLY_SURGE]: 'bg-orange-500/10',
  [NarrativeAlertLevel.TRENDING]: 'bg-gray-500/10',
  [NarrativeAlertLevel.CONSOLIDATED]: 'bg-blue-500/10',
};

/** Solid fills, for the filter checkboxes and the quadrant regions. */
export const ALERT_LEVEL_FILL: Record<NarrativeAlertLevel, string> = {
  [NarrativeAlertLevel.VIRAL]: 'bg-red-600 text-white',
  [NarrativeAlertLevel.EARLY_SURGE]: 'bg-orange-500 text-white',
  [NarrativeAlertLevel.TRENDING]: 'bg-gray-500 text-white',
  [NarrativeAlertLevel.CONSOLIDATED]: 'bg-blue-600 text-white',
};

/**
 * Which axis ranks a level's narratives in a list. `early_surge` is defined by movement
 * from a small base, so composite would sort it backwards; everything else reads better
 * biggest-first.
 */
export const ALERT_LEVEL_SORT: Record<NarrativeAlertLevel, 'composite' | 'acceleration'> = {
  [NarrativeAlertLevel.VIRAL]: 'composite',
  [NarrativeAlertLevel.EARLY_SURGE]: 'acceleration',
  [NarrativeAlertLevel.TRENDING]: 'composite',
  [NarrativeAlertLevel.CONSOLIDATED]: 'composite',
};

const ACTIVE_LEVELS = new Set<string>(Object.values(NarrativeAlertLevel));

/**
 * Coerce whatever the API sent into a level we can render, or null.
 *
 * `none`, `alert` and `watch` are retired. They are mapped to null rather than to a
 * nearest-equivalent because the new regions are drawn on different boundaries, so no
 * such equivalent exists — a narrative still holding one is simply unbadged until the
 * next pipeline run reclassifies it, which is at most a day.
 */
export function normalizeAlertLevel(
  raw: RawNarrativeAlertLevel | string | null | undefined,
): NarrativeAlertLevel | null {
  if (!raw || !ACTIVE_LEVELS.has(raw)) return null;
  return raw as NarrativeAlertLevel;
}

/** Drop retired and unknown values from a list of filter selections. */
export function normalizeAlertLevels(
  raw: readonly (RawNarrativeAlertLevel | string)[] | null | undefined,
): NarrativeAlertLevel[] {
  if (!raw) return [];
  return raw.map(normalizeAlertLevel).filter((level): level is NarrativeAlertLevel => level !== null);
}
