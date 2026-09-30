<template>
  <div>
    <!-- Filters -->
    <FilterCard
      :title="$t('search.filters')"
      :columns="{ default: 1 }"
      :has-active-filters="hasActiveFilters"
      @apply-filters="applyFilters"
      @clear-filters="clearFilters"
    >
      <!-- Main filters, always visible -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MultiSelectFilter
          v-model="draft.topic_id"
          :label="$t('filters.topic')"
          :placeholder="$t('filters.allTopics')"
          :options="topicOptions"
        />
        <MultiSelectFilter
          v-model="draft.language"
          :label="$t('filters.language')"
          :placeholder="$t('filters.allLanguages')"
          :options="languageOptions"
          searchable
        />
        <KeywordTagsFilter
          ref="keywordsFilter"
          v-model="draft.keyword"
          v-model:mode="draft.keyword_mode"
          saved-kind="keyword"
          class="md:col-span-2"
          @enter-pressed="applyFilters"
        />
      </div>

      <!-- More filters, behind a toggle -->
      <div>
        <Button
          variant="ghost"
          size="sm"
          class="-ml-3 cursor-pointer text-emerald-800 hover:text-emerald-900"
          :aria-expanded="showMoreFilters"
          aria-controls="more-filters"
          @click="showMoreFilters = !showMoreFilters"
        >
          <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': showMoreFilters }" />
          {{ showMoreFilters ? $t('search.fewerFilters') : $t('search.moreFilters') }}
          <span
            v-if="moreFiltersCount > 0"
            class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
          >
            {{ moreFiltersCount }}
          </span>
        </Button>

        <div
          v-show="showMoreFilters"
          id="more-filters"
          class="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <MultiSelectFilter
            v-model="draft.entity_id"
            :label="$t('search.entities')"
            :placeholder="$t('filters.allEntities')"
            :options="entityOptions"
            saved-kind="entity_id"
            searchable
            :search-placeholder="$t('filters.searchEntity')"
            :empty-text="$t('filters.typeToSearch', { count: ENTITY_SEARCH_MIN })"
            @search="searchEntities"
          />
          <MultiSelectFilter
            v-model="draft.platform"
            :label="$t('filters.platform')"
            :placeholder="$t('filters.allPlatforms')"
            :options="platformOptions"
          />
          <MultiSelectFilter
            v-model="draft.channel"
            :label="$t('filters.channel')"
            :placeholder="$t('filters.allChannels')"
            :options="channelOptions"
            class="md:col-span-2"
            saved-kind="channel"
            chips
            :platform-of="platformOfChannel"
            searchable
            :search-placeholder="$t('filters.searchChannel')"
            :empty-text="$t('filters.typeToSearch', { count: CHANNEL_SEARCH_MIN })"
            @search="(text) => searchChannels(text, draft.platform)"
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
          <DateRangeFilter
            :model-value="{ start: draft.date_from, end: draft.date_to }"
            :label="$t('search.date')"
            class="md:col-span-2"
            @update:model-value="(range) => { draft.date_from = range.start; draft.date_to = range.end }"
          />

          <!-- Tab-specific filters -->
          <RangeSlider
            v-if="draft.tab === 'claims'"
            v-model="draft.score"
            class="md:col-span-2"
            :label="$t('claims.range')"
            :min="SCORE_RANGE[0]"
            :max="SCORE_RANGE[1]"
            :step="0.1"
          />
          <SpreadPatternFilter
            v-if="draft.tab === 'narratives'"
            :model-value="draft.spread_pattern as NarrativeSpreadPattern[]"
            class="md:col-span-2"
            @update:model-value="draft.spread_pattern = $event"
          />
        </div>
      </div>
    </FilterCard>

    <!-- Tabs, each with its count for the current filters -->
    <div role="tablist" class="mb-6 flex gap-1 border-b border-neutral-200">
      <button
        v-for="tab in SEARCH_TABS"
        :key="tab"
        role="tab"
        type="button"
        :aria-selected="applied.tab === tab"
        class="-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        :class="applied.tab === tab
          ? 'border-emerald-700 text-emerald-900'
          : 'border-transparent text-gray-500 hover:text-gray-900'"
        @click="switchTab(tab)"
      >
        {{ $t(`search.tabs.${tab}`) }}
        <span
          class="rounded-full px-2 py-0.5 text-xs tabular-nums"
          :class="applied.tab === tab ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-gray-600'"
        >
          {{ counts ? countLabel(counts[tab].total, counts[tab].capped) : '–' }}
        </span>
      </button>
    </div>

    <!-- Results -->
    <div v-if="loading" class="flex justify-center py-8">
      <Spinner />
    </div>

    <p v-else-if="failed" class="py-12 text-center text-red-700">{{ $t('search.error') }}</p>

    <p v-else-if="results.length === 0" class="py-12 text-center text-gray-500">
      {{ $t('search.noResults') }}
    </p>

    <template v-else>
      <p v-if="totalCapped" class="mb-3 text-sm text-gray-600">{{ $t('search.narrowToSeeMore') }}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="(result, index) in results" :key="result.id ?? index" class="flex flex-col gap-2">
          <MatchSourceBadge
            v-if="result.match_source !== 'direct'"
            class="self-start"
            :source="result.match_source === 'narrative' ? 'narrative' : 'claims'"
            :entities="result.via_entities"
          />
          <NarrativeCard
            v-if="resultsTab === 'narratives'"
            class="flex-1"
            :narrative="result as NarrativeSummary"
            @click="router.push(`/narratives/${result.id}`)"
          />
          <ClaimCard
            v-else-if="resultsTab === 'claims'"
            class="flex-1"
            :claim="result as Claim"
            @navigate-to-video="goToVideo"
          />
          <VideoCard
            v-else
            class="flex-1"
            :video="result as Video"
            @click="(id: string) => router.push(`/videos/${id}`)"
          />
        </div>
      </div>
    </template>

    <!-- Pagination -->
    <Pagination
      v-if="!loading && total > PAGE_SIZE"
      v-slot="{ page }"
      :total="total"
      :items-per-page="PAGE_SIZE"
      :sibling-count="1"
      show-edges
      :page="currentPage"
      class="mt-6"
      @update:page="goToPage"
    >
      <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst />
        <PaginationPrevious />

        <template v-for="(item, index) in items">
          <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <Button
              :variant="item.value === page ? 'default' : 'outline'"
              size="sm"
              class="cursor-pointer"
              @click="goToPage(item.value)"
            >
              {{ item.value }}
            </Button>
          </PaginationItem>
          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>
  </div>
</template>

<script setup lang="ts">
// Research: one search over narratives, claims and videos with the same filters
// (docs/filters.md), on core-api's /api/search (docs/research-implementation.md).
import { ChevronDown } from 'lucide-vue-next';
import type { Claim, NarrativeSpreadPattern, NarrativeSummary, Video } from '~/types/api';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import FilterCard from '~/components/filters/FilterCard.vue';
import FilterToggle from '~/components/filters/FilterToggle.vue';
import MultiSelectFilter from '~/components/filters/MultiSelectFilter.vue';
import KeywordTagsFilter from '~/components/filters/KeywordTagsFilter.vue';
import DateRangeFilter from '~/components/filters/DateRangeFilter.vue';
import RangeSlider from '~/components/filters/RangeSlider.vue';
import SpreadPatternFilter from '~/components/filters/SpreadPatternFilter.vue';
import MatchSourceBadge from '~/components/MatchSourceBadge.vue';
import NarrativeCard from '~/components/NarrativeCard.vue';
import ClaimCard from '~/components/ClaimCard.vue';
import VideoCard from '~/components/VideoCard.vue';
import { searchService } from '~/services/search';
import type { SearchCounts, WithMatchSource } from '~/services/search';
import { CHANNEL_SEARCH_MIN, ENTITY_SEARCH_MIN } from '~/composables/useSearchFilterOptions';
import {
  SCORE_RANGE,
  SEARCH_QUERY_KEYS,
  SEARCH_TABS,
  countMoreFilters,
  emptySearchState,
  hasSearchFilters,
  searchPageFromQuery,
  searchRequestParams,
  searchStateFromQuery,
  searchStateToQuery,
} from '~/utils/searchQuery';
import type { SearchState, SearchTab } from '~/utils/searchQuery';

definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const PAGE_SIZE = 12;

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { setPageHeader, clearPageHeader } = usePageHeader();

// The applied search is whatever the URL says; the form edits a draft of it.
const applied = computed(() => searchStateFromQuery(route.query));
const currentPage = computed(() => searchPageFromQuery(route.query));
const draft = ref<SearchState>(searchStateFromQuery(route.query));
const keywordsFilter = ref<InstanceType<typeof KeywordTagsFilter>>();

const hasActiveFilters = computed(() => hasSearchFilters(applied.value));

// Topic, language and keywords are always shown; the rest sit behind "More filters".
// The panel starts open when a search already uses one of them, so no active filter
// is hidden, and the button counts how many are set.
const moreFiltersCount = computed(() => countMoreFilters(draft.value));
const showMoreFilters = ref(countMoreFilters(applied.value) > 0);

// Filter options
const {
  load: loadOptions,
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
} = useSearchFilterOptions();

const entityOptions = entityOptionsFor(computed(() => draft.value.entity_id));
const channelOptions = channelOptionsFor(
  computed(() => draft.value.platform),
  computed(() => draft.value.channel),
);

// "Ours" puts the organisation's own channels into the filter.
const {
  onlyOwn: onlyOwnChannels,
  setOnlyOwn: setOnlyOwnChannels,
  scopeOptions: channelScopeOptions,
} = useOwnChannelsFilter(
  () => draft.value.channel,
  (channels) => { draft.value.channel = channels },
  ownChannels,
);

// Entities from the URL or a saved selection arrive as ids: fetch their names.
watch(() => draft.value.entity_id, (ids) => { resolveEntities(ids) }, { immediate: true });

// Results
type Result = WithMatchSource<Video | Claim | NarrativeSummary>;
const results = ref<Result[]>([]);
// The tab the current results belong to, so cards never render another tab's items.
const resultsTab = ref<SearchTab>(applied.value.tab);
const total = ref(0);
const totalCapped = ref(false);
const counts = ref<SearchCounts | null>(null);
const loading = ref(true);
const failed = ref(false);

/** A count as shown: "10,000+" when the API stopped counting. */
const countLabel = (count: number, capped: boolean) => {
  const formatted = new Intl.NumberFormat(locale.value).format(count);
  return capped ? t('search.countCapped', { count: formatted }) : formatted;
};

// Counts depend on the filters only, not on the page: fetched again when those change.
let countsFor = '';
const loadCounts = (params: Record<string, string | number | string[]>) => {
  const key = JSON.stringify(params);
  if (key === countsFor) return;
  countsFor = key;
  counts.value = null;
  searchService.counts(params)
    .then((result) => { if (key === countsFor) counts.value = result; })
    .catch((error) => { console.error('Failed to count results:', error); });
};

let requestId = 0;
const loadResults = async () => {
  const state = applied.value;
  const params = searchRequestParams(state);
  const id = ++requestId;
  loading.value = true;
  failed.value = false;
  loadCounts(params);
  try {
    const response = await searchService.search(state.tab, {
      ...params,
      limit: PAGE_SIZE,
      offset: (currentPage.value - 1) * PAGE_SIZE,
    });
    if (id !== requestId) return;
    results.value = response.data as Result[];
    resultsTab.value = state.tab;
    total.value = response.total;
    totalCapped.value = response.total_capped;
  } catch (error) {
    if (id !== requestId) return;
    console.error('Failed to search:', error);
    results.value = [];
    total.value = 0;
    totalCapped.value = false;
    failed.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
};

/** Navigates to a search state, keeping query keys the page doesn't own. */
const navigate = (state: SearchState, page = 1) => {
  const foreign = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !SEARCH_QUERY_KEYS.includes(key)),
  );
  router.push({ query: { ...foreign, ...searchStateToQuery(state, page) } });
};

const applyFilters = () => {
  // A keyword typed but not yet confirmed with Enter still counts.
  keywordsFilter.value?.commit();
  nextTick(() => navigate(draft.value));
};

const clearFilters = () => navigate(emptySearchState(applied.value.tab));

// Switching tabs keeps the applied filters (unapplied edits are discarded), and drops
// the previous tab's specific filters, since they only exist on their own tab.
const switchTab = (tab: SearchTab) => {
  if (tab !== applied.value.tab) navigate({ ...applied.value, tab });
};

const goToPage = (page: number) => {
  if (page !== currentPage.value) navigate(applied.value, page);
};

// A claim opens its video where the claim is said.
const goToVideo = (videoId: string, startTimeSeconds?: number) => {
  router.push({
    path: `/videos/${videoId}`,
    query: startTimeSeconds !== undefined ? { t: String(Math.floor(startTimeSeconds)) } : {},
  });
};

watch(() => route.query, () => {
  draft.value = searchStateFromQuery(route.query);
  loadResults();
});

onMounted(() => {
  setPageHeader({ title: t('search.title') });
  loadResults();
  loadOptions();
});

onBeforeUnmount(() => {
  clearPageHeader();
});
</script>
