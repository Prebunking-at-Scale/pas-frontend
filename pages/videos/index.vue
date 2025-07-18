<template>
  <div>
    <!-- Filters -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{{ $t('videos.filters') }}</h2>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {{ $t('videos.clearFilters') }}
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Platform Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('videos.platform') }}
          </label>
          <Select v-model="filters.platform">
            <SelectTrigger>
              <SelectValue :placeholder="$t('videos.selectPlatform')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ $t('videos.allPlatforms') }}</SelectItem>
              <SelectItem value="tiktok">{{ $t('videos.tiktok') }}</SelectItem>
              <SelectItem value="youtube">{{ $t('videos.youtube') }}</SelectItem>
              <SelectItem value="instagram">{{ $t('videos.instagram') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Channel Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('videos.channel') }}
          </label>
          <Input
            v-model="filters.channel"
            type="text"
            :placeholder="$t('videos.channelPlaceholder')"
          />
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('videos.search') }}
          </label>
          <Input
            v-model="filters.search"
            type="text"
            :placeholder="$t('videos.searchPlaceholder')"
          />
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <Button @click="applyFilters" class="bg-indigo-600 hover:bg-indigo-700">
          {{ $t('videos.applyFilters') }}
        </Button>
      </div>
    </div>

    <!-- Videos List -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import VideoCard from '~/components/VideoCard.vue';

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

// Filters
const filters = ref({
  platform: 'all',
  channel: '',
  search: ''
});

const hasActiveFilters = computed(() => {
  return (filters.value.platform && filters.value.platform !== 'all') || filters.value.channel || filters.value.search;
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
    
    // Add filters if set
    if (filters.value.platform && filters.value.platform !== 'all') {
      params.platform = [filters.value.platform];
    }
    if (filters.value.channel) {
      params.channel = [filters.value.channel];
    }
    
    const response = await apiService.getVideos(params);
    
    // Apply client-side search filter if needed
    if (filters.value.search && response.data) {
      const searchLower = filters.value.search.toLowerCase();
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
  currentPage.value = 1;
  loadVideos();
};

const clearFilters = () => {
  filters.value = {
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