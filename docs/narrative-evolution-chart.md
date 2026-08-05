# Narrative evolution chart

What "Evolution of the narrative" plots on the narrative detail page
(`components/NarrativeEvolutionChart.vue`), and why.

## Two tabs

**Absolute numbers** — reach and engagement on their own axes, described below.

**Normalised** — both series expressed as standard deviations from their own mean, on one
shared axis (`utils/normalise.ts`). The tab is labelled just "Normalised"; z-score is the
mechanism, not a name a reader of the page needs.

Its caption repeats the absolute view's two sentences and adds "Both variables are
normalized for ease of comparison." The repeated sentences come from `*ExplanationPlain`
keys, which are the same text minus the "(left axis)" / "(right axis)" parentheticals —
this view has one axis, so naming sides would describe a layout that is not on screen.

The two tabs answer different questions. The absolute view says how big the narrative got
and how engaged its audience was. It cannot answer "did engagement move *with* reach",
because the two axes are scaled independently — the point where the lines cross is an
artefact of the scaling, not a fact about the narrative. The normalised view can: a point
at +1 is one deviation above that series' own average, whichever series it belongs to, so
lines rising together really did move together.

Details that matter:

- **Population standard deviation** (÷ N), not sample (÷ N-1). The series *is* the
  population; there is no wider set of days being inferred about.
- **A flat series gets zeros, not NaN.** 0/0 would blank the line, and a missing line
  reads as missing data rather than as "this never changed" — which for a two-point
  narrative is the true statement.
- **Zero lands on a gridline**, via `symmetricBounds` and an odd tick count. The sign is
  the whole message in this view; an axis whose zero falls between gridlines makes
  "above average" a matter of squinting.
- **The tooltip carries the raw value in brackets** — `+1.42 σ (24.3M)`. A z-score alone
  says nothing about what was actually reached.

This is *not* the old "Normalised" tab that was removed. That one divided each series by
its own maximum, which forced every line to end at 100% and made every narrative look
identical; the only thing its shape could show was the order in which the series got
there. Z-scores keep the shape and make the units comparable, which is what that tab was
reaching for and failed to do.

## Two lines, not three

The chart shows **reach** and **engagement** per date. It used to show three raw
counters — views, likes, comments — plus a "Normalised" tab that rescaled all three to a
percentage of their own maximum.

Both are gone:

- **Views / likes / comments** are inputs, not answers. Two of the three lines shared a
  right-hand axis and were read against each other, which is a comparison nobody needs:
  likes and comments only matter relative to the views that produced them.
- **The normalised tab** made every narrative look identical. Dividing each series by its
  own maximum forces all three lines to end at 100%, so the only thing the shape could
  ever show was the order in which they got there.

## What the two lines are

| line | axis | value |
|---|---|---|
| Reach | left, absolute | `cumulative_views` on that date |
| Engagement | right, percentage | `(likes × w_likes + comments × w_comments) / views × 100`, from the same cumulative totals |

The ×100 lives in the component, not in `utils/engagement.ts`: the helper mirrors
core-api's `engagement_score` and returns the raw 0–1 ratio, which is what the tests
pin it to. Only the display is a percentage.

Engagement is deliberately **the same quantity the Composite Virality Index scores** on
its engagement axis — core-api's `engagement_score` in `get_composite_cohort`. The chart
and the indicators panel therefore describe the same narrative in the same terms: the
panel gives today's percentile, the chart gives the path that led to it.

Because engagement is a rate and reach is a count, they cannot share an axis. Reach keeps
the zero-based left axis; the engagement axis is **not** zero-based on purpose — the rate
lives in a narrow band around 0.0x and pinning it to zero flattens every real movement
into a straight line.

## The engagement axis has a floor, and adaptive tick precision

Fitting the axis to the data exactly is the opposite failure: a rate that is *genuinely*
flat gets its last few float digits stretched across the full plot height, drawing a
dramatic curve out of nothing. `engagementAxisBounds` therefore pads the band to at least
20% of the value it sits around. Real variation still fills the chart; noise stays
visibly flat.

Tick labels take their precision from the tick step (`engagementRateDecimals`) rather than
a fixed 3 decimals. With a fixed count, a narrow band prints **the same label on every
gridline** — an axis reading `0.075` from top to bottom. The rule is "enough decimals to
write the step exactly", not "enough to tell two ticks apart": a 0.25 step is
distinguishable at one decimal but renders evenly-spaced gridlines as `6.5, 6.8, 7.0, 7.3`.

## Both axes share one set of gridlines

Gridlines are drawn for the left scale only — the right sets `drawOnChartArea: false`, or
the two grids cross-hatch the plot. But each scale otherwise picks its own tick count, so
the right-hand percentages land *between* the visible gridlines and read as belonging to
nothing.

`utils/chartAxis.ts` fixes that by giving both scales an explicit min, max and tick
`count`. Chart.js then spaces `count` ticks evenly across each range, so tick *i* sits at
the same height on both.

Two things make that survivable rather than ugly:

- **`alignedBounds`** rounds the step into a round-number family and widens the range to
  fit, so shared-count axes still carry readable labels. It grows the step until the top
  tick clears the data — rounding the minimum down eats headroom, and an axis whose top
  sits below its own line would clip it.
- **`bestTickCount`** picks the count, scoring candidates by the **worst** stretch across
  both axes rather than the total. Choosing for reach alone lands on 8 ticks: fine for
  reach (11.7% headroom), ruinous for engagement, which gets stretched from a 0.8–7.4%
  series onto a 0–14% axis and uses half the height.

The step family is deliberately wider than the textbook `1 / 2 / 2.5 / 5 / 10`. Because
the count is shared, a coarse family forces one axis to round a long way: 31.3M over 4
divisions wants 7.83M and would take 10M, wasting 28% of the plot. With 8M available it
wastes 2%.

> **Dev data caveat.** On seeded local data engagement is a constant 0.075 for every
> narrative on every date, and no chart fix will change that: the studio CSV carries no
> likes or comments, so `scripts/seed_data.py` synthesises them as fixed ratios of views
> (`likes = views // 20`, `comments = views // 200`). That is exactly
> `(0.05 + 5 × 0.005) = 0.075`. A flat engagement line locally is the seed, not the code.

Each point's tooltip prints the reach and the engagement rate, plus the likes and comments
the rate was computed from — a ratio on its own hides whether it moved because
interactions rose or because views did.

## The caption understates the formula, deliberately

The caption reads:

> Engagement is the total number of likes and comments as a percentage of the total
> number of views.

The chart does not compute that. It weights comments ×5, so a reader who adds the likes
and comments from the tooltip and divides by reach will get a **smaller** number than the
line shows — 3.96% against 5.06% on the narrative used to check this.

This was raised with the user on 2026-08-05, with the alternatives spelled out (drop the
weight to match the caption, or reword the caption to mention it), and the simplified
wording was chosen anyway. It is a plain-language caption over a weighted metric, not an
oversight — do not "fix" the mismatch in either direction without asking. If the caption
is ever reworded, `narratives.evolution.engagementExplanation` exists in all four locales
and no longer takes the weight interpolations it used to.

## The weights

`VIRALITY_SCORE_LIKES_WEIGHT` (default 1) and `VIRALITY_SCORE_COMMENTS_WEIGHT`
(default 5), read from `runtimeConfig.public` in `nuxt.config.ts`. The env var names are
the **same ones core-api reads** (`core/config.py`), so one deployment environment
configures both sides and they cannot silently disagree.

This is a mirror, not a fetch: no endpoint exposes the raw score or its weights — the
analysis-indicators API returns percentiles and the *composite blend* weights, which are
a different pair of numbers. `tests/utils/engagement.test.ts` pins the formula so a
backend change to it fails here rather than showing a plausible wrong number.

If the API later exposes the engagement score per date, the derivation in
`utils/engagement.ts` should be deleted in favour of the served value.
