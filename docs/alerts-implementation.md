# Alerts: implementation plan

Moving the alerts of [alerts.md](alerts.md) (the two-type design kept on 2026-10-01) from
the dev preview to core-api and the app, replacing today's alerts. Written 6 October
2026 from a study of core-api's alerts (`core/alerts/`, migration 11, the
`process-alerts` CronJob) and of today's `/alerts` page. Paths are in core-api unless
they start with a frontend folder.

Branches: `feat/alerts` in core-api and in the frontend, each on top of
`feat/research-search` (it reuses the search queries and filter options).

## Decisions

Taken with the product owner on 5 and 6 October 2026.

| Decision | Notes |
|---|---|
| **An alert is its creator's only.** Nobody else in the organisation sees or edits it. | Today's API only lists your own alerts but lets anyone in the organisation read, edit or delete one by id; the new API checks the owner everywhere. |
| **The email goes only to the alert's creator.** No extra recipients. | Changed on 6 October 2026 (it was "members of the organisation"). |
| **One email a day at 08:00 Europe/Madrid**, in English. | Same time zone for every organisation for now. |
| **Conditions** (not "cases"): New narrative, or New claim with an optional "Belongs to this narrative". Conditions are combined with OR; filters as in Research. | Spread pattern only on New narrative; score only on New claim; claim topics from `claim_topics`; keywords as in Research (title or any claim). |
| **No backlog**: creating an alert, changing its conditions or re-enabling it starts counting from that moment. | Renaming it doesn't. |
| **Each element is reported once per alert**, whatever condition it meets later. | |
| **A claim counts for "Belongs to this narrative" when it joins that narrative** after the starting point, even if the claim itself is older. For the other conditions, an element counts when it is created after the starting point. | Needs the date a claim joined a narrative (see migration 26). |
| **A followed narrative that is merged** is followed in the narrative it was merged into. **If it is deleted**, its condition simply never matches again. | No notice, the alert isn't disabled. |
| **The email** lists, per triggered alert ("Alert triggered: {name}"), new narratives, then new claims in selected narratives (grouped by narrative), then new claims; each element once, title in bold, the conditions it met in brackets as a filter summary; 5 per section, then "See all (N)" to the alert's page. Subject: the number of alerts triggered. Alerts newest first, as in the alerts panel; the order can't be changed (decided 2026-10-07). | [alerts.md, "Daily digest"](alerts.md#daily-digest). |
| **Existing alerts**: the 31 topic and keyword alerts become alerts with one New narrative condition (topic, or keyword matched as in Research); the 14 threshold alerts are dropped without notice. | Production on 5 October: 50 alerts. |
| **The new editor replaces `/alerts`**; a narrative's "Create alert" opens it with "New claim + belongs to this narrative"; Research gets "+ Add to alerts". | |
| **Old tables are kept** (`alerts`, `alerts_triggered`, `alert_executions`) until the new alerts work in production, then dropped by a later migration. | |

## Backend (core-api)

### Migration 26: alert rules, and when a claim joined a narrative

```sql
CREATE TYPE alert_condition_type AS ENUM ('new_narrative', 'new_claim', 'new_claim_in_narrative');

CREATE TABLE alert_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
    enabled boolean NOT NULL DEFAULT true,
    counting_since timestamptz NOT NULL DEFAULT now(),  -- the starting point
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON alert_rules (user_id, organisation_id, created_at DESC);  -- newest first

CREATE TABLE alert_rule_conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    position integer NOT NULL,                  -- "condition 1, 2…"
    type alert_condition_type NOT NULL,
    narrative_id uuid,                          -- no FK: a deleted narrative just never matches
    filters jsonb NOT NULL DEFAULT '{}',        -- the AlertCaseFilters of utils/alertRules.ts
    CHECK ((type = 'new_claim_in_narrative') = (narrative_id IS NOT NULL))
);
CREATE INDEX ON alert_rule_conditions (alert_id);
CREATE INDEX ON alert_rule_conditions (narrative_id) WHERE narrative_id IS NOT NULL;

CREATE TABLE alert_rule_reports (               -- what each alert has reported: once only
    alert_id uuid NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    element_kind text NOT NULL CHECK (element_kind IN ('narrative', 'claim')),
    element_id uuid NOT NULL,
    conditions integer[] NOT NULL,              -- the positions it met
    section text NOT NULL,                      -- narratives | in_narrative | claims
    in_narrative_id uuid,                       -- for the in_narrative section
    reported_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (alert_id, element_kind, element_id)
);

ALTER TABLE claim_narratives ADD COLUMN created_at timestamptz;  -- NULL for links made before
ALTER TABLE claim_narratives ALTER COLUMN created_at SET DEFAULT now();
```

- `claim_narratives.created_at` is when a claim **joined** a narrative. Existing links
  stay `NULL` (they joined before any alert's starting point).
- `NarrativeRepository.update_narrative` today deletes all of a narrative's claim links
  and inserts them again on every update, which would reset that date every time the
  narratives service touches a narrative. It changes to insert only the new links and
  delete only the removed ones.

### Migration 27: existing alerts

In one transaction, for each row of `alerts`:

- `narrative_with_topic` → an alert rule with the same owner, organisation, name and
  `enabled`, and one `new_narrative` condition `{"topic_id": [topic]}`.
- `keyword` → the same, with `{"keyword": [keyword]}`.
- Threshold types: not copied.
- `counting_since` = the migration time; `created_at` kept.

The old tables are left as they are.

### Evaluation

Once a day, before sending. For each enabled alert and each condition, the matching
elements that the alert hasn't reported yet:

| Condition | Candidates | Filters |
|---|---|---|
| New narrative | narratives with `created_at >= counting_since` | the Research narratives query (`core/search/query.py`) |
| New claim | claims with `created_at >= counting_since` | the Research claims query |
| New claim, belongs to N | claims linked to N (or to the narrative N was merged into, see below) with `claim_narratives.created_at >= counting_since` | the Research claims query |

- The filters map onto `SearchFilters` as they do in the frontend (`alertFromSearch`).
- Candidates are limited to the last 7 days as well, so the queries stay small. An
  element can still match a few days after it appears, for instance when the narratives
  service gives a claim its topic or groups it into a narrative.
- What each condition finds is merged per alert: each element once, with every condition
  it met. Elements already in `alert_rule_reports` are skipped.
- Sections: a new narrative goes to *narratives*; a claim matched by a "belongs to"
  condition goes to *in_narrative* (under that narrative), even if it also met a New
  claim condition; any other claim goes to *claims*.

### Merges

A new endpoint, `POST /api/narratives/{id}/merge` with `{"into": target_id}` (super
admins, like the other narrative writes): moves the source's claims into the target
(new links dated now), points the alert conditions that followed the source to the
target, and deletes the source. The frontend's merge dialog calls it instead of
"update the target, then delete the source". Automatic merges by the narratives service
(same title) update an existing narrative and delete nothing, so they need nothing.

### Sending

- A new CLI command `send-alert-digest` and a CronJob at `0 8 * * *` with
  `timeZone: Europe/Madrid`, replacing `core-api-process-alerts` (its manifests are in
  `deployment/`).
- Per user, one email to the creator with all their triggered alerts, newest first.
  Users or organisations that are deactivated get nothing.
- The report rows of an alert are written only once its email has been sent, in the same transaction; if sending fails, nothing is recorded and the
  matches go out the next day. (Today's job marks matches as sent even when the email
  fails.)
- An English HTML template next to today's (`core/email/messages.py`), sent through
  the existing mailer (Mailgun in production). "See all" links to
  `{APP_BASE_URL}/alerts/{id}`.

### API

Replaces today's `AlertController` at `/api/alerts`; every endpoint checks that the
alert belongs to the signed-in user.

| Route | |
|---|---|
| `GET /api/alerts` | your alerts, newest first, with conditions and `last_match_at` |
| `POST /api/alerts` | create: `{name, enabled, conditions[{type, narrative_id, filters}]}` |
| `GET /api/alerts/{id}` | one alert |
| `PUT /api/alerts/{id}` | replace; resets `counting_since` if conditions changed or it was re-enabled |
| `DELETE /api/alerts/{id}` | 204 |
| `GET /api/alerts/digest-preview` | what the next email would contain for you, from the matches so far |

Validation mirrors `validateAlertRule` in `utils/alertRules.ts` and answers 422 with its
codes (`name_required`, `cases_required` → `conditions_required`, `narrative_required`,
`empty_case` → `empty_condition`, `filter_not_allowed`).

## Frontend

- `pages/alerts/index.vue` and `pages/alerts/[id].vue` (and `new`) from the preview's
  `AlertListView` and `AlertEditView`, on the real API; the three-type code paths, the
  mock routes (`server/api/dev/alerts`, `server/devAlerts`) and `/alerts-dev` go.
- No recipients field: the email goes to the creator only.
- Today's `AlertFormDialog`, `useAlerts`, `types/alert.ts` and the old `alerts.*`
  translations go.
- A narrative's **Create alert** opens `/alerts/new?narrative={id}` with one "New claim
  + belongs to this narrative" condition.
- Research: the "+ Add to alerts" card and dialog, as in the preview.
- The digest preview calls `GET /api/alerts/digest-preview`.
- The merge dialog calls the new merge endpoint.

## Tests

- core-api: matching per condition type over a small data set (as `tests/search`), once
  only, no backlog, joining a followed narrative later, merges, the email's sections and
  dedup, owner checks, validation codes, the migration of old alerts, and
  `update_narrative` keeping link dates.
- Frontend: `utils/alertRules` and the editor's conversions (existing tests, renamed to
  conditions), the narrative-page prefill.

## Deploy

1. Merge after Research (the branches sit on it).
2. Migrations 26 and 27 are small; no index needs building beforehand.
3. Replace the `process-alerts` CronJob with the digest one in both overlays.
4. Rehearse on dev: its alerts job is suspended, and dev has no production alerts; test
   with alerts created by the tester before enabling the CronJob there.

## Open questions

- The 7-day window for late matches: long enough?
- Old tables: when to drop them (a migration after the release has been checked).
