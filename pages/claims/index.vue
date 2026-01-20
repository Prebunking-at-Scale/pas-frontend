<template>
  <div>
    <!-- Filters -->
    <FilterCard
      :title="$t('claims.filters')"
      :has-active-filters="hasActiveFilters"
      @apply-filters="applyFilters"
      @clear-filters="clearFilters"
    >
      <TopicFilter
        v-model="filters.topic_id"
        :label="$t('claims.topic')"
        :placeholder="$t('claims.selectTopic')"
      />
      
      <KeywordsFilter
        class="flex-1"
        v-model="filters.text"
        :label="$t('claims.text')"
        :placeholder="$t('claims.textPlaceholder')"
        @enter-pressed="applyFilters"
      />
      
      <RangeSlider
        class="flex-1"
        v-model="filters.range"
        :label="$t('claims.range')"
        :min="0"
        :max="5"
        :step="0.1"
      />

      <LanguageFilter
        class="w-full"
        v-model="filters.language"
        :label="$t('videos.language')"
        :placeholder="$t('videos.selectLanguage')"
        type="select"
      />
    </FilterCard>

    <!-- Claims List -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
    
    <div v-else>
      <!-- Topic Context -->
      <div v-if="currentTopic" class="mb-6 p-4 bg-stone-100 rounded-lg">
        <p class="text-sm text-emerald-800">
          {{ $t('claims.showingClaimsFor') }} <span class="font-semibold">{{ currentTopic.topic }}</span>
        </p>
      </div>

      <!-- Results Count -->
      <div class="mb-4 text-sm text-gray-600">
        {{ $t('claims.showingResults', { count: claims.total }) }}
      </div>

      <!-- Claims Grid -->
      <div v-if="claims.data.length > 0" class="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <ClaimCard 
          v-for="claim in claims.data" 
          :key="claim.id" 
          :claim="claim"
        />
      </div>
      
      <div v-else class="text-center py-12 text-gray-500">
        {{ $t('claims.noClaimsFound') }}
      </div>

      <!-- Pagination -->
      <Pagination 
        v-if="claims.total > claims.size" 
        v-slot="{ page }"
        :total="claims.total"
        :items-per-page="claims.size"
        :sibling-count="1"
        show-edges
        :default-page="claims.page"
        @update:page="loadPage"
        class="mt-8"
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
                @click="loadPage(item.value)"
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
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Claim, PaginatedResponse, TopicWithStats } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import ClaimCard from '~/components/ClaimCard.vue';
import FilterCard from '~/components/filters/FilterCard.vue';
import TopicFilter from '~/components/filters/TopicFilter.vue';
import KeywordsFilter from '~/components/filters/KeywordsFilter.vue';
import LanguageFilter from '~/components/filters/LanguageFilter.vue';
import RangeSlider from '~/components/filters/RangeSlider.vue';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const topicsStore = useTopicsStore();

// Page title
const { setPageHeader, clearPageHeader } = usePageHeader();

// Data
const claims = ref<PaginatedResponse<Claim>>({
  data: [],
  total: 0,
  page: 1,
  size: 20
});
const loading = ref(true);

// Filters - separate UI state from applied state
const filters = ref({
  topic_id: null as string | null,
  text: [] as string[],
  range: [0, 5] as number[],
  language: 'all'
});

// Applied filters - these are the filters actually being used for data fetching
const appliedFilters = ref({
  topic_id: null as string | null,
  text: [] as string[],
  range: [0, 5] as number[],
  language: 'all'
});

// Current topic is based on APPLIED filters, not UI filters
const currentTopic = computed(() => {
  if (!appliedFilters.value.topic_id || appliedFilters.value.topic_id === 'all') return null;
  return topicsStore.getTopicById(appliedFilters.value.topic_id);
});

const hasActiveFilters = computed(() => {
  // Only show "Clear all filters" when there are APPLIED filters (not default values)
  return (appliedFilters.value.topic_id !== null && appliedFilters.value.topic_id !== 'all') ||
         appliedFilters.value.text.length > 0 ||
         (appliedFilters.value.range[0] !== 0 || appliedFilters.value.range[1] !== 5);
});

const updatePageHeader = () => {
  const topic = currentTopic.value;
  if (topic) {
    setPageHeader({ 
      title: `${topic.topic}: ${$i18n.t('claims.title')}`,
      subtitle: $i18n.t('claims.subtitle')
    });
  } else {
    setPageHeader({ 
      title: $i18n.t('claims.title'),
      subtitle: $i18n.t('claims.subtitle')
    });
  }
};

// Watch for topic changes to update header
watch(currentTopic, () => {
  updatePageHeader();
});

onMounted(async () => {
  // Load available topics for filter
  await topicsStore.fetchTopics();
  
  // Check if we have a topic filter from query params
  const topicId = route.query.topic as string;
  if (topicId) {
    filters.value.topic_id = topicId;
    appliedFilters.value.topic_id = topicId;
  }
  
  // Set page header based on whether we have a topic filter
  updatePageHeader();
  
  await loadClaims();
});

onBeforeUnmount(() => {
  clearPageHeader();
});

const loadClaims = async () => {
  try {
    loading.value = true;
    
    // Build API parameters
    const params: any = {
      limit: 20,
      offset: (claims.value.page - 1) * 20
    };
    
    // Add topic filter if set - use APPLIED filters
    if (appliedFilters.value.topic_id && appliedFilters.value.topic_id !== 'all') {
      params.topic_id = appliedFilters.value.topic_id;
    }
    
    // Add text search parameter if text filters are applied
    if (appliedFilters.value.text.length > 0) {
      params.text = appliedFilters.value.text.join(' ');
    }
    
    if (appliedFilters.value.language && appliedFilters.value.language !== 'all') {
      params.language = appliedFilters.value.language;
    }
    
    // Add range parameters if not default
    if (appliedFilters.value.range[0] !== 0) {
      params.min_score = appliedFilters.value.range[0];
    }
    if (appliedFilters.value.range[1] !== 5) {
      params.max_score = appliedFilters.value.range[1];
    }
    
    const response = await apiService.getClaims(params);
    claims.value = response;
  } catch (error) {
    console.error('Failed to load claims:', error);
    claims.value = {
      data: [],
      total: 0,
      page: 1,
      size: 20
    };
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  // Copy filter values to applied filters
  appliedFilters.value = { ...filters.value };
  claims.value.page = 1;
  loadClaims();
};

const clearFilters = () => {
  filters.value = {
    topic_id: null,
    text: [],
    range: [0, 5]
  };
  appliedFilters.value = {
    topic_id: null,
    text: [],
    range: [0, 5]
  };
  claims.value.page = 1;
  loadClaims();
};

const loadPage = (page: number) => {
  claims.value.page = page;
  loadClaims();
};
</script>