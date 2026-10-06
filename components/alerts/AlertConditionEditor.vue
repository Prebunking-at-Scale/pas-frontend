<template>
  <div class="rounded-lg border border-neutral-200 bg-white">
    <div class="flex items-center justify-between border-b border-neutral-100 px-4 py-2">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-gray-900">{{ $t('alertRules.caseTitle', { number }) }}</h3>
        <NuxtLink
          v-if="conditionLink"
          :to="conditionLink.to"
          target="_blank"
          class="inline-flex items-center gap-1 text-xs text-emerald-800 hover:underline"
        >
          {{ $t(conditionLink.label) }}
          <ExternalLink class="h-3 w-3" />
        </NuxtLink>
      </div>
      <Button
        v-if="removable"
        variant="ghost"
        size="sm"
        class="cursor-pointer text-gray-500 hover:text-red-700"
        @click="emit('remove')"
      >
        <Trash2 class="h-4 w-4" />
        {{ $t('alertRules.removeCase') }}
      </Button>
    </div>

    <!-- What this case watches -->
    <div class="space-y-3 border-b border-neutral-100 p-4">
      <p class="text-sm font-medium text-gray-900">{{ $t('alertRules.steps.type') }}</p>
      <!-- New narrative or New claim; a claim condition may follow one narrative -->
      <template v-if="type">
        <AlertTypePicker
          :model-value="shownType(type)"
          compact
          @update:model-value="pickType"
        />
        <div v-if="type !== 'new_narrative'" class="max-w-xl space-y-2">
          <Label :for="`${uid}-belongs`">{{ $t('alertRules.fields.belongsTo') }}</Label>
          <div class="flex items-center gap-2">
            <NarrativeSelect
              :id="`${uid}-belongs`"
              :model-value="narrativeId"
              :placeholder="$t('alertRules.fields.belongsToPlaceholder')"
              @update:model-value="setBelongsTo"
            />
            <Button
              v-if="narrativeId"
              type="button"
              variant="ghost"
              size="icon"
              class="shrink-0 cursor-pointer"
              :aria-label="$t('alertRules.fields.belongsToClear')"
              @click="setBelongsTo(null)"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs text-gray-500">{{ $t('alertRules.fields.belongsToHint') }}</p>
        </div>
      </template>
    </div>

    <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
      <MultiSelectFilter
        v-if="allows('topic_id')"
        :model-value="list('topic_id')"
        :label="$t('filters.topic')"
        :placeholder="$t('filters.allTopics')"
        :options="topicOptions"
        @update:model-value="setList('topic_id', $event)"
      />
      <MultiSelectFilter
        v-if="allows('language')"
        :model-value="list('language')"
        :label="$t('filters.language')"
        :placeholder="$t('filters.allLanguages')"
        :options="languageOptions"
        @update:model-value="setList('language', $event)"
      />
      <KeywordTagsFilter
        v-if="allows('keyword')"
        saved-kind="keyword"
        :model-value="list('keyword')"
        :mode="modelValue.keyword_mode ?? 'any'"
        class="md:col-span-2"
        @update:model-value="setList('keyword', $event)"
        @update:mode="(mode) => mode === 'all' ? update({ keyword_mode: 'all' }) : update({}, ['keyword_mode'])"
      />
      <MultiSelectFilter
        v-if="allows('entity_id')"
        :model-value="list('entity_id')"
        :label="$t('search.entities')"
        :placeholder="$t('filters.allEntities')"
        :options="entityOptions"
        saved-kind="entity_id"
        searchable
        :search-placeholder="$t('filters.searchEntity')"
        :empty-text="$t('filters.typeToSearch', { count: ENTITY_SEARCH_MIN })"
        @search="searchEntities"
        @update:model-value="setList('entity_id', $event)"
      />
      <MultiSelectFilter
        v-if="allows('platform')"
        :model-value="list('platform')"
        :label="$t('filters.platform')"
        :placeholder="$t('filters.allPlatforms')"
        :options="platformOptions"
        @update:model-value="setPlatforms"
      />
      <MultiSelectFilter
        v-if="allows('channel')"
        :model-value="list('channel')"
        :label="$t('filters.channel')"
        :placeholder="$t('filters.allChannels')"
        :options="channelOptions"
        saved-kind="channel"
        chips
        :platform-of="platformOfChannel"
        searchable
        :empty-text="$t('filters.typeToSearch', { count: CHANNEL_SEARCH_MIN })"
        @search="(text: string) => searchChannels(text, list('platform'))"
        @update:model-value="setList('channel', $event)"
        >
          <template #label-extra>
            <FilterToggle
              :model-value="onlyOwnChannels ? 'own' : 'all'"
              :group-label="$t('filters.channelScope.label')"
              :options="channelScopeOptions"
              @update:model-value="setOnlyOwnChannels($event === 'own')"
            />
          </template>
        </MultiSelectFilter>
      <RangeSlider
        v-if="allows('min_score')"
        :model-value="[modelValue.min_score ?? SCORE_RANGE[0], modelValue.max_score ?? SCORE_RANGE[1]]"
        :label="$t('claims.range')"
        :min="SCORE_RANGE[0]"
        :max="SCORE_RANGE[1]"
        :step="0.1"
        @update:model-value="setScore"
      />
      <SpreadPatternFilter
        v-if="allows('spread_pattern')"
        :model-value="list('spread_pattern') as NarrativeSpreadPattern[]"
        class="md:col-span-2"
        @update:model-value="setList('spread_pattern', $event)"
      />
    </div>

    <p
      v-if="noFilters && followsNarrative(type)"
      class="border-t border-neutral-100 px-4 py-3 text-xs text-gray-500"
    >
      {{ $t('alertRules.anyNewInNarrative') }}
    </p>

    <p v-if="blockedReason" class="border-t border-neutral-100 bg-stone-50 px-4 py-3 text-sm text-gray-500 rounded-b-lg">
      {{ $t(`alertRules.${blockedReason}`) }}
    </p>
  </div>
</template>

<script setup lang="ts">
// One condition of an alert: what it watches (New narrative, or New claim with an
// optional narrative it must belong to) and the filters that type allows, picked as in
// Research. What it matches is one click away, in Research or on the narrative's page.
import { ExternalLink, Trash2, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import FilterToggle from '~/components/filters/FilterToggle.vue'
import MultiSelectFilter from '~/components/filters/MultiSelectFilter.vue'
import KeywordTagsFilter from '~/components/filters/KeywordTagsFilter.vue'
import NarrativeSelect from '~/components/filters/NarrativeSelect.vue'
import RangeSlider from '~/components/filters/RangeSlider.vue'
import SpreadPatternFilter from '~/components/filters/SpreadPatternFilter.vue'
import AlertTypePicker from '~/components/alerts/AlertTypePicker.vue'
import type { NarrativeSpreadPattern } from '~/types/api'
import {
  CONDITION_FILTERS,
  conditionSearchQuery,
  followsNarrative,
  hasNoFilters,
  sanitizeFilters,
  shownType,
} from '~/utils/alertRules'
import type { ConditionFilter, ConditionFilters, ConditionListFilter, ConditionType } from '~/utils/alertRules'
import { SCORE_RANGE } from '~/utils/searchQuery'
import { CHANNEL_SEARCH_MIN, ENTITY_SEARCH_MIN } from '~/composables/useSearchFilterOptions'

interface Props {
  type: ConditionType
  narrativeId: string | null
  modelValue: ConditionFilters
  number: number
  removable?: boolean
}

const props = withDefaults(defineProps<Props>(), { removable: false })

const emit = defineEmits<{
  'update:modelValue': [value: ConditionFilters]
  'update:type': [value: ConditionType]
  'update:narrativeId': [value: string | null]
  remove: []
}>()

const uid = useId()
const {
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
} = useSearchFilterOptions()

// New claim keeps the condition's narrative, if it has one: the narrative field
// decides between a claim anywhere and a claim in that narrative.
const pickType = (picked: ConditionType) => {
  if (picked === 'new_narrative') emit('update:type', 'new_narrative')
  else if (props.type === 'new_narrative') emit('update:type', 'new_claim')
}
const setBelongsTo = (narrativeId: string | null) => {
  emit('update:type', narrativeId ? 'new_claim_in_narrative' : 'new_claim')
  emit('update:narrativeId', narrativeId)
}

const allows = (key: ConditionFilter) => CONDITION_FILTERS[props.type].includes(key)

const list = (key: ConditionListFilter) => props.modelValue[key] ?? []

const update = (patch: ConditionFilters, remove: (keyof ConditionFilters)[] = []) => {
  const next = Object.entries({ ...props.modelValue, ...patch })
    .filter(([key]) => !remove.includes(key as keyof ConditionFilters))
  emit('update:modelValue', Object.fromEntries(next) as ConditionFilters)
}

const setList = (key: ConditionListFilter, values: string[]) =>
  values.length > 0 ? update({ [key]: values }) : update({}, [key])

// Entities arrive as ids: fetch the names of those not seen yet
watch(() => list('entity_id'), ids => { resolveEntities(ids) }, { immediate: true })
const entityOptions = entityOptionsFor(computed(() => list('entity_id')))

// "Ours" puts the organisation's own channels into the filter, as in Research.
const {
  onlyOwn: onlyOwnChannels,
  setOnlyOwn: setOnlyOwnChannels,
  scopeOptions: channelScopeOptions,
} = useOwnChannelsFilter(
  () => list('channel'),
  (channels) => { setList('channel', channels) },
  ownChannels,
)

const channelOptions = channelOptionsFor(computed(() => list('platform')), computed(() => list('channel')))
// Picking platforms drops the channels known to be on other platforms, as in Research.
const setPlatforms = (platforms: string[]) => {
  const channels = list('channel').filter((name) => {
    const platform = platformOfChannel(name)
    return platforms.length === 0 || !platform || platforms.includes(platform)
  })
  const patch: ConditionFilters = {}
  const remove: (keyof ConditionFilters)[] = []
  if (platforms.length > 0) patch.platform = platforms
  else remove.push('platform')
  if (channels.length > 0) patch.channel = channels
  else remove.push('channel')
  update(patch, remove)
}

// The full score range means "no score filter", as in Research.
const setScore = (range: number[]) => {
  const patch: ConditionFilters = {}
  const remove: (keyof ConditionFilters)[] = []
  if (range[0] !== SCORE_RANGE[0]) patch.min_score = range[0]
  else remove.push('min_score')
  if (range[1] !== SCORE_RANGE[1]) patch.max_score = range[1]
  else remove.push('max_score')
  update(patch, remove)
}

// Filters are required, except on a condition that follows one narrative: there, no
// filters means every new claim of it, which the hint says.
const noFilters = computed(() => hasNoFilters(sanitizeFilters(props.type, props.modelValue)))

const blockedReason = computed(() => {
  if (followsNarrative(props.type) && !props.narrativeId) return 'needsNarrative'
  if (!followsNarrative(props.type) && noFilters.value) return 'needsFilter'
  return null
})

// Where to see what this condition is about: Research for the conditions over
// everything, and the narrative's own page for one that follows a narrative.
const conditionLink = computed(() => {
  if (followsNarrative(props.type)) {
    return props.narrativeId
      ? { to: `/narratives/${props.narrativeId}`, label: 'alertRules.viewNarrative' }
      : null
  }
  const query = conditionSearchQuery(props.type, props.modelValue)
  return query ? { to: { path: '/search', query }, label: 'alertRules.openInSearch' } : null
})
</script>
