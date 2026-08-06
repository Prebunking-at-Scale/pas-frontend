/**
 * The spread-pattern taxonomy's two load-bearing guarantees.
 *
 * 1. The retired patterns (`alert`, `watch`, `none`) can never reach the screen. They
 *    still exist in the Postgres enum so a stale query parameter returns an empty
 *    result rather than a 400, and old rows may still carry one until the next pipeline
 *    run reclassifies them — so the frontend has to refuse them, not assume they are
 *    gone.
 * 2. The region geometry agrees with core-api's `NarrativeService._classify`. The
 *    boundaries are mirrored rather than fetched, so nothing but a test catches a drift.
 */
import { describe, it, expect } from 'vitest';
import { NarrativeSpreadPattern } from '~/types/api';
import {
  SPREAD_PATTERN_ORDER,
  SPREAD_PATTERN_OVERVIEW,
  SPREAD_PATTERN_VARIANT,
  SPREAD_REGIONS,
  classifySpreadPattern,
  normalizeSpreadPattern,
  normalizeSpreadPatterns,
} from '~/utils/spreadPatterns';

const RETIRED = ['alert', 'watch', 'none'];

describe('normalizeSpreadPattern', () => {
  it.each(RETIRED)('maps the retired pattern %s to null', (retired) => {
    expect(normalizeSpreadPattern(retired)).toBeNull();
  });

  it.each(Object.values(NarrativeSpreadPattern))('passes the current pattern %s through', (pattern) => {
    expect(normalizeSpreadPattern(pattern)).toBe(pattern);
  });

  it('treats absence as no badge rather than as a pattern', () => {
    expect(normalizeSpreadPattern(null)).toBeNull();
    expect(normalizeSpreadPattern(undefined)).toBeNull();
    expect(normalizeSpreadPattern('')).toBeNull();
  });

  it('refuses anything it does not recognise', () => {
    expect(normalizeSpreadPattern('VIRAL')).toBeNull();
    expect(normalizeSpreadPattern('something_new')).toBeNull();
  });
});

describe('normalizeSpreadPatterns', () => {
  it('drops retired values from a filter selection instead of forwarding them', () => {
    // Forwarding one would filter the list to nothing with no visible reason; dropping
    // it shows an unfiltered list, which is the honest reading of a filter we can no
    // longer apply.
    expect(normalizeSpreadPatterns(['viral', 'alert', 'watch', 'trending'])).toEqual([
      NarrativeSpreadPattern.VIRAL,
      NarrativeSpreadPattern.TRENDING,
    ]);
  });

  it('yields an empty selection when every value is retired', () => {
    expect(normalizeSpreadPatterns(RETIRED)).toEqual([]);
    expect(normalizeSpreadPatterns(null)).toEqual([]);
  });
});

describe('the renderable set', () => {
  it('offers exactly the four current patterns, and no retired one', () => {
    expect([...SPREAD_PATTERN_ORDER].sort()).toEqual([...Object.values(NarrativeSpreadPattern)].sort());
    for (const retired of RETIRED) {
      expect(SPREAD_PATTERN_ORDER).not.toContain(retired);
      expect(SPREAD_REGIONS.map((r) => r.pattern)).not.toContain(retired);
      expect(Object.keys(SPREAD_PATTERN_VARIANT)).not.toContain(retired);
    }
  });

  it('gives every renderable pattern a badge colour', () => {
    for (const pattern of SPREAD_PATTERN_ORDER) {
      expect(SPREAD_PATTERN_VARIANT[pattern]).toBeTruthy();
    }
  });
});

describe('the dashboard overview', () => {
  it('omits trending — the broad middle does not get a section', () => {
    expect(SPREAD_PATTERN_OVERVIEW).not.toContain(NarrativeSpreadPattern.TRENDING);
  });

  it('still surfaces the three patterns that make a specific claim', () => {
    expect(SPREAD_PATTERN_OVERVIEW).toEqual([
      NarrativeSpreadPattern.VIRAL,
      NarrativeSpreadPattern.EARLY_SURGE,
      NarrativeSpreadPattern.CONSOLIDATED,
    ]);
  });

  it('keeps trending reachable as a badge and a filter', () => {
    // Excluding it from the overview must not make it unreachable — it still needs a
    // colour to render with and a chip to filter by.
    expect(SPREAD_PATTERN_ORDER).toContain(NarrativeSpreadPattern.TRENDING);
    expect(SPREAD_PATTERN_VARIANT[NarrativeSpreadPattern.TRENDING]).toBeTruthy();
  });
});

describe('classifySpreadPattern', () => {
  // Verbatim transcription of NarrativeService._classify (core/narratives/service.py).
  // Deliberately written out rather than derived from SPREAD_REGIONS: a test that shares
  // the implementation's structure cannot detect the implementation being wrong.
  const backend = (composite: number, accel: number): NarrativeSpreadPattern | null => {
    if (composite >= 0.80 && accel >= 0.80) return NarrativeSpreadPattern.VIRAL;
    if (composite <= 0.40 && accel >= 0.50) return NarrativeSpreadPattern.EARLY_SURGE;
    if (composite >= 0.50 && accel <= 0.40) return NarrativeSpreadPattern.CONSOLIDATED;
    if (composite >= 0.40 && accel >= 0.40) return NarrativeSpreadPattern.TRENDING;
    return null;
  };

  it('agrees with the backend across the whole plane', () => {
    let mismatches = 0;
    for (let i = 0; i <= 200; i++) {
      for (let j = 0; j <= 200; j++) {
        const composite = i / 200;
        const accel = j / 200;
        if (classifySpreadPattern(composite, accel) !== backend(composite, accel)) mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  });

  it('caps early_surge at small narratives — a large climber is not one', () => {
    expect(classifySpreadPattern(0.20, 0.90)).toBe(NarrativeSpreadPattern.EARLY_SURGE);
    expect(classifySpreadPattern(0.60, 0.90)).toBe(NarrativeSpreadPattern.TRENDING);
  });

  it('requires both axes for viral, so large-and-flat is consolidated instead', () => {
    expect(classifySpreadPattern(0.90, 0.90)).toBe(NarrativeSpreadPattern.VIRAL);
    expect(classifySpreadPattern(0.90, 0.10)).toBe(NarrativeSpreadPattern.CONSOLIDATED);
  });

  it('leaves the bottom-left unlabelled — the four regions do not tile the plane', () => {
    expect(classifySpreadPattern(0.10, 0.10)).toBeNull();
  });
});
