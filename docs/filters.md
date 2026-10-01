# Filters

How search and filtering work across videos, claims and narratives, and what the
frontend needs from core-api to do it. This replaces the per-page filter sets
(`pages/videos`, `pages/claims`, `pages/narratives`), where each list had its own
filters and the same filter could mean different things on different pages.

## The model

There is one search with a single shared set of filters. The content type is not a
filter: it is a **tab** that picks which list of results is shown.

```
Videos (120) · Claims (340) · Narratives (12)
```

- Each tab shows its count for the current filters, so an empty combination is
  visible before switching to it.
- Filters stay the same when switching tabs. Switching tabs also applies the filters
  as they are in the form, so a change not yet applied (a channel removed, a keyword
  typed) isn't lost (decided 2026-10-01).
- All filters and the active tab live in the URL query, so a search can be shared
  and the back button works.

## Filters

| Filter | Values | Selection |
|---|---|---|
| Topic | topics from the backend (never hardcoded) | multiple |
| Entities | known entities, chosen with autocomplete | multiple |
| Keywords | free text | multiple |
| Language | closed list | multiple |
| Platform | TikTok, YouTube, Instagram | multiple |
| Channel | closed list, narrowed to the selected platforms; shown as removable chips | multiple |

The channel filter has an **Ours / All** switch next to its label. **Ours** puts the
organization's own channels (its channel feeds) into the filter, as chips, so the
search is limited to them; **All** takes those back out and leaves any channel picked
by hand. The switch shows **Ours** whenever every own channel is selected, however they
got there, and clicking the option already on does nothing. It starts on "All", so a
search isn't silently limited. The list itself always
holds every channel, with the organization's own first under their own heading.
| Date | range | one range |

Tab-specific filters are only shown on their own tab:

| Filter | Tab |
|---|---|
| Score range | Claims |
| Spread pattern | Narratives |

### Layout

Topic, language and keywords are always visible. Everything else (entities,
platform, channel, date and the current tab's own filter) sits behind a
**More filters** toggle. The toggle shows how many of those hidden filters are set,
and the panel starts open when the search in the URL already uses one of them, so an
active filter is never hidden.

### Saved selections

Keywords, entities and channels can have many values, so a selection can be saved
under a name and loaded again in one click.

- A **bookmark at the right end of the filter's box** opens the selections of that
  filter, as a menu floating over the filters below: it doesn't push them down, and
  it doesn't touch the filter itself (its options list stays closed, and the
  channels' Ours / All switch is unchanged). Clicking a selection **adds** its values
  to the filter's current ones, skipping duplicates, and the menu stays open so
  several can be combined, with each other and with values picked by hand. A
  selection whose values are all in the filter is ticked.
- **Save this selection**, at the bottom of that menu, is enabled only when the
  filter has something in it. It asks for a name, suggesting the first free
  "List #n", and saves the current values. Names are unique per filter, ignoring
  case.
- A selection someone saves is **theirs alone**: nobody else in the organisation sees
  it.
- The organisation's **defaults** are shared by everyone in it, and built from its
  feeds: **Our channels** (its channel feeds) and one keyword selection per topic,
  named after the topic (e.g. `Migration`). Each organisation only sees its own, so the
  names don't include it (decided 2026-10-01). Defaults are listed first
  and can't be deleted here: they change with the feeds. Selections people save can.
- Loading a channel selection keeps channels outside the selected platforms; the
  filter counts them, and they simply match nothing while that platform filter is on.

API: `GET /api/saved-selections?kind=keyword|entity_id|channel`,
`POST /api/saved-selections` `{ kind, name, values }` (422 with `name_taken` for a
duplicate name, defaults included), `DELETE /api/saved-selections/{id}` (403 for a
default). Each selection is `{ id, kind, name, values, is_default, created_at }`.

## Combining values

- **OR within a filter**: Topic = Climate, Health matches either topic.
- **AND across filters**: Topic = Climate and Language = ES must both hold.

There is no any/all option. Where a filter is checked on a narrative's or a
video's claims, "at least one claim" is always the rule. We may revisit this later.

### Keywords

- Several keywords are allowed, each one a separate value. They are never joined
  into one string.
- **Enter finishes a keyword**, and spaces are kept: `climate change` is one keyword,
  matched as a phrase. It finds "Climate Change" but not "change in the climate".
  Pasting a list adds one keyword per line; commas are part of a keyword.
- Typed keywords and saved selections combine: a saved selection **adds** its keywords
  to the ones already there (see [Saved selections](#saved-selections)). Duplicates
  are skipped, comparing without case, accents or hyphens. A button in the box clears
  them all.
- **Any or all.** By default a result needs **any** of the keywords, like every other
  filter (OR). With two keywords or more, a switch next to the label changes it to
  **all**: every keyword must be in the **same text**, the same claim, narrative
  title or video title. A narrative with "inmigrante" in one claim and "pisos" in
  another doesn't have both. The switch is kept in the URL (`keyword_mode=all`) and
  in alert cases made from the search.
- Matching ignores case and accents, reads hyphens as spaces and matches part of a
  word: `vacuna` finds `Vacunas` and `VACUNACIÓN`, `climate change` finds
  "climate-change".

### Topic

There is no "Unclassified" option (items without a topic). We dropped it because
its meaning for narratives got complicated: see [Decisions](#decisions).

## Where each attribute lives

Each attribute has one **home level**. A filter is checked at its home level and
carries to the other levels through the video → claim → narrative links.

| Attribute | Home level |
|---|---|
| Channel, platform, date (upload date), video title | video |
| Topic, language, claim text | claim |
| Entities, narrative title | narrative |

A claim's topic is the one the narratives service's classifier predicts (`claim_topics`),
so only claims the narratives service processed (score 2.5 or more) have one.

Topic and keywords also exist at the narrative level (narrative topic, narrative
title), so a narrative can match them directly.

## Matching rules per tab

### Claims

A claim card shows **the narrative it belongs to** above the video it comes from, with
a **+N** when the claim is in more than one (the API returns them per claim).

A claim matches when every active filter holds for the claim or its video:

- topic, language and keyword on the claim itself;
- channel, platform and date on the claim's video;
- entities on the claim's narrative.

### Videos

A video matches if it passes its own filters (channel, platform, date) and has at
least one claim that passes all the claim filters above.

A keyword can also match the **video title** directly. When it does, the video
doesn't need a claim that matches the keyword.

### Narratives

A narrative **N** matches if it has at least one claim **c** such that every active
filter is satisfied either by N itself or by c (and c's video):

| Filter | Checked on N | Checked on c |
|---|---|---|
| Topic | N's topic | c's topic |
| Keywords | N's title | c's text |
| Entities | N's entities | — |
| Language | — | c's language |
| Channel, platform, date | — | c's video |

All the filters that are checked on claims must hold for **the same claim**. With
Language = ES and Channel = X, the narrative needs one claim that is both in Spanish
and from X, not a Spanish claim and a different claim from X.

Example: with Topic = Climate and Channel = X, a narrative whose own topic is
Climate matches if it has at least one claim from channel X, even when that claim
has no topic.

**Keywords are the exception** (decided 2026-10-01): when any filter checked on c is set
(language, channel, platform, date), the keywords must be in c's text, not N's title.
With Keywords = Russia, Language = EN and Platform = TikTok, a narrative titled "The
Russian invasion…" whose only English TikTok claim doesn't mention Russia does not
match, so the Narratives tab agrees with the Claims and Videos tabs. Without those
filters, the title still matches on its own.

### The "Matching claims" tab

A result on the Videos or Narratives tab can match on its own fields or through its
claims. The two cases are shown differently: a result found through its claims
carries a small folder tab on its card's top-left corner reading **Matching claims**,
which explains on hover that it matched through its claims.

- **Narratives**: if topic, keywords and entities were all satisfied by the narrative
  itself, there is no tab. If any of them needed a claim, the narrative gets it.
- **Videos**: if a keyword matched only through a claim and not the video title,
  the video gets it.
- **Claims** don't, but have their own label: see below.

Language, channel, platform and date don't add the tab. They can only be
checked on claims, so they would put it on almost every result.

### The "Via its narrative" label

Entities exist on narratives, not on single claims, so an entity filter can only
match a claim through its narrative. Those claims show **"Via its narrative: mentions
Pfizer"**, with a tooltip saying so, in the search, the alert previews and the digest.
Without the label, a Pfizer search listing claims that never mention Pfizer looks
wrong.

A claim whose own text names the entity gets no label. That's a text match on the
entity's name, a stopgap: the real fix is entities extracted per claim (open
question for core-api). With those, the Claims tab would filter on the claim's own
entities and this label would go away. The API reports it as
`match_source: "narrative"` plus `via_entity_ids` on the claim.

## API contract

Filtering can't be done in the frontend: results are paginated and the rules need
joins across levels. The three list endpoints (or a single search endpoint) must
accept the same set of parameters:

| Param | Type | Notes |
|---|---|---|
| `topic_id` | repeated | OR |
| `entity_id` | repeated | OR |
| `keyword` | repeated | OR, or AND with `keyword_mode`; case/accent-insensitive substring |
| `keyword_mode` | `any` \| `all` | `all`: every keyword in the same claim or title. Default `any` |
| `language` | repeated | OR |
| `platform` | repeated | OR |
| `channel` | repeated | OR; the channel list endpoint accepts `platform` to narrow its options |
| `date_from`, `date_to` | date | video upload date |
| `min_score`, `max_score` | number | claims only |
| `spread_pattern` | repeated | narratives only |

Responses need:

- `match_source: "direct" | "claims"` on each video and narrative, to drive the
  label, and `"direct" | "narrative"` (with `via_entity_ids`) on each claim.
- Counts for all three tabs for the current filters, either from one counts
  endpoint or as `count` on each list response.

Today the endpoints accept different parameters: videos have no topic, claims have
no channel, platform or date, and keywords are sent as one space-joined `text`
string. Parameter names above are a proposal, to agree with the backend.

## Decisions

- **Content type is a tab, not a filter**, so the counts per tab make empty results
  visible and filters stay the same when switching.
- **A filter applies to every tab** by carrying through the video → claim → narrative
  links. We don't silently return nothing (e.g. "topic selected, so no videos").
- **Claim-level filters must match the same claim.** It's what users expect, and it
  keeps the tabs consistent with each other.
- **No any/all option.** "At least one claim" is nearly always the intent. "All
  claims" gives almost nothing for channel and platform, since narratives spread
  across channels by nature.
- **Narratives and videos can match directly or through claims**, and the label tells
  the two apart. Narrative topic and claim topic are independent: a narrative can
  have a topic that its claims don't.
- **No "Unclassified" topic.** Under the rule above, a narrative with topic Climate
  would match "Unclassified" through any claim without a topic, which isn't what
  anyone means. Not worth the extra rule for now.
- **Entities use autocomplete, not free text**, matching by id rather than fuzzy
  text.

## Implementation

The Research page (`pages/search.vue`, route `/search`) runs on core-api's
`/api/search` and `/api/saved-selections`; the plan, the decisions and what production
looks like are in [research-implementation.md](research-implementation.md).

| Piece | File |
|---|---|
| Page | `pages/search.vue` |
| URL state (query ↔ filters ↔ API params) | `utils/searchQuery.ts` |
| Filters | `components/filters/MultiSelectFilter.vue`, `KeywordTagsFilter.vue`, `FilterToggle.vue`, `SavedSelectionsMenu.vue`, `DateRangeFilter.vue` |
| Filter options (topics, claim languages, entities and channels searched on the server) | `composables/useSearchFilterOptions.ts` |
| "Ours" | `composables/useOwnChannelsFilter.ts` |
| Saved selections | `composables/useSavedSelections.ts`, `utils/savedSelections.ts`, `services/savedSelections.ts` |
| Label | `components/MatchSourceBadge.vue` |
| Client | `services/search.ts` |

- The URL keeps the upload dates as days (`date_from`, `date_to`); the API gets the
  start of the first and the end of the last in the viewer's time zone
  (`start_date`, `end_date`).
- Entities are searched from 2 characters and channels from 3; the organisation's own
  channels are listed before anything is typed.
- Tab counts stop at 10,000 and show "10,000+"; so does paging.
- Result cards open the narrative's or the video's page; a claim opens its video at
  the moment it's said.
