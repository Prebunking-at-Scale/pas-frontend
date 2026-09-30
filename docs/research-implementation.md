# Research: implementation plan

**Status:** approved, 30 September 2026.

How the approved Research page (today the dev preview at `/search`, specified in
[filters.md](filters.md)) moves onto core-api. It covers what we build in core-api and in
this frontend, what we deliberately leave out, and the order of the work.

Checked against core-api `main` (`b19f0de`) plus `feat/date-filters-uploaded-at`
(`c381cff`), which will be merged first, the narratives service
(`prebunking-narratives`, `53df635`) and read-only samples of production on
30 September 2026. Paths are in core-api unless they start with a frontend folder.
This document supersedes the search and saved-selection parts of the earlier
backend-feasibility review.

## Decisions

| Decision | Why |
|---|---|
| **New endpoints under `/api/search/`**; the existing `/api/narratives`, `/api/claims` and `/api/videos` lists stay as they are. | Those lists feed the old list pages and the detail pages. Nothing that works today changes. |
| **Sort:** claims and videos by the video's upload date, newest first; narratives by creation date, newest first. | What was found most recently, for content; what was grouped most recently, for narratives. |
| **A claim's topics are its `metadata.topics`**, the topics the claim finder assigns at ingestion. Not `claim_topics`, and never the topics of the claim's narrative. | `metadata.topics` is on every claim; `claim_topics` only on claims scoring 2.5 or more (see [Topics on claims](#topics-on-claims)). |
| **The Claims tab shows every claim.** The only organisation-based narrowing is **Ours**, which fills the channel filter with the organisation's channel feeds. | Content is global in core-api; "Ours" is a channel choice, not a scope. |
| **Saved selections a person creates are theirs alone**, within their organisation. The organisation's defaults (from its feeds) are shared by everyone in it. | Personal working lists shouldn't clutter colleagues' menus. A person belongs to one organisation. |
| **Default selections are named after the organisation's `short_name`**: `<short_name>-channels`, `<short_name>-<Topic>`. | Short and already unique per organisation. |
| **Upload-date filtering comes from `feat/date-filters-uploaded-at`**, merged before this work (its migration is 23). | It already implements the date rule and its index. |
| **Keyword matching ignores case, accents and hyphens**, backed by trigram indexes (migrations 24 and 25). | The rule in filters.md, at the size of production. |
| **Tab counts are exact up to 10,000**, then shown as "10,000+". | Exact counts over 4 million claims with broad filters take seconds. |

## What core-api has today

- **Stack:** Litestar, raw SQL with psycopg 3, Postgres 17. Numbered SQL migrations run at
  startup (`core/migrate.py`, target in `core/app.py`).
- **The three lists take different, mostly single-valued filters** and implement them
  differently:
  - `GET /api/videos` (`core/videos/repo.py:224-278`): `platform`, `channel` (substring
    matches), `text` (title or description), `language` (the **video's** language).
  - `GET /api/claims` (`core/videos/claims/repo.py:256-332`): `topic_id` (through
    `claim_topics`), `text`, `language` (the **claim's**), `min_score`, `max_score`.
  - `GET /api/narratives` (`core/narratives/repo.py:347-617`): `topic_id`, `entity_id`,
    `text` (title or description), `language` (any linked claim's), dates, and a
    repeatable `spread_pattern`.
  - The date branch adds `start_date`/`end_date` on the video's `uploaded_at` to all three.
- **Text search** is `LOWER(x) LIKE '%term%'`: no accents handling, no index can serve
  it. The only extensions are `vector` and `pgcrypto`.
- **Per-item queries:** `/api/videos` runs about 5 queries plus one per claim for each
  video and returns full transcripts; `/api/claims` runs 4 extra queries per claim.
  `/api/narratives` is a single query.
- **Nothing exists** for counts across the three types, a list of channels from videos,
  `match_source`, or saved selections.
- **Content is global.** Only `media_feeds` (with `keyword_feeds` and `channel_feeds`) and
  alerts belong to an organisation. The user's token carries their organisation
  (`core/auth/service.py:53-87`, dependency `organisation` in
  `core/auth/dependencies.py`).
- **Entities on claims are empty in practice.** The narratives service sends
  `"entities": []` for new claims and never extracts entities for claims; only
  `narrative_entities` is filled.
- **Tests** run against a real temporary Postgres (`tests/conftest.py`). None of the list
  endpoints has filter tests.

## Production, 30 September 2026

Read with GET requests through the API, sequentially.

| | |
|---|---|
| Claims | 4.08 million, about 14,000 new a day |
| Videos | 1.11 million |
| Narratives | 25,282 |
| Entities | 7,718 |
| Claim language, claim score | on every claim sampled |
| Video languages | 147 |
| Channels | 114 distinct in a sample of 189 videos: hundreds of thousands in total |
| Claims in a narrative | 2–9% |

### Topics on claims

A claim can carry two sets of topics, both its own:

| | Set by | When | On |
|---|---|---|---|
| `metadata.topics` | the claim finder (`harmful-claim-finder` v0.7.0), in the same LLM call that extracts the claim | at ingestion | 55–88% of claims |
| `claim_topics` | the narratives service's classifier (`get_topics`, `dashboards/dashboards.py:1506`) | only for claims scoring `MIN_SCORE` or more (2.5 in production) | 4–9% of claims |

- In a sample of 800 claims, none scoring below 2.5 had `claim_topics`, whatever its
  age (under an hour, one day, twelve days): the narratives service drops them before
  classifying (`filter_claims_by_score`, `dashboards/dashboards.py:57`). About 92% of
  claims score below 2.5.
- `metadata.topics` is decided from keyword lists: core-api passes the claim finder, per
  organisation the video was collected for, a `{topic id: keywords}` map (the
  organisation's `keyword_feeds` over the defaults in `core/analysis/keywords.py`), and
  the model tags each claim with the topics whose keywords it relates to. Claims that
  relate to no topic aren't extracted. Nothing validates the answer: a few values are
  keywords instead of topic ids ("kerncentrale"), which a filter by id simply never
  matches.
- Where both exist they overlap on 26 of 31 sampled claims.

## Backend (core-api)

### Migration 24: extensions, text function, saved selections

A normal migration in one transaction; it takes seconds.

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- "Vacunación contra-la GRIPE" -> "vacunacion contra la gripe"
CREATE FUNCTION normalize_text(t text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  RETURN lower(unaccent('unaccent', replace(t, '-', ' ')));

CREATE TABLE saved_selections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('keyword', 'entity_id', 'channel')),
  name            text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  values          text[] NOT NULL CHECK (cardinality(values) > 0),
  created_at      timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX saved_selections_owner_name
  ON saved_selections (organisation_id, user_id, kind, lower(name));

COMMIT;
```

- **`unaccent`** removes accents; **`pg_trgm`** splits text into three-letter pieces so
  an index can answer "contains this text anywhere", which `LIKE '%term%'` can't use
  today. Both ship with Postgres and are supported on Cloud SQL; the database user
  already created `vector` and `pgcrypto` (to confirm before release).
- **`normalize_text`** makes the keyword rule one comparison:
  `normalize_text(claim) LIKE '%' || normalize_text(keyword) || '%'`. It is declared
  `IMMUTABLE` so indexes can be built on it; `unaccent` alone isn't.
- **`saved_selections`** holds only what people save. Every query filters on both
  `organisation_id` and `user_id`. The unique index blocks duplicate names per person and
  kind, ignoring case, and serves "list my selections of this kind". Defaults aren't
  stored: see [Saved selections](#saved-selections).
- **Topics need nothing**: `metadata.topics` lives in `video_claims.metadata`, whose
  GIN index (migration 14) answers `metadata @> '{"topics": ["<id>"]}'`.

### Migration 25: search indexes

| Index | Serves | Rows |
|---|---|---|
| `video_claims USING gin (normalize_text(claim) gin_trgm_ops)` | keywords on claim text | 4.1M |
| `videos USING gin (normalize_text(title) gin_trgm_ops)` | keywords on video titles | 1.1M |
| `narratives USING gin (normalize_text(title) gin_trgm_ops)` | keywords on narrative titles | 25k |
| `videos (platform, lower(channel))` | platform and channel filters | 1.1M |
| `videos USING gin (lower(channel) gin_trgm_ops)` | the channel list's search box | 1.1M |
| `video_claims ((metadata->>'language'))` | language filter | 4.1M |
| `narratives (spread_pattern)` | spread-pattern filter | 25k |
| `narratives (created_at)` | narratives sort | 25k |
| `narrative_topics (topic_id)` | a narrative's own topic (its key starts with `narrative_id`) | small |

Already covered: upload date (migration 23), claim topics (migration 14), and the links
from narratives to claims and entities in both directions (`claim_narratives`,
`narrative_entities`, migrations 7 and 12).

**Why a separate migration, and how it reaches production.** The runner executes every
migration inside a transaction, so it can only build indexes with a plain
`CREATE INDEX`, which blocks writes to the table until it finishes. On `video_claims`
that is several minutes (the claim-text index is probably 1–2 GB), during which
ingestion stops and the new core-api can't finish starting. So:

1. Before deploying, run a one-off script that builds these indexes with
   `CREATE INDEX CONCURRENTLY` (no write lock; it can't run in a transaction).
2. Migration 25 holds the same statements with `IF NOT EXISTS`, without a transaction
   (like migrations 14 and 23). In production it finds them built and does nothing; on
   fresh, local and test databases it builds them.

Teaching the runner to run statements outside a transaction would be cleaner, but it
changes what every migration relies on; not now.

Not included: no change to existing columns or data, no backfill, no score index (score
only narrows results already cut by other filters), and no down migrations (the
repository has none).

### Search module: `core/search/`

A new module with its own controller, service and repository. One shared builder turns
the filters into SQL, so every tab and the counts apply the same rules.

**Endpoints** (authenticated, with the `organisation` dependency):

| Route | Returns |
|---|---|
| `GET /api/search/narratives` | `{data, total, total_capped, page, size}` |
| `GET /api/search/claims` | same |
| `GET /api/search/videos` | same |
| `GET /api/search/counts` | `{narratives: {total, capped}, claims: {…}, videos: {…}}` |

**Parameters**, the same on all four (tab-specific ones ignored elsewhere):

| Param | Type | Rule |
|---|---|---|
| `topic_id` | repeated uuid | OR |
| `entity_id` | repeated uuid | OR |
| `keyword` | repeated text | OR; with `keyword_mode=all`, every keyword in the same text |
| `keyword_mode` | `any` \| `all` | default `any` |
| `language` | repeated text | OR, on the claim's language |
| `platform` | repeated text | OR, exact |
| `channel` | repeated text | OR, exact, ignoring case |
| `start_date`, `end_date` | date | the video's `uploaded_at`, both inclusive (as in the date branch) |
| `min_score`, `max_score` | number | claims only |
| `spread_pattern` | repeated enum | narratives only |
| `limit`, `offset` | int | `limit` 1–100, default 12 |

The frontend keeps its own URL names (`date_from`/`date_to`) and maps them.

**Matching rules** ([filters.md](filters.md#matching-rules-per-tab)), with *C* the
claim-level conditions: topic in `c.metadata.topics`, keyword in `normalize_text(c.claim)`,
language on `c.metadata->>'language'`, and platform, channel and dates on the claim's video.

| Tab | Matches when | `match_source` |
|---|---|---|
| Claims | the claim meets every *C*, its score is in range, and (with entities) one of its narratives has one of the entities | `narrative`, with `via_entities: [{id, name}]`, when entities matched only through the narrative; `direct` otherwise |
| Videos | the video meets platform, channel and dates, and it has one claim meeting every remaining *C* and the entity condition through that claim's narrative; a keyword may match the video title instead | `claims` when a keyword matched only through a claim |
| Narratives | there is **one** claim *c* of the narrative such that every filter holds on the narrative or on *c*: topic on `narrative_topics` or *C*; keyword on the title or *C*; entities on `narrative_entities`; language, platform, channel, dates on *c* only; spread pattern on the narrative | `claims` when topic, keyword or entity needed the claim |

"The same claim" is one `EXISTS (SELECT 1 FROM claim_narratives … JOIN video_claims c …
JOIN videos v … WHERE <all of C>)`. A claim whose own text names the entity counts as
`direct` (the stopgap in filters.md), checked on the page's rows only.

**Items:**

- **Narratives:** today's `NarrativeSummary` (one query, `core/narratives/repo.py:475-584`)
  plus `match_source`.
- **Claims:** today's `EnrichedClaim` fields, loaded in batches for the whole page
  instead of per claim. `topics` comes from `metadata.topics` (valid ids only, as
  `{id, topic}`), so a claim found under Migration shows Migration. `narratives` lists
  all of them (`{id, title}`); `video` as today (id, title, platform, channel,
  uploaded_at, views, likes, comments, source_url, language).
- **Videos:** a lighter item than `AnalysedVideo`: the video's fields and its language,
  without transcript or embedding.

**Sort and paging:** claims and videos by `videos.uploaded_at DESC NULLS LAST`, then id;
narratives by `created_at DESC`, then id. Offset paging.

**Counts:** each count is `SELECT count(*) FROM (… LIMIT 10001)`; 10,001 rows means
"10,000+". The lists' `total` follows the same rule, so pagination stops at 10,000
results (834 pages of 12).

### Filter options

| Option | Source |
|---|---|
| Topics | existing `GET /api/topics` (the 5 topics) |
| Entities | existing `GET /api/entities?text=&limit=20` for search; `GET /api/entities/{id}` to show a chosen one |
| Languages | **new** `GET /api/search/languages`: claim languages with counts, cached for an hour (a grouping over 4M rows) |
| Channels | **new** `GET /api/search/channels?platform=&text=&limit=`: distinct `(channel, platform)` from videos, searched with the trigram index, the organisation's own (from `channel_feeds`) first with `is_own: true` |
| Ours | existing `GET /api/media_feeds/channels` (the organisation's channel feeds) |
| Platforms | fixed: YouTube, TikTok, Instagram |

### Saved selections

| Route | |
|---|---|
| `GET /api/saved-selections?kind=keyword\|entity_id\|channel` | the organisation's defaults first, then the person's own, by name |
| `POST /api/saved-selections` `{kind, name, values}` | 422 `name_taken` for a duplicate name of that person and kind (ignoring case, defaults included); 422 for an empty or too long name, no values or an unknown kind |
| `DELETE /api/saved-selections/{id}` | own selections only; 403 for a default; 404 for anyone else's |

Items are `{id, kind, name, values, is_default, created_at}`.

**Defaults** are built on each request from the organisation's non-archived feeds:
`<short_name>-channels` (its `channel_feeds`) and one `<short_name>-<Topic>` per
`keyword_feeds` row. Their id is derived from the feed (e.g. `default-channels`,
`default-topic-<topic_id>`), so they can't be deleted here; they change when the feeds
change. There are no default entity selections.

### Tests

- Port the cases of the frontend's `tests/devSearch/match.test.ts` to pytest against the
  real test database: they are the acceptance list for the matching rules (direct vs
  through claims, the same-claim rule, keywords any/all with case, accents and hyphens,
  entities through narratives, tab-specific filters).
- Counts and the 10,000 cap, paging and sort order, `topics` from `metadata.topics` on
  claim items.
- Saved selections: privacy (another person in the same organisation sees and deletes
  nothing of yours), name rules, defaults from feeds.
- Before release, `EXPLAIN ANALYZE` of each tab and the counts on a copy of production
  data, with no filters, a single broad filter, and several combined.

## Frontend

1. **Client.** `services/search.ts` on `useApi` (sends the token), replacing
   `services/devSearch.ts` on the Research page. `utils/searchQuery.ts` keeps the URL
   state and maps `date_from`/`date_to` to `start_date`/`end_date`.
2. **Options.** Split `composables/useSearchFilterOptions.ts`: Research loads from the
   sources above; the dev alerts and overview keep the mock until they move. Entities and
   channels search on the server as you type (a remote mode for `MultiSelectFilter`),
   instead of loading every option up front.
3. **Saved selections.** `services/devSavedSelections.ts` → `/api/saved-selections`;
   `SavedSelectionsMenu` shows defaults first and a delete only on your own.
4. **Page.** `pages/search.vue` gets `middleware: 'auth'`; the `devPreview` meta, the
   test-mode 404 and the `v-if` in `layouts/default.vue` go, so **Research** is in every
   build's menu. The route stays `/search`.
5. **Cards.** Narratives open `/narratives/{id}`; videos open `/videos/{id}`; claims open
   their video at `?t=<start_time_s>`. `ClaimCard` stops assuming `metadata` exists, and
   the `Claim` type gains `metadata` and `match_source`. `MatchSourceBadge` reads entity
   names from `via_entities`. Tab badges show "10,000+" when capped.
6. **Add to alerts** is hidden on Research until alerts have a backend.
7. **Tests.** Update `tests/utils/searchQuery.test.ts` for the parameter mapping; add
   component tests for the capped counts and card navigation.
8. **Mock.** `server/devSearch`, `server/api/dev/search` and the dev saved selections
   stay while the alerts and overview previews use them, and go with the alerts work.

## Not in this work

- **Claim-level entities.** They would need the narratives service to extract entities
  for claims. Entity filters keep going through the narrative, with the "Via its
  narrative" label.
- **The old list pages and endpoints** (`/narratives`, `/claims`, `/videos`) stay;
  retiring or redirecting them is a separate decision.
- **Per-organisation content**, semantic search (the embeddings exist), searching
  descriptions or transcripts, the "Unclassified" topic.
- **Alerts** and the **overview**: next steps, on top of this search module.

## Consequences to know

- **Duplicate claims.** Extraction runs once per organisation a video was collected for,
  so the same statement can appear twice, with different topics (from each
  organisation's keywords). Collapsing claims of the same video at the same timestamp
  could come later if it's noisy.
- **Other pages count topics differently.** The old Claims list and topic statistics
  still read `claim_topics`, so their numbers won't match Research.
- **Keywords under three letters** ("UE") can't use the trigram index: they work, but
  read every row.
- **Few claims are in a narrative** (2–9%): entity filters on the Claims and Videos tabs,
  which go through narratives, find only those.
- **Results stop at 10,000** per tab; narrowing the filters shows the rest.

## Found along the way

For the core-api team; not part of this work.

- `feat/date-filters-uploaded-at` also moves the `prebunking-narratives` submodule
  pointer, probably by accident: drop that from the merge. Its migration comment says
  `videos` has 105k rows; production has 1.1 million, so its plain `CREATE INDEX` will
  block video writes briefly on deploy: build it concurrently beforehand, or deploy at a
  quiet time.
- For duplicate claims, the narratives service PATCHes `entities` as plain Wikidata ids
  (`dashboards/dashboards.py:382-389`) where core-api expects entity objects; the request
  is likely rejected, losing the topics sent with it. Not verified.
- Two migrations share number 11; the runner runs both. Harmless, but new migrations
  must not repeat a number.

## Order of work

| Step | Where | Size |
|---|---|---|
| 0. Merge `feat/date-filters-uploaded-at` (without the submodule change) | core-api | — |
| 1. Migrations 24 and 25, the concurrent index script, search module, counts, tests | core-api PR | 3–4 days |
| 2. Filter options (channels, languages) and saved selections | core-api PR | 1–2 days |
| 3. Frontend: client, options, saved selections, page, cards | frontend PR | 2–3 days |
| 4. `EXPLAIN ANALYZE` on production-sized data, fixes, index build, release | both | 1 day |

Step 3 can start once the API shape is agreed, against the mock.

## Done when

- Research is in the menu of every build, behind login, on core-api data.
- Every rule in filters.md's matching section holds on the three tabs (the ported tests
  pass), counts show per tab with the 10,000 cap, and results sort as decided.
- Keywords ignore case, accents and hyphens; a keyword search on claims answers in about
  a second on production data.
- Saved selections: organisation defaults for everyone in it; each person's own lists
  private to them.
- Cards open the narrative and video pages.
