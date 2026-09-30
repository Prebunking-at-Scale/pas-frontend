// Options for the Research filters (docs/research-implementation.md). Topics, claim
// languages and the organisation's own channels are loaded once; entities and channels
// are searched on the server as you type, since there are thousands of them. Names of
// what's selected are remembered, so a chosen entity keeps its name when the list
// moves on to another search.
import type { Ref } from 'vue'
import { apiService } from '~/services/api'
import { searchService } from '~/services/search'
import type { ChannelOption, LanguageOption } from '~/services/search'
import type { Topic } from '~/types/api'
import { getLanguageName } from '~/utils/languageMapping'
import type { MultiSelectOption } from '~/components/filters/MultiSelectFilter.vue'

export const SEARCH_PLATFORMS = ['tiktok', 'youtube', 'instagram']

/** Characters typed before searching: entity names are short, channel names need three. */
export const ENTITY_SEARCH_MIN = 2
export const CHANNEL_SEARCH_MIN = 3

const SEARCH_DELAY_MS = 250
const RESULTS_LIMIT = 30

interface EntityInfo {
  name: string
  description?: string
}

export const useSearchFilterOptions = () => {
  const { t, locale } = useI18n()

  const topics = useState<Topic[]>('search:topics', () => [])
  const languages = useState<LanguageOption[]>('search:languages', () => [])
  const ownChannelList = useState<ChannelOption[]>('search:ownChannels', () => [])
  const loaded = useState('search:optionsLoaded', () => false)

  const entities = useState<Record<string, EntityInfo>>('search:entities', () => ({}))
  const entityResults = useState<string[]>('search:entityResults', () => [])
  const channelPlatforms = useState<Record<string, string>>('search:channelPlatforms', () => ({}))
  const channelResults = useState<ChannelOption[]>('search:channelResults', () => [])

  const rememberChannels = (list: ChannelOption[]) => {
    channelPlatforms.value = {
      ...channelPlatforms.value,
      ...Object.fromEntries(list.map(c => [c.channel, c.platform])),
    }
  }

  const load = async () => {
    if (loaded.value) return
    loaded.value = true
    const [topicList, languageList, own] = await Promise.allSettled([
      searchService.topics(),
      searchService.languages(),
      searchService.channels(),
    ])
    if (topicList.status === 'fulfilled') topics.value = topicList.value
    if (languageList.status === 'fulfilled') languages.value = languageList.value
    if (own.status === 'fulfilled') {
      ownChannelList.value = own.value
      rememberChannels(own.value)
    }
    for (const result of [topicList, languageList, own]) {
      if (result.status === 'rejected') console.error('Failed to load search options:', result.reason)
    }
  }

  // Entities -------------------------------------------------------------------

  let entityTimer: ReturnType<typeof setTimeout> | undefined
  const searchEntities = (text: string) => {
    clearTimeout(entityTimer)
    const query = text.trim()
    if (query.length < ENTITY_SEARCH_MIN) {
      entityResults.value = []
      return
    }
    entityTimer = setTimeout(async () => {
      try {
        const response = await apiService.getEntities({ limit: RESULTS_LIMIT, text: query })
        entities.value = {
          ...entities.value,
          ...Object.fromEntries(response.data.map(e => [e.id, { name: e.name, description: e.description }])),
        }
        entityResults.value = response.data.map(e => e.id)
      } catch (error) {
        console.error('Failed to search entities:', error)
      }
    }, SEARCH_DELAY_MS)
  }

  /** Names for entity ids that arrived without one (from the URL or a saved selection). */
  const resolveEntities = async (ids: string[]) => {
    const unknown = ids.filter(id => !entities.value[id])
    if (unknown.length === 0) return
    const found = await Promise.allSettled(unknown.map(id => apiService.getEntity(id)))
    const named = found.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    if (named.length > 0) {
      entities.value = {
        ...entities.value,
        ...Object.fromEntries(named.map(e => [e.id, { name: e.name, description: e.description }])),
      }
    }
  }

  /** What's selected first, then the latest search's results. */
  const entityOptionsFor = (selected: Ref<string[]>) => computed<MultiSelectOption[]>(() => {
    const ids = [...selected.value, ...entityResults.value.filter(id => !selected.value.includes(id))]
    return ids.map(id => ({
      value: id,
      label: entities.value[id]?.name ?? id,
      hint: entities.value[id]?.description,
    }))
  })

  // Channels -------------------------------------------------------------------

  let channelTimer: ReturnType<typeof setTimeout> | undefined
  const searchChannels = (text: string, platforms: string[]) => {
    clearTimeout(channelTimer)
    const query = text.trim()
    if (query.length < CHANNEL_SEARCH_MIN) {
      channelResults.value = []
      return
    }
    channelTimer = setTimeout(async () => {
      try {
        const found = await searchService.channels({ text: query, platform: platforms, limit: RESULTS_LIMIT })
        rememberChannels(found)
        channelResults.value = found
      } catch (error) {
        console.error('Failed to search channels:', error)
      }
    }, SEARCH_DELAY_MS)
  }

  /**
   * The organisation's own channels (narrowed to the selected platforms) under their own
   * heading, then the latest search's other results, with anything selected but not
   * listed kept at the end so it can still be unticked.
   */
  const channelOptionsFor = (platforms: Ref<string[]>, selected: Ref<string[]>) =>
    computed<MultiSelectOption[]>(() => {
      const onPlatform = (c: ChannelOption) => platforms.value.length === 0 || platforms.value.includes(c.platform)
      const own = ownChannelList.value.filter(onPlatform)
      const ownNames = new Set(own.map(c => c.channel))
      const others = channelResults.value.filter(c => !c.is_own && !ownNames.has(c.channel) && onPlatform(c))
      const listed = new Set([...ownNames, ...others.map(c => c.channel)])
      const option = (channel: string, platform: string | undefined, group: string) => ({
        value: channel,
        label: channel,
        hint: platform ? t(`search.platforms.${platform}`) : undefined,
        group,
      })
      const heading = own.length > 0 && others.length > 0
      return [
        ...own.map(c => option(c.channel, c.platform, heading ? t('filters.channelScope.ownHeading') : '')),
        ...others.map(c => option(c.channel, c.platform, heading ? t('filters.channelScope.otherHeading') : '')),
        ...selected.value
          .filter(name => !listed.has(name))
          .map(name => option(name, channelPlatforms.value[name], '')),
      ]
    })

  /** The organisation's own channels (its channel feeds): what "Ours" selects. */
  const ownChannels = computed(() => ownChannelList.value.map(c => c.channel))

  /** The platform of a channel, when it has been seen. */
  const platformOfChannel = (name: string) => channelPlatforms.value[name]

  // Fixed lists ------------------------------------------------------------------

  const topicOptions = computed<MultiSelectOption[]>(() =>
    topics.value.map(topic => ({ value: topic.id, label: topic.topic })))
  const languageOptions = computed<MultiSelectOption[]>(() => languages.value.map(({ language }) => ({
    value: language,
    label: getLanguageName(language, locale.value as 'en' | 'es' | 'fr' | 'de'),
  })))
  const platformOptions = computed<MultiSelectOption[]>(() => SEARCH_PLATFORMS.map(platform => ({
    value: platform,
    label: t(`search.platforms.${platform}`),
  })))

  return {
    load,
    topicOptions,
    languageOptions,
    platformOptions,
    searchEntities,
    resolveEntities,
    entityOptionsFor,
    searchChannels,
    channelOptionsFor,
    ownChannels,
    platformOfChannel,
  }
}
