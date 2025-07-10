<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="topic">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ topic.frequency }}</div>
            <p class="text-sm text-gray-500">{{ $t('topics.totalMentions') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ topic.narratives.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('topics.relatedNarratives') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ topic.videos.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('topics.relatedVideos') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ topic.related_actors.length + topic.related_entities.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('topics.relatedActorsEntities') }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Trend Chart -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ $t('topics.trendOverTime') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64 bg-gray-100 rounded flex items-center justify-center">
            <span class="text-gray-500">{{ $t('common.chartPlaceholder') }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- Related Actors and Entities -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Related Actors -->
        <Card>
          <CardHeader>
            <CardTitle>{{ $t('topics.topActors') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div 
                v-for="actor in topic.related_actors" 
                :key="actor.id"
                @click="goToActor(actor.id)"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <img 
                  v-if="actor.image_url" 
                  :src="actor.image_url" 
                  :alt="actor.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-xs text-gray-500">{{ actor.name.charAt(0) }}</span>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 text-sm">{{ actor.name }}</p>
                  <p v-if="actor.role" class="text-xs text-gray-500">{{ actor.role }}</p>
                </div>
                <span class="text-sm text-gray-500">{{ actor.frequency }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Related Entities -->
        <Card>
          <CardHeader>
            <CardTitle>{{ $t('topics.topEntities') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div 
                v-for="entity in topic.related_entities" 
                :key="entity.id"
                @click="goToEntity(entity.id)"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <img 
                  v-if="entity.image_url" 
                  :src="entity.image_url" 
                  :alt="entity.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-xs text-gray-500">{{ entity.name.charAt(0) }}</span>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 text-sm">{{ entity.name }}</p>
                  <p class="text-xs text-gray-500 capitalize">{{ entity.type }}</p>
                </div>
                <span class="text-sm text-gray-500">{{ entity.frequency }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Related Narratives -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('topics.relatedNarratives') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NarrativeCard 
            v-for="narrative in topic.narratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>

      <!-- Related Videos -->
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('topics.recentVideos') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div 
              v-for="video in topic.videos.slice(0, 5)" 
              :key="video.id"
              class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50"
            >
              <div class="w-24 h-16 bg-gray-200 rounded flex-shrink-0"></div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 line-clamp-1">{{ video.title }}</h4>
                <p class="text-sm text-gray-600 line-clamp-2">{{ video.description }}</p>
                <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span>{{ video.platform }}</span>
                  <span v-if="video.views">{{ formatNumber(video.views) }} {{ $t('common.views') }}</span>
                  <span v-if="video.uploaded_at">{{ formatDate(video.uploaded_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Topic, Actor, Entity, Narrative, Video } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { setPageHeader, clearPageHeader } = usePageHeader();

interface ExtendedTopic extends Topic {
  narratives: Narrative[];
  videos: Video[];
  related_actors: Actor[];
  related_entities: Entity[];
  trend_data: { date: string; count: number }[];
}

const topic = ref<ExtendedTopic | null>(null);
const loading = ref(true);

// Set dynamic page title in the browser tab
useHead(() => ({
  title: topic.value ? topic.value.name : 'Loading...'
}));

// Update the page header with topic information when data changes
watchEffect(() => {
  if (topic.value) {
    const headerHtml = `
      <div class="my-4">
        <h1 class="font-bold text-4xl text-gray-900">${topic.value.name}</h1>
        <p class="text-lg text-gray-600 mt-2">${topic.value.frequency.toLocaleString()} ${$i18n.t('topics.totalMentions').toLowerCase()}</p>
      </div>
    `;
    
    setPageHeader({ customHtml: headerHtml });
  }
});

// Clear the custom header when leaving the page
onBeforeUnmount(() => {
  clearPageHeader();
});

const loadTopic = async () => {
  try {
    loading.value = true;
    topic.value = await apiService.getTopic(route.params.id as string);
  } catch (error) {
    console.error('Failed to load topic:', error);
  } finally {
    loading.value = false;
  }
};

const goToActor = (id: string) => {
  router.push(`/actors/${id}`);
};

const goToEntity = (id: string) => {
  router.push(`/entities/${id}`);
};

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

onMounted(() => {
  loadTopic();
});
</script>