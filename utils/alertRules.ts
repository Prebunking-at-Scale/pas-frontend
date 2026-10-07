// The alert model (docs/alerts.md, docs/alerts-implementation.md): an alert belongs
// to its creator and is e-mailed to them only; it has conditions combined with OR, each
// watching new narratives, new claims, or new claims in one narrative, with the search's
// filters. core-api validates the same way (core/alerts/validation.py).

export type ConditionType = 'new_narrative' | 'new_claim' | 'new_claim_in_narrative'

/**
 * The two types the editor offers. "New claim" with a narrative chosen in "Belongs to
 * this narrative" is stored as `new_claim_in_narrative`.
 */
export const EDITOR_TYPES: ConditionType[] = ['new_narrative', 'new_claim']

/** The type a condition shows as in the editor. */
export const shownType = (type: ConditionType): ConditionType =>
  type === 'new_claim_in_narrative' ? 'new_claim' : type

// Claims are never filtered by their priority score.
export type ConditionListFilter = 'topic_id' | 'keyword' | 'language' | 'platform' | 'channel' | 'entity_id' | 'spread_pattern'
export type ConditionFilter = ConditionListFilter

export type ConditionFilters = Partial<Record<ConditionListFilter, string[]>> & {
  /** Keywords must all be in the same text; absent means any of them (docs/filters.md). */
  keyword_mode?: 'all'
}

export interface AlertCondition {
  /** Empty for a condition not saved yet. */
  id: string
  type: ConditionType
  /** The followed narrative: set for `new_claim_in_narrative` only. */
  narrative_id: string | null
  filters: ConditionFilters
}

export interface Alert {
  id: string
  name: string
  enabled: boolean
  conditions: AlertCondition[]
  created_at: string
  last_match_at: string | null
}

export interface AlertInput {
  name: string
  enabled: boolean
  conditions: Pick<AlertCondition, 'type' | 'narrative_id' | 'filters'>[]
}

/** The next e-mail, as core-api's GET /api/alerts/digest-preview returns it. */
export interface DigestItem {
  id: string
  title: string
  /** The (1-based) conditions it met. */
  conditions: number[]
}

export interface DigestSection {
  items: DigestItem[]
  total: number
}

export interface DigestEntry {
  alert_id: string
  alert_name: string
  narratives: DigestSection
  in_narratives: (DigestSection & { narrative_id: string; narrative_title: string })[]
  claims: DigestSection
}

const CLAIM_FILTERS: ConditionFilter[] = ['topic_id', 'keyword', 'language', 'platform', 'channel']

/** Which filters each type of condition may use (docs/alerts.md). */
export const CONDITION_FILTERS: Record<ConditionType, ConditionFilter[]> = {
  new_narrative: ['topic_id', 'keyword', 'language', 'platform', 'channel', 'entity_id', 'spread_pattern'],
  new_claim: [...CLAIM_FILTERS, 'entity_id'],
  new_claim_in_narrative: CLAIM_FILTERS,
}

/** The element a type watches, which is also the search tab it opens on. */
export const conditionElement = (type: ConditionType): 'narratives' | 'claims' =>
  type === 'new_narrative' ? 'narratives' : 'claims'

export const followsNarrative = (type: ConditionType) => type === 'new_claim_in_narrative'

/** Keeps only the filters the type allows, and drops empty ones. */
export const sanitizeFilters = (type: ConditionType, filters: ConditionFilters): ConditionFilters => {
  const clean: ConditionFilters = {}
  for (const key of CONDITION_FILTERS[type]) {
    const list = filters[key]?.filter(Boolean) ?? []
    if (list.length > 0) clean[key] = list
  }
  // The keyword mode only means something next to keywords.
  if (clean.keyword && filters.keyword_mode === 'all') clean.keyword_mode = 'all'
  return clean
}

export const hasNoFilters = (filters: ConditionFilters) => Object.keys(filters).length === 0

/** A condition with only what its type allows: filters sanitized, narrative only if followed. */
export const sanitizeCondition = <T extends Pick<AlertCondition, 'type' | 'narrative_id' | 'filters'>>(c: T): T => ({
  ...c,
  narrative_id: followsNarrative(c.type) ? c.narrative_id : null,
  filters: sanitizeFilters(c.type, c.filters),
})

export const NAME_MAX_LENGTH = 120

/** The codes core-api answers with (422, extra.errors); each has an alertRules.errors.* text. */
export type AlertError =
  | 'name_required'
  | 'name_too_long'
  | 'conditions_required'
  | 'too_many_conditions'
  | 'invalid_type'
  | 'narrative_required'
  | 'narrative_not_allowed'
  | 'empty_condition'
  | 'filter_not_allowed'
  | 'invalid_filter'
  | 'save_failed'

/** Everything wrong with an alert before sending it; empty when it can be saved. */
export const validateAlert = (alert: AlertInput): AlertError[] => {
  const errors = new Set<AlertError>()
  const name = alert.name.trim()
  if (!name) errors.add('name_required')
  else if (name.length > NAME_MAX_LENGTH) errors.add('name_too_long')
  if (alert.conditions.length === 0) errors.add('conditions_required')
  if (alert.conditions.length > 20) errors.add('too_many_conditions')
  for (const c of alert.conditions) {
    if (followsNarrative(c.type) && !c.narrative_id) errors.add('narrative_required')
    if (!followsNarrative(c.type) && c.narrative_id) errors.add('narrative_not_allowed')
    // A condition over everything needs a filter; one following a narrative doesn't.
    if (!followsNarrative(c.type) && hasNoFilters(sanitizeFilters(c.type, c.filters))) errors.add('empty_condition')
    const allowed = [...CONDITION_FILTERS[c.type], 'keyword_mode']
    if (Object.keys(c.filters).some(key => !allowed.includes(key))) errors.add('filter_not_allowed')
  }
  return [...errors]
}

/**
 * The Research query for a condition, to open what it matches. A condition following
 * a narrative has none: Research has no "in this narrative" filter, so it links to the
 * narrative's page instead.
 */
export const conditionSearchQuery = (type: ConditionType, filters: ConditionFilters) => {
  if (followsNarrative(type)) return null
  const query: Record<string, string | string[]> = { tab: conditionElement(type) }
  for (const [key, value] of Object.entries(sanitizeFilters(type, filters))) {
    query[key] = Array.isArray(value) ? value : String(value)
  }
  return query
}

type ConditionShape = Pick<AlertCondition, 'type' | 'narrative_id' | 'filters'>

/** Whether two conditions are the same: type, narrative and filters (order of values aside). */
export const isSameCondition = (a: ConditionShape, b: ConditionShape) => {
  const normalize = (c: ConditionShape) => JSON.stringify([
    c.type,
    followsNarrative(c.type) ? c.narrative_id : null,
    Object.entries(sanitizeFilters(c.type, c.filters))
      .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value])
      .sort(([x], [y]) => String(x).localeCompare(String(y))),
  ])
  return normalize(a) === normalize(b)
}

/**
 * A condition made from a Research search ("Add to alerts"): the Narratives tab gives
 * a New narrative condition, the Claims tab a New claim one. The date is left out.
 */
export const conditionFromSearch = (tab: string, params: Record<string, unknown>): ConditionShape => {
  const type: ConditionType = tab === 'claims' ? 'new_claim' : 'new_narrative'
  const filters: ConditionFilters = {}
  for (const key of CONDITION_FILTERS[type]) {
    const value = params[key]
    if (value === undefined) continue
    filters[key] = (Array.isArray(value) ? value : [value]).map(String)
  }
  if (params.keyword_mode === 'all') filters.keyword_mode = 'all'
  return { type, narrative_id: null, filters: sanitizeFilters(type, filters) }
}

/** A condition that follows one narrative with no filters: every new claim of it. */
export const conditionFollowing = (narrativeId: string): ConditionShape => ({
  type: 'new_claim_in_narrative',
  narrative_id: narrativeId,
  filters: {},
})
