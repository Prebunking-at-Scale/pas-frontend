# Narrative spread patterns

How the frontend renders the narrative spread-pattern taxonomy, and what it depends on from
core-api. The design itself lives in core-api's `docs/narrative-spread-pattern-redesign.md`; this
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

| pattern | composite | acceleration | meaning |
|---|---|---|---|
| `viral` | ≥ 0.80 | ≥ 0.80 | among the largest, and still climbing |
| `early_surge` | ≤ 0.40 | ≥ 0.50 | still small, climbing fast |
| `consolidated` | ≥ 0.50 | ≤ 0.40 | large, no longer growing |
| `trending` | ≥ 0.40 | ≥ 0.40 | the broad middle, **excluding** the `viral` corner |
| *(no label)* | — | — | small **and** flat: everything the four leave out |

Two things a quadrant reading gets wrong. The regions are **rectangles, not quadrants**,
evaluated in the order above — `viral` is carved out of the `trending` box. And they do
**not tile the plane**: the bottom-left corner gets no label at all, and no label is
`spread_pattern === null`, not a pattern named "none".

### The quadrant draws `trending` with the `viral` corner carved out

`trending`'s rectangle strictly contains `viral`'s: anything at `≥ 0.80` on both axes
satisfies `≥ 0.40` on both too. Classification resolves it because `viral` is tested
first — but the plot has no evaluation order, so drawing both as plain rectangles made
the outlines cross and asserted that the top-right corner was trending.

`SPREAD_REGIONS` therefore carries an optional `excludes`, and `regionPath()` in
`NarrativeSpreadQuadrant.vue` renders `trending` as an L rather than a box:

```
(0.40,0.40) → (1,0.40) → (1,0.80) → (0.80,0.80) → (0.80,1) → (0.40,1)
```

No two region outlines overlap now, so every region encloses exactly the area it owns
and the reader does not need to know the evaluation order to read the plot. The
highlight drawn for the narrative's own region uses the same path — outlining
`trending` as a full rectangle would light up the `viral` corner it does not own,
which is exactly the case someone is most likely to be checking.

The excluded region always shares the parent's upper bounds on both axes, so the result
is an L traced in six points and never a shape with a hole. `excludes` is geometry and
description only: `classifySpreadPattern` ignores it, because order already decides the
answer and two sources of truth for the same overlap is how they drift apart.

The technical-details table is deliberately left showing the plain bounds. It is a
statement of each region's thresholds, and the plot is where the carve-out is legible.

`early_surge` is capped on composite on purpose. It is not "anything climbing" — a large
climber is `viral` if it clears both tops and `trending` otherwise.

## Decisions taken here

**Boundaries are mirrored, not fetched.** `utils/spreadPatterns.ts` holds the same six
numbers as core-api's `core/config.py` (`SPREAD_COMPOSITE_LO/MID/HI`,
`SPREAD_ACCEL_LO/MID/HI`). The frontend draws the regions, so it needs the geometry
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

**The evidence sits with the number, not in the collapsed panel.** Under the acceleration
figure, a line names what the day's rate was actually built from: how many of the
narrative's videos were re-measured, and how many were newly linked. Both halves matter
because either can be the entire rate — a re-fetch measures views we already had, an
arrival brings views we did not — and without them a rate computed over 2 of 63 videos
reads exactly like one computed over all 63. Counts only, deliberately: the share of
yesterday's views those videos cover is a second and harder number, and two proportions
on one line read as noise rather than as context. This replaces a line that lived inside
*Technical details*, where it was both unread and, worse, hidden precisely when it was
most needed: it required a re-fetch to render, so a narrative that grew purely by gaining
videos showed no evidence at all.

**Nothing observed is not zero growth.** A narrative can sit inside the day's cohort with
no video re-measured and none newly linked, in which case the two states the rate compares
are the same state and `change_views` is a hard zero for want of an observation. The panel
shows a dash and says so, rather than printing "0%", which is the same claim-we-cannot-make
the missing-rate case has always been careful about. It is a narrower test than it looks:
`refreshed_videos` alone stopped being the question when arrivals started counting.

**Both axes headline a magnitude, not a rank.** The virality tile shows the narrative's
own reach — its summed view count — with the percentile on the small line beneath it,
matching what acceleration already did with its daily view growth. A percentile in the
headline answers "larger than whom" while reading as a size: 88% is not 88 of anything,
and two narratives 30M views apart can sit a single percentile point away from each
other. The rank stays visible because it, not the raw score, is what the classifier read
and therefore the only answer to "why this badge".

The cost is the one acceleration already pays: the headline is the axis's dominant
component, not the whole axis. Reach is 62.5% of composite and engagement — a per-view
ratio, deliberately size-neutral — is the rest, so a narrative that ranks high on
engagement shows a modest headline beside a high rank. Both numbers are on screen, and
the technical panel holds the split.

**Colours follow meaning, not severity.** Red for `viral`, orange for `early_surge`,
yellow for `trending`, purple for `consolidated` — `red-600`, `orange-600`, `yellow-500`
and `purple-600` as the components set them. The old palette ran a red→yellow→orange→grey
ladder, which reads `consolidated` as a milder alarm when it is simply a different
statement about a narrative; purple is outside that ladder on purpose.

**Retired patterns map to null.** `none`, `alert` and `watch` still exist in the Postgres
enum so a stale `?spread_pattern=alert` returns an empty result instead of a 400, but the
classifier no longer emits them. `normalizeSpreadPattern` maps them to null rather than to
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
      "engagement_percentile": 0.7, "engagement_weight": 0.375,
      "reach_percentile": 0.5,      "reach_weight": 0.625,
      "engagement_score": 0.0325,   // <- the raw scores the ranks came from. Reach is a
      "reach_score": 77000000,      //    view count; the detail view headlines it.
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
3. **`reach_score`/`engagement_score` are optional.** Rows written before the backend
   recorded them carry only the ranks, so the virality headline falls back to the
   percentile. They fill in on the next pipeline run.

The component breakdowns in the technical-details panel are rendered from whatever
`<name>_weight` keys arrive rather than from a hardcoded list, so a backend reweighting
needs no change here. The panel previously hardcoded a velocity term and a threshold
table; both went stale the moment the pipeline changed.

## Related

- `utils/spreadPatterns.ts` — regions, colours, order, normalisation
- `components/NarrativeSpreadQuadrant.vue` — the percentile plane
- `components/NarrativeAnalysisIndicators.vue` — the detail panel
- `narrative-spread-pattern-redesign.md` (repo root; originally core-api `docs/`) — why the axes
  are what they are, and the five questions still open on the backend side
