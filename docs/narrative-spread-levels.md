# Narrative alert levels

How the frontend renders the narrative alert taxonomy, and what it depends on from
core-api. The design itself lives in core-api's `docs/narrative-spread-level-redesign.md`; this
file records the decisions that are ours.

## The taxonomy

Two axes, four regions.

- **Composite** — how far a narrative has spread. A *state*, so it is still meaningful
  for a narrative nobody looked at today, and it is ranked against every narrative ever
  measured (~22k).
- **Acceleration** — how fast that spread is changing, per day. A *rate*, so it needs
  two observations bracketing the day, and it is ranked only against the narratives
  re-measured that day (~2k).

Both are percentiles, never raw magnitudes: the scraper's coverage drifts, so an
absolute bar would mean something different every week.

| level | composite | acceleration | meaning |
|---|---|---|---|
| `viral` | ≥ 0.80 | ≥ 0.80 | among the largest, and still climbing |
| `early_surge` | ≤ 0.40 | ≥ 0.50 | still small, climbing fast |
| `consolidated` | ≥ 0.50 | ≤ 0.40 | large, no longer growing |
| `trending` | ≥ 0.40 | ≥ 0.40 | the broad middle |
| *(no label)* | — | — | small **and** flat: everything the four leave out |

Two things a quadrant reading gets wrong. The regions are **rectangles, not quadrants**,
evaluated in the order above — `viral` is carved out of the `trending` box. And they do
**not tile the plane**: the bottom-left corner gets no label at all, and no label is
`spread_level === null`, not a level named "none".

`early_surge` is capped on composite on purpose. It is not "anything climbing" — a large
climber is `viral` if it clears both tops and `trending` otherwise.

## Decisions taken here

**Boundaries are mirrored, not fetched.** `utils/spreadLevels.ts` holds the same six
numbers as core-api's `core/config.py` (`ALERT_COMPOSITE_LO/MID/HI`,
`ALERT_ACCEL_LO/MID/HI`). The frontend draws the regions, so it needs the geometry
locally. Those constants are environment-overridable on the backend: a deployment that
retunes them must update this file too. One definition that can drift is still better
than the four copies this replaced (badge, filter, dashboard, thresholds table).

**No badge means no badge.** Roughly 9% of narratives carry a label at any time — only
the day's acceleration cohort is classifiable, and the classifier clears everything
else. Cards therefore show a badge only when there is one, and say nothing otherwise.
The reason is not a card-sized question.

**The detail view always shows the measurements.** A narrative that was scored but fell
in the unbadged region shows its position exactly like a labelled one. A narrative with
no acceleration shows its composite and says the rate was not measured. What it must
never do is render a missing rate as zero — "we did not look" and "it did not move" are
different claims, and only one of them is ours to make.

**Colours follow meaning, not severity.** Red for `viral`, orange for `early_surge`,
neutral grey for `trending`, blue for `consolidated`. The old palette ran a
red→yellow→orange→grey ladder, which reads `consolidated` as a milder alarm when it is
simply a different statement about a narrative.

**Retired levels map to null.** `none`, `alert` and `watch` still exist in the Postgres
enum so a stale `?spread_level=alert` returns an empty result instead of a 400, but the
classifier no longer emits them. `normalizeSpreadLevel` maps them to null rather than to
a nearest equivalent, because the new regions sit on different boundaries and no
equivalent exists. A narrative still holding one is unbadged until the next pipeline
run, at most a day. Query parameters are normalised on read, so an old bookmark shows
an unfiltered list rather than an empty one.

## API contract

`GET /api/narratives/{id}/indicators`

```jsonc
{
  "composite_virality": {
    "indicator_value": 0.62,          // the weighted blend — NOT a rank
    "metadata": {
      "engagement_percentile": 0.7, "engagement_weight": 0.625,
      "reach_percentile": 0.5,      "reach_weight": 0.375,
      "percentile": 0.83            // <- the rank. This is what the classifier reads.
    }
  },
  "acceleration_rate": null,          // <- null = not re-measured that day
  "date": "2026-07-16"
}
```

Two traps:

1. **Use `metadata.percentile`, never `indicator_value`,** for anything positional.
   `indicator_value` is a weighted blend of two ranks and is not itself a rank.
2. **`acceleration_rate: null` means unmeasured, not zero.** Composite covers ~22k
   narratives and acceleration ~2k, so null is the common case.

The component breakdowns in the technical-details panel are rendered from whatever
`<name>_weight` keys arrive rather than from a hardcoded list, so a backend reweighting
needs no change here. The panel previously hardcoded a velocity term and a threshold
table; both went stale the moment the pipeline changed.

## Related

- `utils/spreadLevels.ts` — regions, colours, order, normalisation
- `components/NarrativeSpreadQuadrant.vue` — the percentile plane
- `components/NarrativeAnalysisIndicators.vue` — the detail panel
- `narrative-spread-level-redesign.md` (repo root; originally core-api `docs/`) — why the axes
  are what they are, and the five questions still open on the backend side
