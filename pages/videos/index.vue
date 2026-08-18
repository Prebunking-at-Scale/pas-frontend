<template>
  <div>
    <!-- Filters -->
    <FilterCard
      :title="$t('videos.filters')"
      :columns="{ default: 1, md: 3, lg: 3 }"
      :has-active-filters="hasActiveFilters"
      @apply-filters="applyFilters"
      @clear-filters="clearFilters"
    >
      <PlatformFilter
        class="w-full"
        v-model="filters.platform"
        :label="$t('videos.platform')"
        :placeholder="$t('videos.selectPlatform')"
      />
      
      <ChannelFilter
        class="w-full"
        v-model="filters.channel"
        :label="$t('videos.channel')"
        :placeholder="$t('videos.channelPlaceholder')"
        @enter-pressed="applyFilters"
      />
      
      <KeywordsFilter
        class="w-full"
        v-model="filters.text"
        :label="$t('videos.text')"
        :placeholder="$t('videos.textPlaceholder')"
        @enter-pressed="applyFilters"
      />

      <LanguageFilter
        class="w-full"
        v-model="filters.language"
        :label="$t('videos.language')"
        :placeholder="$t('videos.selectLanguage')"
        type="select"
      />

      <DateRangeFilter
        class="w-full"
        v-model="filters.date_range"
        id="videos-date-range"
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
import type { Video, PaginatedResponse } from '~/types/api';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import VideoCard from '~/components/VideoCard.vue';
import FilterCard from '~/components/filters/FilterCard.vue';
import PlatformFilter from '~/components/filters/PlatformFilter.vue';
import ChannelFilter from '~/components/filters/ChannelFilter.vue';
import KeywordsFilter from '~/components/filters/KeywordsFilter.vue';
import LanguageFilter from '~/components/filters/LanguageFilter.vue';
import DateRangeFilter from '~/components/filters/DateRangeFilter.vue';
import type { DateRange } from '~/types/filters';
import { startOfDayISO, endOfDayISO } from '~/utils/date';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const router = useRouter();
const { $i18n } = useNuxtApp();
const { saveListState, restoreListState, clearListState } = useListStatePreservation('videos');

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

const emptyDateRange = (): DateRange => ({ start: null, end: null });

// Filters - separate UI state from applied state
const filters = ref({
  platform: 'all',
  channel: '',
  text: [] as string[],
  language: 'all',
  date_range: emptyDateRange()
});

// Applied filters - these are the filters actually being used for data fetching
const appliedFilters = ref({
  platform: 'all',
  channel: '',
  text: [] as string[],
  language: 'all',
  date_range: emptyDateRange()
});

const hasActiveFilters = computed(() => {
  // Only show "Clear all filters" when there are APPLIED filters (not default values)
  return (appliedFilters.value.platform && appliedFilters.value.platform !== 'all') || 
         appliedFilters.value.channel ||
         appliedFilters.value.text.length > 0 ||
         !!appliedFilters.value.date_range.start ||
         !!appliedFilters.value.date_range.end;
});

const totalPages = computed(() => {
  return Math.ceil(videos.value.total / videos.value.size);
});

onMounted(async () => {
  // Check if we have saved state from previous navigation (browser back button)
  const savedState = restoreListState();
  if (savedState) {
    // Restore pagination and filters from saved state
    currentPage.value = savedState.currentPage;
    filters.value = { ...filters.value, ...savedState.filters };
    appliedFilters.value = { ...appliedFilters.value, ...savedState.appliedFilters };
    
    // Clear saved state after restoring
    clearListState();
  }
  
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
    if (appliedFilters.value.language && appliedFilters.value.language !== 'all') {
      params.language = [appliedFilters.value.language];
    }

    // Add text search parameter if text filters are applied
    if (appliedFilters.value.text.length > 0) {
      params.text = appliedFilters.value.text.join(' ');
    }

    // Either end stands alone: a start date on its own reads as "from then on".
    const startDate = startOfDayISO(appliedFilters.value.date_range.start);
    if (startDate) {
      params.start_date = startDate;
    }

    const endDate = endOfDayISO(appliedFilters.value.date_range.end);
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await apiService.getVideos(params);
    videos.value = response;
    
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
    text: [],
    language: 'all',
    date_range: emptyDateRange()
  };
  appliedFilters.value = {
    platform: 'all',
    channel: '',
    text: [],
    language: 'all',
    date_range: emptyDateRange()
  };
  currentPage.value = 1;
  loadVideos();
};

const loadPage = (page: number) => {
  currentPage.value = page;
  loadVideos();
};

const goToVideo = (videoId: string) => {
  // Save current state before navigating to video detail
  saveListState({
    currentPage: currentPage.value,
    filters: filters.value,
    appliedFilters: appliedFilters.value
  });
  router.push(`/videos/${videoId}`);
};

</script>