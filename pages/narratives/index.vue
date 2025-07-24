<template>
  <div>
      <!-- Filters -->
      <FilterCard
        :title="$t('narratives.filters')"
        :columns="{ default: 1, md: 4, lg: 4 }"
        :has-active-filters="hasActiveFilters"
        @apply-filters="applyFilters"
        @clear-filters="resetFilters"
      >
        <ChannelFilter
          v-model="filters.channel"
          :label="$t('narratives.channel')"
          :placeholder="$t('filters.channelPlaceholder')"
        />
        
        <LanguageFilter
          class="w-full"
          v-model="filters.language"
          type="select"
          :label="$t('narratives.language')"
          :placeholder="$t('filters.allLanguages')"
        />
        
        <TopicFilter
          class="w-full"
          v-model="filters.topic_id"
          :label="$t('narratives.topic')"
          :placeholder="$t('narratives.selectTopic')"
        />
        
        <KeywordsFilter
          class="w-full"
          v-model="filters.keywords"
          :label="$t('narratives.keywords')"
          :placeholder="$t('narratives.keywordsPlaceholder')"
        />
      </FilterCard>

      <!-- Topic Context - based on APPLIED filters -->
      <div v-if="currentTopicName && appliedFilters.topic_id" class="mb-6 p-4 bg-stone-100 rounded-lg">
        <p class="text-sm text-emerald-800">
          {{ $t('narratives.showingNarrativesFor') }} <span class="font-semibold">{{ currentTopicName }}</span>
        </p>
      </div>

      <!-- Narratives Grid -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <NarrativeCard
          v-for="narrative in narratives"
          :key="narrative.id"
          :narrative="narrative"
          @click="goToNarrative(narrative.id)"
        />
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
import type { Narrative } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import FilterCard from '~/components/filters/FilterCard.vue';
import TopicFilter from '~/components/filters/TopicFilter.vue';
import ChannelFilter from '~/components/filters/ChannelFilter.vue';
import LanguageFilter from '~/components/filters/LanguageFilter.vue';
import KeywordsFilter from '~/components/filters/KeywordsFilter.vue';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const topicsStore = useTopicsStore();
const { setPageHeader, clearPageHeader } = usePageHeader();


// State
const narratives = ref<Narrative[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalNarratives = ref(0);
const itemsPerPage = 20;

// Filters - separate UI state from applied state
const filters = ref({
  channel: '',
  language: 'all' as string,
  dateFrom: '',
  dateTo: '',
  actors: [] as string[],
  entities: [] as string[],
  topic_id: null as string | null,
  keywords: [] as string[]
});

// Applied filters - these are the filters actually being used for data fetching
const appliedFilters = ref({
  channel: '',
  language: 'all' as string,
  dateFrom: '',
  dateTo: '',
  actors: [] as string[],
  entities: [] as string[],
  topic_id: null as string | null,
  keywords: [] as string[]
});

const currentTopicName = ref('');

const hasActiveFilters = computed(() => {
  // Only show "Clear all filters" when there are APPLIED filters (not default values)
  return appliedFilters.value.channel ||
    (appliedFilters.value.language && appliedFilters.value.language !== 'all') ||
    appliedFilters.value.topic_id !== null ||
    appliedFilters.value.keywords.length > 0;
});


// Methods
const loadNarratives = async () => {
  loading.value = true;
  try {
    let result;
    
    // If we have a topic filter, use the topic-specific endpoint - use APPLIED filters
    if (appliedFilters.value.topic_id) {
      result = await apiService.getTopicNarratives(
        appliedFilters.value.topic_id,
        {
          limit: itemsPerPage,
          offset: (currentPage.value - 1) * itemsPerPage
        }
      );
    } else {
      // Use the general narratives endpoint
      result = await apiService.getNarratives({
        limit: itemsPerPage,
        offset: (currentPage.value - 1) * itemsPerPage
      });
    }
    
    // Apply client-side filters if needed
    let filteredData = result.data;
    
    // Filter by keywords if any - use APPLIED filters
    if (appliedFilters.value.keywords.length > 0) {
      const keywordsLower = appliedFilters.value.keywords.map(k => k.toLowerCase());
      filteredData = filteredData.filter(narrative => {
        const textToSearch = `${narrative.title} ${narrative.description}`.toLowerCase();
        return keywordsLower.some(keyword => textToSearch.includes(keyword));
      });
    }
    
    // Set default values for UI fields if not present
    narratives.value = filteredData.map(narrative => ({
      ...narrative,
      actors: narrative.actors || [],
      entities: narrative.entities || [],
      topics: narrative.topics || [],
      related_content_count: narrative.claim_ids?.length || 0,
      is_active: true, // Default to active since API doesn't provide this
      first_seen: narrative.created_at || new Date().toISOString(),
      last_seen: narrative.updated_at || new Date().toISOString()
    }));
    
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
  // Copy filter values to applied filters
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
  currentPage.value = 1;
  loadNarratives();
};

const resetFilters = () => {
  filters.value = {
    channel: '',
    language: 'all',
    dateFrom: '',
    dateTo: '',
    actors: [],
    entities: [],
    topic_id: null,
    keywords: []
  };
  appliedFilters.value = {
    channel: '',
    language: 'all',
    dateFrom: '',
    dateTo: '',
    actors: [],
    entities: [],
    topic_id: null,
    keywords: []
  };
  currentTopicName.value = '';
  currentPage.value = 1;
  loadNarratives();
};

const clearTopicFilter = () => {
  filters.value.topic_id = null;
  appliedFilters.value.topic_id = null;
  currentTopicName.value = '';
  currentPage.value = 1;
  updatePageHeader();
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
  router.push(`/narratives/${id}`);
};


// Watch for APPLIED topic filter changes to update header
watch(() => appliedFilters.value.topic_id, (newTopicId) => {
  if (newTopicId) {
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
  
  // Check if we have a topic filter from query params
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
  
  // Update page header
  updatePageHeader();
  
  loadNarratives();
});

onBeforeUnmount(() => {
  clearPageHeader();
});
</script>
