// URL state of the Research page (docs/filters.md). Every filter and the active tab live
// in the route query, so a search can be shared and the back button restores it.
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { endOfDayISO, startOfDayISO } from '~/utils/date'

export type SearchTab = 'videos' | 'claims' | 'narratives'

export const SEARCH_TABS: SearchTab[] = ['narratives', 'claims', 'videos']

export const SCORE_RANGE = [0, 5] as const

export interface SearchState {
  tab: SearchTab
  topic_id: string[]
  entity_id: string[]
  keyword: string[]
  /** Any keyword (default) or all of them in the same text. */
  keyword_mode: 'any' | 'all'
  language: string[]
  platform: string[]
  channel: string[]
  date_from: string | null
  date_to: string | null
  /** Claims tab only. */
  score: number[]
  /** Narratives tab only. */
  spread_pattern: string[]
}

type ListKey = 'topic_id' | 'entity_id' | 'keyword' | 'language' | 'platform' | 'channel' | 'spread_pattern'
const LIST_KEYS: ListKey[] = ['topic_id', 'entity_id', 'keyword', 'language', 'platform', 'channel', 'spread_pattern']

/** Every query key the search page owns; anything else in the URL is left alone. */
export const SEARCH_QUERY_KEYS = ['tab', 'page', 'keyword_mode', 'date_from', 'date_to', 'min_score', 'max_score', ...LIST_KEYS]

export const emptySearchState = (tab: SearchTab = 'narratives'): SearchState => ({
  tab,
  topic_id: [],
  entity_id: [],
  keyword: [],
  keyword_mode: 'any',
  language: [],
  platform: [],
  channel: [],
  date_from: null,
  date_to: null,
  score: [...SCORE_RANGE],
  spread_pattern: [],
})

const list = (value: LocationQuery[string] | undefined): string[] =>
  (Array.isArray(value) ? value : value == null ? [] : [value]).filter((v): v is string => !!v)

const single = (value: LocationQuery[string] | undefined) => list(value)[0] ?? null

const scoreBound = (value: LocationQuery[string] | undefined, fallback: number) => {
  const parsed = Number(single(value))
  return single(value) === null || Number.isNaN(parsed) ? fallback : parsed
}

export const searchStateFromQuery = (query: LocationQuery): SearchState => {
  const tab = single(query.tab) as SearchTab
  const state = emptySearchState(SEARCH_TABS.includes(tab) ? tab : 'narratives')
  for (const key of LIST_KEYS) state[key] = list(query[key])
  state.keyword_mode = single(query.keyword_mode) === 'all' ? 'all' : 'any'
  state.date_from = single(query.date_from)
  state.date_to = single(query.date_to)
  state.score = [scoreBound(query.min_score, SCORE_RANGE[0]), scoreBound(query.max_score, SCORE_RANGE[1])]
  return state
}

export const searchPageFromQuery = (query: LocationQuery) => Math.max(1, Number(single(query.page)) || 1)

/**
 * The filters as API params (repeated keys for lists). Tab-specific filters are only
 * sent for their own tab, and the score range only when it isn't the full range.
 */
export const searchApiParams = (state: SearchState): Record<string, string | number | string[]> => {
  const params: Record<string, string | number | string[]> = {}
  for (const key of LIST_KEYS) {
    if (key === 'spread_pattern' && state.tab !== 'narratives') continue
    if (state[key].length > 0) params[key] = state[key]
  }
  // "all" only means something with keywords; "any" is the default and isn't sent.
  if (state.keyword.length > 0 && state.keyword_mode === 'all') params.keyword_mode = 'all'
  if (state.date_from) params.date_from = state.date_from
  if (state.date_to) params.date_to = state.date_to
  if (state.tab === 'claims') {
    if (state.score[0] !== SCORE_RANGE[0]) params.min_score = state.score[0]
    if (state.score[1] !== SCORE_RANGE[1]) params.max_score = state.score[1]
  }
  return params
}

/**
 * The params core-api takes (/api/search): the URL's filters, with the upload days as
 * the start of the first day and the end of the last, in the viewer's time zone.
 */
export const searchRequestParams = (state: SearchState): Record<string, string | number | string[]> => {
  const { date_from, date_to, ...params } = searchApiParams(state)
  const start = startOfDayISO(date_from as string | undefined)
  const end = endOfDayISO(date_to as string | undefined)
  return { ...params, ...(start ? { start_date: start } : {}), ...(end ? { end_date: end } : {}) }
}

/** The query for a state: the tab, its API params and the page (omitted on page 1). */
export const searchStateToQuery = (state: SearchState, page = 1): LocationQueryRaw => ({
  tab: state.tab,
  ...Object.fromEntries(Object.entries(searchApiParams(state)).map(([k, v]) => [k, Array.isArray(v) ? v : String(v)])),
  ...(page > 1 ? { page: String(page) } : {}),
})

/** Whether any filter is set, tab-specific ones included only for their own tab. */
export const hasSearchFilters = (state: SearchState) => Object.keys(searchApiParams(state)).length > 0

/**
 * How many of the filters behind "More filters" are set: entities, platform, channel,
 * upload date, and the current tab's own filter. Each filter counts once, whatever
 * the number of values picked.
 */
export const countMoreFilters = (state: SearchState) => {
  const params = searchApiParams(state)
  return [
    params.entity_id,
    params.platform,
    params.channel,
    params.date_from ?? params.date_to,
    params.min_score ?? params.max_score,
    params.spread_pattern,
  ].filter(value => value !== undefined).length
}
