<template>
  <div>
    <!-- Filters -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{{ $t('claims.filters') }}</h2>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {{ $t('claims.clearFilters') }}
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Topic Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('claims.topic') }}
          </label>
          <Select v-model="filters.topic_id">
            <SelectTrigger>
              <SelectValue :placeholder="$t('claims.selectTopic')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ $t('claims.allTopics') }}</SelectItem>
              <SelectItem
                v-for="topic in topicsStore.topics"
                :key="topic.id"
                :value="topic.id"
              >
                {{ topic.topic }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>


        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('claims.search') }}
          </label>
          <Input
            v-model="filters.search"
            type="text"
            :placeholder="$t('claims.searchPlaceholder')"
          />
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <Button @click="applyFilters" class="bg-indigo-600 hover:bg-indigo-700">
          {{ $t('claims.applyFilters') }}
        </Button>
      </div>
    </div>

    <!-- Claims List -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <div v-else>
      <!-- Topic Context -->
      <div v-if="currentTopic" class="mb-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          {{ $t('claims.showingClaimsFor') }} <span class="font-semibold">{{ currentTopic.topic }}</span>
        </p>
      </div>

      <!-- Results Count -->
      <div class="mb-4 text-sm text-gray-600">
        {{ $t('claims.showingResults', { count: claims.total }) }}
      </div>

      <!-- Claims Grid -->
      <div v-if="claims.data.length > 0" class="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import ClaimCard from '~/components/ClaimCard.vue';

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
const currentTopic = computed(() => {
  if (!filters.value.topic_id || filters.value.topic_id === 'all') return null;
  return topicsStore.getTopicById(filters.value.topic_id);
});

// Filters
const filters = ref({
  topic_id: 'all',
  search: ''
});

const hasActiveFilters = computed(() => {
  return (filters.value.topic_id && filters.value.topic_id !== 'all') || filters.value.search;
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
    
    // Add topic filter if set
    if (filters.value.topic_id && filters.value.topic_id !== 'all') {
      params.topic_id = filters.value.topic_id;
    }
    
    const response = await apiService.getClaims(params);
    
    // Apply client-side search filter if needed
    if (response.data && filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      const filteredData = response.data.filter(claim => {
        const claimText = (claim.claim || claim.text || '').toLowerCase();
        return claimText.includes(searchLower);
      });
      
      claims.value = {
        ...response,
        data: filteredData,
        total: filteredData.length
      };
    } else {
      claims.value = response;
    }
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
  claims.value.page = 1;
  loadClaims();
};

const clearFilters = () => {
  filters.value = {
    topic_id: 'all',
    search: ''
  };
  claims.value.page = 1;
  loadClaims();
};

const loadPage = (page: number) => {
  claims.value.page = page;
  loadClaims();
};
</script>