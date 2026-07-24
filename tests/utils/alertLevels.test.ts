/**
 * The alert taxonomy's two load-bearing guarantees.
 *
 * 1. The retired levels (`alert`, `watch`, `none`) can never reach the screen. They
 *    still exist in the Postgres enum so a stale query parameter returns an empty
 *    result rather than a 400, and old rows may still carry one until the next pipeline
 *    run reclassifies them — so the frontend has to refuse them, not assume they are
 *    gone.
 * 2. The region geometry agrees with core-api's `NarrativeService._classify`. The
 *    boundaries are mirrored rather than fetched, so nothing but a test catches a drift.
 */
import { describe, it, expect } from 'vitest';
import { NarrativeAlertLevel } from '~/types/api';
import {
  ALERT_LEVEL_ORDER,
  ALERT_LEVEL_OVERVIEW,
  ALERT_LEVEL_VARIANT,
  ALERT_REGIONS,
  classifyAlertLevel,
  normalizeAlertLevel,
  normalizeAlertLevels,
} from '~/utils/alertLevels';

const RETIRED = ['alert', 'watch', 'none'];

describe('normalizeAlertLevel', () => {
  it.each(RETIRED)('maps the retired level %s to null', (retired) => {
    expect(normalizeAlertLevel(retired)).toBeNull();
  });

  it.each(Object.values(NarrativeAlertLevel))('passes the current level %s through', (level) => {
    expect(normalizeAlertLevel(level)).toBe(level);
  });

  it('treats absence as no badge rather than as a level', () => {
    expect(normalizeAlertLevel(null)).toBeNull();
    expect(normalizeAlertLevel(undefined)).toBeNull();
    expect(normalizeAlertLevel('')).toBeNull();
  });

  it('refuses anything it does not recognise', () => {
    expect(normalizeAlertLevel('VIRAL')).toBeNull();
    expect(normalizeAlertLevel('something_new')).toBeNull();
  });
});

describe('normalizeAlertLevels', () => {
  it('drops retired values from a filter selection instead of forwarding them', () => {
    // Forwarding one would filter the list to nothing with no visible reason; dropping
    // it shows an unfiltered list, which is the honest reading of a filter we can no
    // longer apply.
    expect(normalizeAlertLevels(['viral', 'alert', 'watch', 'trending'])).toEqual([
      NarrativeAlertLevel.VIRAL,
      NarrativeAlertLevel.TRENDING,
    ]);
  });

  it('yields an empty selection when every value is retired', () => {
    expect(normalizeAlertLevels(RETIRED)).toEqual([]);
    expect(normalizeAlertLevels(null)).toEqual([]);
  });
});

describe('the renderable set', () => {
  it('offers exactly the four current levels, and no retired one', () => {
    expect([...ALERT_LEVEL_ORDER].sort()).toEqual([...Object.values(NarrativeAlertLevel)].sort());
    for (const retired of RETIRED) {
      expect(ALERT_LEVEL_ORDER).not.toContain(retired);
      expect(ALERT_REGIONS.map((r) => r.level)).not.toContain(retired);
      expect(Object.keys(ALERT_LEVEL_VARIANT)).not.toContain(retired);
    }
  });

  it('gives every renderable level a badge colour', () => {
    for (const level of ALERT_LEVEL_ORDER) {
      expect(ALERT_LEVEL_VARIANT[level]).toBeTruthy();
    }
  });
});

describe('the dashboard overview', () => {
  it('omits trending — the broad middle does not get a section', () => {
    expect(ALERT_LEVEL_OVERVIEW).not.toContain(NarrativeAlertLevel.TRENDING);
  });

  it('still surfaces the three levels that make a specific claim', () => {
    expect(ALERT_LEVEL_OVERVIEW).toEqual([
      NarrativeAlertLevel.VIRAL,
      NarrativeAlertLevel.EARLY_SURGE,
      NarrativeAlertLevel.CONSOLIDATED,
    ]);
  });

  it('keeps trending reachable as a badge and a filter', () => {
    // Excluding it from the overview must not make it unreachable — it still needs a
    // colour to render with and a chip to filter by.
    expect(ALERT_LEVEL_ORDER).toContain(NarrativeAlertLevel.TRENDING);
    expect(ALERT_LEVEL_VARIANT[NarrativeAlertLevel.TRENDING]).toBeTruthy();
  });
});

describe('classifyAlertLevel', () => {
  // Verbatim transcription of NarrativeService._classify (core/narratives/service.py).
  // Deliberately written out rather than derived from ALERT_REGIONS: a test that shares
  // the implementation's structure cannot detect the implementation being wrong.
  const backend = (composite: number, accel: number): NarrativeAlertLevel | null => {
    if (composite >= 0.80 && accel >= 0.80) return NarrativeAlertLevel.VIRAL;
    if (composite <= 0.40 && accel >= 0.50) return NarrativeAlertLevel.EARLY_SURGE;
    if (composite >= 0.50 && accel <= 0.40) return NarrativeAlertLevel.CONSOLIDATED;
    if (composite >= 0.40 && accel >= 0.40) return NarrativeAlertLevel.TRENDING;
    return null;
  };

  it('agrees with the backend across the whole plane', () => {
    let mismatches = 0;
    for (let i = 0; i <= 200; i++) {
      for (let j = 0; j <= 200; j++) {
        const composite = i / 200;
        const accel = j / 200;
        if (classifyAlertLevel(composite, accel) !== backend(composite, accel)) mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  });

  it('caps early_surge at small narratives — a large climber is not one', () => {
    expect(classifyAlertLevel(0.20, 0.90)).toBe(NarrativeAlertLevel.EARLY_SURGE);
    expect(classifyAlertLevel(0.60, 0.90)).toBe(NarrativeAlertLevel.TRENDING);
  });

  it('requires both axes for viral, so large-and-flat is consolidated instead', () => {
    expect(classifyAlertLevel(0.90, 0.90)).toBe(NarrativeAlertLevel.VIRAL);
    expect(classifyAlertLevel(0.90, 0.10)).toBe(NarrativeAlertLevel.CONSOLIDATED);
  });

  it('leaves the bottom-left unlabelled — the four regions do not tile the plane', () => {
    expect(classifyAlertLevel(0.10, 0.10)).toBeNull();
  });
});
