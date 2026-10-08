# Alerts

How alerts work: what can trigger one, how they are configured, and what the frontend
needs from core-api. Alerts build on the search filters in [filters.md](filters.md):
a case in an alert is a saved search, minus the date.

## The model

An alert watches for **new elements entering a set**. The set is described with the
same filters as the search page. When an element enters the set, the alert has a
match, and the matches of the day are sent by email in one daily digest.

An alert is a set of **cases**, and each case has one of three **types**. The type
belongs to the case, not to the alert, so one alert can mix them.

| Type | Fires when |
|---|---|
| **1. New narrative** | a narrative enters the set, anywhere in the short videos collected |
| **2. New claim** | a claim enters the set, anywhere |
| **3. New claim in a narrative** | a claim of the chosen narrative enters the set |

Cases of type 3 follow one narrative, chosen for that case. Two cases of the same alert
can follow different narratives. From a narrative's page, a new alert starts with a
case following that narrative.

## Cases

An alert has one or more **cases**. Each case has its type (and its narrative, for
type 3) and a set of filters over that type's element: narratives for type 1, claims
for types 2 and 3.

- **Cases are combined with OR**: an element that matches any case is a match. It is
  reported once even if it matches several cases, and the digest says which cases
  it matched.
- **Filters inside a case follow the search rules**: OR within a filter, AND across
  filters, with the same matching rules per element as in [filters.md](filters.md).
- **A case needs at least one filter**, except a type 3 case: the narrative it
  follows is scope enough, so without filters it reports every new claim of that
  narrative, which the editor says under the case. A type 3 case still can't be saved
  without its narrative.
- **Example.** *Migration watch*: new narratives in Spanish about Migration (type 1)
  OR new narratives mentioning Frontex (type 1) OR new French claims in the Frontex
  flights narrative (type 3).

### Filters available per type

| Filter | 1. New narrative | 2. New claim | 3. New claim in a narrative |
|---|---|---|---|
| Topic | ✓ | ✓ | ✓ |
| Keywords | ✓ (title or claims) | ✓ | ✓ |
| Language | ✓ (of its claims) | ✓ | ✓ |
| Platform | ✓ (of its claims' videos) | ✓ | ✓ |
| Channel | ✓ (of its claims' videos) | ✓ | ✓ |
| Entities | ✓ | ✓ (through its narrative, see [below](#claims-not-yet-in-a-narrative)) | |
| Spread pattern | ✓ | | |
| Date | | | |

- Each type uses the filters of the matching search tab: Narratives for type 1, Claims
  for types 2 and 3. Type 3 drops entities because the narrative is already chosen.
- The date filter is never used: alerts are about what is new.

## When an element enters the set

An element **enters the set** the first time it matches a case, whether that
happens when the element is created or later on. Examples:

- **Type 1.** A narrative is created with one English claim. A week later it gets its
  first Spanish claim. For the case *narratives in Spanish about Migration* it enters
  the set then, and is reported then.
- **Type 2.** A claim is processed and matches: it enters the set as soon as it
  exists.
- **Type 3.** A claim enters the set when it joins the chosen narrative and matches.
  Claims that join through a narrative merge count as joining.

Rules that keep the alerts quiet and predictable:

- **Each element is reported at most once per alert.** It isn't reported again if it
  leaves the set and comes back, e.g. a narrative that goes Viral → Trending → Viral.
- **Creating an alert doesn't report what already matches.** At the moment an alert
  is created, or its cases are edited, what already matches is taken as the
  starting point. Only elements that enter the set afterwards are reported. The link
  on each case (**Open in search**, or **View narrative**) is where you see what
  matches today.
- **A disabled alert records nothing.** When it is enabled again, the starting point
  is taken again, as on creation.

## Daily digest

Decided 2026-10-06. The parts of an alert are called **conditions** (they were "cases").

- One email per day per recipient, in English, at 08:00 Europe/Madrid, covering the
  previous 24 hours. No email on a day without matches.
- Subject: the number of alerts triggered ("3 alerts triggered").
- Only the alerts that were triggered, newest first as in the alerts panel (fixed). Each one starts
  with **Alert: {name}** and then lists the elements, not the conditions one by
  one (an element can meet several conditions):
  1. **New narratives**
  2. **New claims in selected narratives**, grouped under each narrative
  3. **New claims**
- Each element appears once. A claim of a selected narrative is listed under that
  narrative only, not again under new claims; a new narrative and its new claims are
  both listed, each in its section.
- Each element shows only its title, in **bold**, followed (not bold) by the conditions
  it met in brackets, as a filter summary: *(Topic: Migration · Language: Spanish)*,
  several joined by "or".
- At most 5 elements per section; with more, **See all (N)** opens the alert's page in
  PAS, from where each condition's search or narrative can be opened.
- Recipient: the alert's creator only; no extra recipients (decided 2026-10-06).

## Editing an alert

1. Add cases. For each one, pick its type from the three, and for type 3 its
   narrative, chosen from a list **with a search box**: there are tens of thousands
   of narratives, so the list has to be searched by title rather than scrolled (the
   preview searches the ones it has loaded; in the app this is a call to the
   backend). The case then shows the search filters its type allows (table above). A
   new case starts with the previous case's type and narrative.
2. Check each case with the link next to its title: **Open in search** opens the
   search in a new tab with the case's filters, and on a case following a narrative
   **View narrative** opens that narrative. This is the check against cases that are
   too broad (hundreds of matches a day) or too narrow (nothing ever matches).
3. Name the alert, set recipients, enable it.

Changing a case's type keeps the filters the new type allows and drops the rest.

### Second version: two types, and "Belongs to this narrative"

A second editor drops the choice between types 2 and 3; it replaced the three-type
editor on 2026-10-01 and is the one at `/alerts-dev` (`/alerts-dev-v2` redirects there). A case
is either **New narrative** or **New claim**, and a New claim case has an optional
field, **Belongs to this narrative (optional)**: leave it empty and any new claim
matching the filters counts; pick a narrative and the claim must also belong to it.

The model doesn't change: a New claim case with a narrative is a type-3 case
(`new_claim_in_narrative`), so both editors show the same alerts and can be compared
side by side. What follows from that:

- Picking a narrative drops the case's **entities** filter, as type 3 doesn't allow
  it (table above); removing the narrative brings the field back, empty.
- A New claim case with a narrative needs no other filter (every new claim of that
  narrative counts); without one it needs at least one filter, as today.
- In the list, such a case shows **New claim** and **In the narrative: …**.

### From the search

The first card of the search results, **+ Add to alerts**, turns the current search into
a case:

The search becomes a *new narrative* case from the Narratives tab and a *new claim*
case from the Claims tab. Since the case carries its type, any alert can take it:

- **Add to an existing alert**: lists the user's alerts by name and adds the search to
  the chosen one as a new case. If the alert already has the same case (same type,
  narrative and filters), nothing is added and the user is told.
- **Create a new alert**: asks for a name and creates an alert with the search as its
  only case, enabled and sent to the user. A link opens the full editor instead,
  prefilled with the search.

The date range is left out, and the dialog says so. The card isn't shown on the
Videos tab (there are no video alerts) or when no filter an alert can use is set.

The alert list shows each alert's cases, each with its type, its narrative if it
follows one and its filters in short form (e.g. *Topic: Migration · Language:
Spanish*), and the date of the alert's last match. In the digest, each item says what
kind of match it is (new narrative, new claim, narrative change…).

## API contract

A proposal, to agree with core-api. Filter names are the ones in
[filters.md](filters.md#api-contract).

```jsonc
{
  "id": "…",
  "name": "Migration watch",
  "cases": [
    {
      "id": "…",
      "type": "new_narrative",    // new_narrative | new_claim | new_claim_in_narrative
      "narrative_id": null,       // required for new_claim_in_narrative
      "filters": {                // only the filters allowed for the case's type
        "topic_id": ["…"],
        "language": ["es"]
      }
    },
    {
      "id": "…",
      "type": "new_claim_in_narrative",
      "narrative_id": "…",
      "filters": { "language": ["fr"] }
    }
  ],
  "recipients": ["someone@example.org"],  // in addition to the creator
  "enabled": true,
  "last_match_at": "2026-09-21T06:00:00Z"
}
```

A case with keywords can also carry `"keyword_mode": "all"`, as in the search.

What the backend does:

- **Validate** that each case only uses the filters allowed for its type, and that
  its `narrative_id` is set exactly for type 3.
- **Evaluate** when claims and narratives are created or change (new claims, new
  claim assignments, merges, spread-pattern and metrics updates), using **the same
  filter implementation as search**.
- **Remember what was reported** per alert, so each element is reported once even if
  several cases match it (a narrative and a claim with the same id are different
  elements), and
  take the starting point when an alert is created, edited or enabled.
- **Send the daily digest**, as described above.
- **Expose recent matches**: `GET /api/alerts/{id}/matches` (paginated, newest
  first), for the alert list and a future "what triggered this" view.

Checking a case needs nothing beyond the search endpoints and the narrative page. A
`narrative_id` filter on the claims search would also let a type 3 case link to its
claims in the search, rather than to the narrative.

### Existing alerts

Today's alert types map onto the new model:

| Today | New |
|---|---|
| `narrative_with_topic` | One case of type 1 with that topic |
| `keyword` | One New narrative condition with that keyword: it matches the narrative's title or any of its claims, like Research (decided 2026-10-06; today it matches title and description) |
| `narrative_views`, `narrative_claims_count`, `narrative_videos_count` + threshold | **Dropped** (decided 2026-10-05; 14 alerts in production, owners not e-mailed) |

After migration, starting points are taken as for a new alert, so nobody gets a
burst of old matches.

## Dev preview

Until core-api implements alerts, `/alerts-dev` (the two-type editor) runs against a
mock, like the search
page does ([filters.md](filters.md#dev-preview)). It only exists in dev and test builds.

| Piece | File |
|---|---|
| List and editor | `components/alerts/AlertListView.vue`, `components/alerts/AlertEditView.vue`, mounted by `pages/alerts-dev/` (two types; `pages/alerts-dev-v2/` only redirects there). The three-type code paths are still in the components, unused |
| Components | `components/alerts/` (case editor with its type picker, case summary, digest preview, add-from-search card and dialog) |
| Model and validation, shared with the mock | `utils/alertRules.ts` |
| Filter options, shared with search | `composables/useSearchFilterOptions.ts` |
| Client | `services/devAlerts.ts` |
| Mock API | `server/api/dev/alerts/` (CRUD, `digest`) |
| Case evaluation | `server/devAlerts/evaluate.ts`, on the search fixture and matcher |

- Alerts live in memory, seeded with examples of every case type (one alert mixes
  them), and reset when the server restarts.
- There is no stream of new elements in dev, so the digest preview shows what
  matches **today**, as if all of it had just entered the set. "Reported once" and
  the starting point can't be seen in dev.
- **+ Add to alerts**, the last card of the search results, is implemented as described
  in [From the search](#from-the-search).
- In the app, alerts about one narrative are created from the narrative's page. The
  dev editor picks the narrative from a list instead, since fixture narratives have no
  pages.
- The dev pages are marked `devPreview` in their page meta, so they open without a
  backend session. That flag is ignored outside dev and test builds.
- `tests/utils/alertRules.test.ts` and `tests/devAlerts/evaluate.test.ts` pin the
  rules.

## Open questions

- **Today's threshold alerts have no home.** Watching a narrative's growth (views,
  claims or videos above a threshold, or "becomes Viral") was dropped, and existing
  alerts of those kinds can't be migrated. To decide: delete them and tell their
  owners, or bring the type back later.
- <a id="claims-not-yet-in-a-narrative"></a>**Claims not yet in a narrative.** An
  entity filter on a type 2 case works through the claim's narrative. If claims
  are processed before being grouped into narratives, the claim can only enter the
  set once it is grouped. core-api to confirm when grouping happens; if it is later,
  claims are checked again when they are grouped.
- **The chosen narrative disappears.** If the narrative of a type 3 case is
  merged into another, the case should follow the resulting narrative. If it is
  deleted, the case is removed (the alert is disabled if it was its only case) and
  the creator is told in the next digest.
- **Entities on claims.** Until claims have their own entities, a *new claim* alert
  with an entity reports every new claim in a narrative with that entity, labelled
  "Via its narrative", even when the claim doesn't name it.
- **Spread pattern and score on other elements.** [filters.md](filters.md) still has
  them as one-tab filters. If they become filters for every tab, the table of filters
  per type above gains them too.

## Decisions

- **Three types**, in a row: new narrative, new claim, new claim in a narrative. A
  fourth, watching a chosen narrative's growth (spread pattern, views, claims, videos),
  was designed and then dropped as too much: a 2×2 grid of types read as complex.
- **The type belongs to each case, not to the alert.** One alert can watch a topic
  across all short videos and follow a specific narrative at the same time, so an
  alert is organised by subject ("Migration watch"), not by mechanism. It also lets
  any search be added to any alert.
- **A case is a saved search without the date.** Search and alerts share their
  filters, their matching rules and, in the backend, their implementation, so the
  search shows exactly what the alert would react to.
- **Enter the set, once.** Matching on the first time an element matches, not only
  at creation, catches narratives that grow into a case. Reporting each element once
  per alert, with a starting point on creation, keeps the digest to what is new.
- **Daily email digest**, to keep broad alerts from sending hundreds of emails.
