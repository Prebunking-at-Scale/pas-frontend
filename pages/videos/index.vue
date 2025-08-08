<template>
  <div>
    <!-- Filters -->
    <FilterCard
      :title="$t('videos.filters')"
      :columns="3"
      :has-active-filters="hasActiveFilters"
      @apply-filters="applyFilters"
      @clear-filters="clearFilters"
    >
      <PlatformFilter
        v-model="filters.platform"
        :label="$t('videos.platform')"
        :placeholder="$t('videos.selectPlatform')"
      />
      
      <ChannelFilter
        v-model="filters.channel"
        :label="$t('videos.channel')"
        :placeholder="$t('videos.channelPlaceholder')"
      />
      
      <SearchFilter
        v-model="filters.search"
        :label="$t('videos.search')"
        :placeholder="$t('videos.searchPlaceholder')"
      />
    </FilterCard>

    <!-- Videos List -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
    
    <div v-else>
      <!-- Results Count -->
      <div class="mb-4 text-sm text-gray-600">
        {{ $t('videos.showingResults', { count: videos.total }) }}
      </div>

      <!-- Videos Grid -->
      <div v-if="videos.data.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VideoCard 
          v-for="video in videos.data" 
          :key="video.id" 
          :video="video"
          @click="goToVideo"
        />
      </div>
      
      <div v-else class="text-center py-12 text-gray-500">
        {{ $t('videos.noVideosFound') }}
      </div>

      <!-- Pagination -->
      <Pagination 
        v-if="videos.total > videos.size" 
        v-slot="{ page }"
        :total="videos.total"
        :items-per-page="videos.size"
        :sibling-count="1"
        show-edges
        :default-page="currentPage"
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
import type { Video, PaginatedResponse } from '~/types/api';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import VideoCard from '~/components/VideoCard.vue';
import FilterCard from '~/components/filters/FilterCard.vue';
import PlatformFilter from '~/components/filters/PlatformFilter.vue';
import ChannelFilter from '~/components/filters/ChannelFilter.vue';
import SearchFilter from '~/components/filters/SearchFilter.vue';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const router = useRouter();
const { $i18n } = useNuxtApp();

// Page title
const { setPageHeader, clearPageHeader } = usePageHeader();

// Data
const videos = ref<PaginatedResponse<Video>>({
  data: [],
  total: 0,
  page: 1,
  size: 20
});
const loading = ref(true);
const currentPage = ref(1);

// Filters - separate UI state from applied state
const filters = ref({
  platform: 'all',
  channel: '',
  search: ''
});

// Applied filters - these are the filters actually being used for data fetching
const appliedFilters = ref({
  platform: 'all',
  channel: '',
  search: ''
});

const hasActiveFilters = computed(() => {
  // Only show "Clear all filters" when there are APPLIED filters (not default values)
  return (appliedFilters.value.platform && appliedFilters.value.platform !== 'all') || 
         appliedFilters.value.channel || 
         appliedFilters.value.search;
});

const totalPages = computed(() => {
  return Math.ceil(videos.value.total / videos.value.size);
});

onMounted(async () => {
  setPageHeader({ 
    title: $i18n.t('videos.title'),
    subtitle: $i18n.t('videos.subtitle')
  });
  
  await loadVideos();
});

onBeforeUnmount(() => {
  clearPageHeader();
});

const loadVideos = async () => {
  try {
    loading.value = true;
    
    // Build API parameters
    const params: any = {
      limit: 20,
      offset: (currentPage.value - 1) * 20
    };
    
    // Add filters if set - use APPLIED filters
    if (appliedFilters.value.platform && appliedFilters.value.platform !== 'all') {
      params.platform = [appliedFilters.value.platform];
    }
    if (appliedFilters.value.channel) {
      params.channel = [appliedFilters.value.channel];
    }
    
    const response = await apiService.getVideos(params);
    
    // Apply client-side search filter if needed - use APPLIED filters
    if (appliedFilters.value.search && response.data) {
      const searchLower = appliedFilters.value.search.toLowerCase();
      const filteredData = response.data.filter(video => 
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower)
      );
      
      videos.value = {
        ...response,
        data: filteredData,
        total: filteredData.length
      };
    } else {
      videos.value = response;
    }
    
    // Update page tracking
    videos.value.page = currentPage.value;
  } catch (error) {
    console.error('Failed to load videos:', error);
    videos.value = {
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
  currentPage.value = 1;
  loadVideos();
};

const clearFilters = () => {
  filters.value = {
    platform: 'all',
    channel: '',
    search: ''
  };
  appliedFilters.value = {
    platform: 'all',
    channel: '',
    search: ''
  };
  currentPage.value = 1;
  loadVideos();
};

const loadPage = (page: number) => {
  currentPage.value = page;
  loadVideos();
};

const goToVideo = (videoId: string) => {
  // Navigate to video detail page when available
  router.push(`/videos/${videoId}`);
};

</script>