<template>
  <div>
      <!-- Filters -->
      <FilterCard
        :title="$t('narratives.filters')"
        :columns="{ default: 1, md: 1, lg: 1 }"
        :has-active-filters="hasActiveFilters"
        @apply-filters="applyFilters"
        @clear-filters="resetFilters"
      >
        <div class="flex flex-col md:flex-row gap-4">
          <TopicFilter
            class="w-full md:w-48"
            v-model="filters.topic_id"
            :label="$t('narratives.topic')"
            :placeholder="$t('narratives.selectTopic')"
          />

          <EntityFilter
            class="w-full md:w-48"
            v-model="filters.entity_id"
            :label="$t('narratives.entity')"
            :placeholder="$t('narratives.selectEntity')"
          />
          
          <KeywordsFilter
            class="w-full md:w-96"
            v-model="filters.text"
            :label="$t('narratives.text')"
            :placeholder="$t('narratives.textPlaceholder')"
            @enter-pressed="applyFilters"
          />

          <LanguageFilter
            class="w-full"
            v-model="filters.language"
            :label="$t('videos.language')"
            :placeholder="$t('videos.selectLanguage')"
            type="select"
          />

          <SpreadPatternFilter
            class="w-full md:w-auto md:shrink-0"
            v-model="filters.spread_pattern"
          />
        </div>
      </FilterCard>

      <!-- Topic Context - based on APPLIED filters -->
      <div v-if="currentTopicName && appliedFilters.topic_id && appliedFilters.topic_id !== 'all'" class="mb-6 p-4 bg-stone-100 rounded-lg">
        <p class="text-sm text-emerald-800">
          {{ $t('narratives.showingNarrativesFor') }} <span class="font-semibold">{{ currentTopicName }}</span>
        </p>
      </div>

      <!-- Narratives Grid -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
      <div v-else>
        <!-- Results Count -->
        <div class="mb-4 text-sm text-gray-600">
          {{ $t('narratives.showingResults', { count: totalNarratives }) }}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <NarrativeCard
            v-for="narrative in narratives"
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>

      <!-- Pagination -->
      <Pagination 
        v-if="totalNarratives > itemsPerPage" 
        v-slot="{ page }"
        :total="totalNarratives"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        :default-page="currentPage"
        @update:page="(newPage) => { currentPage = newPage; loadNarratives(); }"
        class="mt-6"
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
                @click="() => { currentPage = item.value; loadNarratives(); }"
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
import { apiService } from '~/services/api';
import type { NarrativeSpreadPattern, NarrativeSummary } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import FilterCard from '~/components/filters/FilterCard.vue';
import TopicFilter from '~/components/filters/TopicFilter.vue';
import EntityFilter from '~/components/filters/EntityFilter.vue';
import KeywordsFilter from '~/components/filters/KeywordsFilter.vue';
import LanguageFilter from '~/components/filters/LanguageFilter.vue';
import SpreadPatternFilter from '~/components/filters/SpreadPatternFilter.vue';
import { normalizeSpreadPatterns } from '~/utils/spreadPatterns';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const topicsStore = useTopicsStore();
const { setPageHeader, clearPageHeader } = usePageHeader();
const { saveListState, restoreListState, clearListState, hasSavedState } = useListStatePreservation('narratives');


// State
const narratives = ref<NarrativeSummary[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalNarratives = ref(0);
const itemsPerPage = 20;

// Filters - separate UI state from applied state
const filters = ref({
  topic_id: null as string | null,
  entity_id: null as string | null,
  text: [] as string[],
  language: 'all',
  spread_pattern: [] as NarrativeSpreadPattern[]
});

// Applied filters - these are the filters actually being used for data fetching
const appliedFilters = ref({
  topic_id: null as string | null,
  entity_id: null as string | null,
  text: [] as string[],
  language: 'all',
  spread_pattern: [] as NarrativeSpreadPattern[]
});

const currentTopicName = ref('');

const hasActiveFilters = computed(() => {
  // Only show "Clear all filters" when there are APPLIED filters (not default values)
  return (appliedFilters.value.topic_id !== null && appliedFilters.value.topic_id !== 'all') ||
    (appliedFilters.value.entity_id !== null && appliedFilters.value.entity_id !== 'all') ||
    appliedFilters.value.text.length > 0 ||
    appliedFilters.value.spread_pattern.length > 0;
});


// Methods
const loadNarratives = async () => {
  loading.value = true;
  try {
    const params: any = {
      limit: itemsPerPage,
      offset: (currentPage.value - 1) * itemsPerPage
    };
    
    if (appliedFilters.value.topic_id && appliedFilters.value.topic_id !== 'all') {
      params.topic_id = appliedFilters.value.topic_id;
    }
    
    if (appliedFilters.value.entity_id && appliedFilters.value.entity_id !== 'all') {
      params.entity_id = appliedFilters.value.entity_id;
    }
    
    if (appliedFilters.value.text.length > 0) {
      params.text = appliedFilters.value.text.join(' ');
    }

    if (appliedFilters.value.language && appliedFilters.value.language !== 'all') {
      params.language = appliedFilters.value.language;
    }

    if (appliedFilters.value.spread_pattern.length > 0) {
      params.spread_pattern = appliedFilters.value.spread_pattern;
    }

    const result = await apiService.getNarratives(params);

    narratives.value = result.data;
    totalNarratives.value = result.total;
  } catch (error) {
    console.error('Failed to load narratives:', error);
    narratives.value = [];
    totalNarratives.value = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
  currentPage.value = 1;
  loadNarratives();
};

const resetFilters = () => {
  filters.value = {
    topic_id: null,
    entity_id: null,
    text: [],
    language: 'all',
    spread_pattern: []
  };
  appliedFilters.value = {
    topic_id: null,
    entity_id: null,
    text: [],
    language: 'all',
    spread_pattern: []
  };
  currentTopicName.value = '';
  currentPage.value = 1;
  loadNarratives();
};


const updatePageHeader = () => {
  if (currentTopicName.value) {
    setPageHeader({ 
      title: `${currentTopicName.value}: ${$i18n.t('narratives.title')}`
    });
  } else {
    setPageHeader({ 
      title: $i18n.t('narratives.title')
    });
  }
};

const goToNarrative = (id: string) => {
  // Save current state before navigating to detail
  saveListState({
    currentPage: currentPage.value,
    filters: filters.value,
    appliedFilters: appliedFilters.value
  });
  router.push(`/narratives/${id}`);
};


// Watch for APPLIED topic filter changes to update header
watch(() => appliedFilters.value.topic_id, (newTopicId) => {
  if (newTopicId && newTopicId !== 'all') {
    const topic = topicsStore.getTopicById(newTopicId);
    currentTopicName.value = topic?.topic || '';
  } else {
    currentTopicName.value = '';
  }
  updatePageHeader();
});

// Load initial data
onMounted(async () => {
  // Load available topics for filter
  await topicsStore.fetchTopics();
  
  // Check if we have saved state from previous navigation (browser back button)
  const savedState = restoreListState();
  if (savedState) {
    // Restore pagination and filters from saved state
    currentPage.value = savedState.currentPage;
    filters.value = { ...filters.value, ...savedState.filters };
    appliedFilters.value = { ...appliedFilters.value, ...savedState.appliedFilters };
    
    // Update topic name if topic filter was applied
    if (appliedFilters.value.topic_id && appliedFilters.value.topic_id !== 'all') {
      const topic = topicsStore.getTopicById(appliedFilters.value.topic_id);
      currentTopicName.value = topic?.topic || '';
    }
    
    // Clear saved state after restoring to avoid unwanted restoration on future visits
    clearListState();
  } else {
    // No saved state, check for query params (direct navigation)
    const topicId = route.query.topic as string;
    if (topicId) {
      // Load topic from store
      const topic = await topicsStore.ensureTopicLoaded(topicId);
      if (topic) {
        filters.value.topic_id = topicId;
        appliedFilters.value.topic_id = topicId;
        currentTopicName.value = topic.topic;
      }
    }
    
    // Check if we have an entity filter from query params
    const entityId = route.query.entity as string;
    if (entityId) {
      filters.value.entity_id = entityId;
      appliedFilters.value.entity_id = entityId;
    }

    // Check if we have a spread-pattern filter from query params (e.g. from the
    // dashboard triage chips). Accepts a single value or a repeated param.
    //
    // Normalised rather than cast: a bookmark or an old dashboard link may still carry
    // a retired pattern (`alert`, `watch`, `none`), and sending one on would filter the
    // list down to nothing with no visible reason. Dropping it shows every narrative,
    // which is the honest reading of a filter we can no longer apply.
    const spreadPatternParam = route.query.spread_pattern;
    if (spreadPatternParam) {
      const raw = Array.isArray(spreadPatternParam) ? spreadPatternParam : [spreadPatternParam];
      const patterns = normalizeSpreadPatterns(raw.filter((value): value is string => typeof value === 'string'));
      filters.value.spread_pattern = patterns;
      appliedFilters.value.spread_pattern = patterns;
    }
  }
  
  // Update page header
  updatePageHeader();
  
  loadNarratives();
});

onBeforeUnmount(() => {
  clearPageHeader();
});
</script>
