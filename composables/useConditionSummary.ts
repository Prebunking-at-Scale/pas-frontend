// A condition in words: "Topic: Migration", "Keywords (all): vivienda, alquiler",
// "Language: Spanish"… Shared by the alert list and the digest email, so both describe a
// condition the same way.
import { sanitizeFilters } from '~/utils/alertRules'
import type { ConditionFilters, ConditionType } from '~/utils/alertRules'

const LIST_LABELS: Record<string, string> = {
  topic_id: 'filters.topic',
  keyword: 'filters.keywords',
  language: 'filters.language',
  platform: 'filters.platform',
  channel: 'filters.channel',
  entity_id: 'search.entities',
  spread_pattern: 'narratives.spreadPattern',
}

export const useConditionSummary = () => {
  const { t } = useI18n()
  const { labelFor } = useSearchFilterOptions()

  return (type: ConditionType, filters: ConditionFilters): string[] => {
    const kept = sanitizeFilters(type, filters)
    const out: string[] = []
    for (const [key, label] of Object.entries(LIST_LABELS)) {
      const values = kept[key as keyof ConditionFilters] as string[] | undefined
      if (!values) continue
      const names = values.map(v => key === 'spread_pattern' ? t(`narratives.spreadPatterns.${v}`) : labelFor(key, v))
      const mode = key === 'keyword' && kept.keyword_mode === 'all' ? ` (${t('search.keywordMode.all')})` : ''
      out.push(`${t(label)}${mode}: ${names.join(', ')}`)
    }
    return out
  }
}
