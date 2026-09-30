// Client for core-api's search (docs/research-implementation.md): one search over
// narratives, claims and videos with the same filters, their counts, and the filter
// options that come from the data (claim languages, channels).
import type { Claim, NarrativeSummary, Topic, Video } from '~/types/api'
import type { SearchTab } from '~/utils/searchQuery'

/** Why a result matched: on its own fields, through its claims, or (a claim) through its narrative. */
export type MatchSource = 'direct' | 'claims' | 'narrative'

export interface EntityRef {
  id: string
  name: string
}

export type WithMatchSource<T> = T & {
  match_source: MatchSource
  /** Claims matched through their narrative: the searched entities it has. */
  via_entities?: EntityRef[]
}

export interface SearchPage<T> {
  data: WithMatchSource<T>[]
  /** Up to 10,000; total_capped says there are more. */
  total: number
  total_capped: boolean
  page: number
  size: number
}

export interface TabCount {
  total: number
  capped: boolean
}

export type SearchCounts = Record<SearchTab, TabCount>

export interface ChannelOption {
  channel: string
  platform: string
  /** One of the organisation's channel feeds. */
  is_own: boolean
}

export interface LanguageOption {
  language: string
  count: number
}

export type SearchParams = Record<string, string | number | string[]>

type TabItem = { narratives: NarrativeSummary; claims: Claim; videos: Video }

export const searchService = {
  async search<T extends SearchTab>(tab: T, params: SearchParams): Promise<SearchPage<TabItem[T]>> {
    const { apiFetch } = useApi()
    return await apiFetch<SearchPage<TabItem[T]>>(`/api/search/${tab}`, { query: params })
  },

  async counts(params: SearchParams): Promise<SearchCounts> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: SearchCounts }>('/api/search/counts', { query: params })
    return response.data
  },

  async channels(params: { text?: string; platform?: string[]; limit?: number } = {}): Promise<ChannelOption[]> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: ChannelOption[] }>('/api/search/channels', { query: params })
    return response.data
  },

  async languages(): Promise<LanguageOption[]> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: LanguageOption[] }>('/api/search/languages')
    return response.data
  },

  async topics(): Promise<Topic[]> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: Topic[] }>('/api/topics', { query: { limit: 100, offset: 0 } })
    return response.data
  },
}
