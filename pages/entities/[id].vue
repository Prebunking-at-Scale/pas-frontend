<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="entity">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ entity.frequency }}</div>
            <p class="text-sm text-gray-500">{{ $t('entities.mentions') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ entity.narratives.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('entities.relatedNarratives') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ entity.videos.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('entities.relatedVideos') }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ entity.related_actors.length }}</div>
            <p class="text-sm text-gray-500">{{ $t('entities.relatedActors') }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Related Actors -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ $t('entities.relatedActors') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="actor in entity.related_actors" 
              :key="actor.id"
              @click="goToActor(actor.id)"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-stone-50 cursor-pointer"
            >
              <img 
                v-if="actor.image_url" 
                :src="actor.image_url" 
                :alt="actor.name"
                class="w-12 h-12 rounded-full object-cover"
              >
              <div v-else class="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
                <span class="text-sm text-gray-500">{{ actor.name.charAt(0) }}</span>
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ actor.name }}</p>
                <p v-if="actor.role" class="text-sm text-gray-500">{{ actor.role }}</p>
                <p class="text-xs text-gray-400">{{ $t('entities.frequency') }}: {{ actor.frequency }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Related Topics -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ $t('entities.relatedTopics') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="topic in entity.related_topics"
              :key="topic.id"
              variant="outline"
              size="sm"
              @click="goToTopic(topic.id)"
            >
              {{ topic.name }}
              <span class="ml-2 text-xs text-gray-500">({{ topic.frequency }})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Related Narratives -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('entities.relatedNarratives') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NarrativeCard 
            v-for="narrative in entity.narratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>

      <!-- Related Videos -->
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('entities.relatedVideos') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div 
              v-for="video in entity.videos.slice(0, 5)" 
              :key="video.id"
              class="flex items-center space-x-4 p-3 rounded-lg hover:bg-stone-50"
            >
              <div class="w-24 h-16 bg-stone-200 rounded flex-shrink-0"></div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 line-clamp-1">{{ video.title }}</h4>
                <p class="text-sm text-gray-600 line-clamp-2">{{ video.description }}</p>
                <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span>{{ video.platform }}</span>
                  <span v-if="video.views">{{ formatNumber(video.views) }} {{ $t('common.views') }}</span>
                  <span v-if="video.uploaded_at">{{ formatDate(video.uploaded_at, $i18n.locale.value) }}</span>
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
import type { Entity, Actor, Topic, Narrative, Video } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { formatDate } from '~/utils/date';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { setPageHeader, clearPageHeader } = usePageHeader();

interface ExtendedEntity extends Entity {
  narratives: Narrative[];
  videos: Video[];
  related_actors: Actor[];
  related_topics: Topic[];
}

const entity = ref<ExtendedEntity | null>(null);
const loading = ref(true);

// Set dynamic page title in the browser tab
useHead(() => ({
  title: entity.value ? entity.value.name : 'Loading...'
}));

// Update the page header with entity information when data changes
watchEffect(() => {
  if (entity.value) {
    const headerHtml = `
      <div class="flex items-center space-x-4 my-4">
        ${entity.value.image_url ? 
          `<img src="${entity.value.image_url}" alt="${entity.value.name}" class="w-16 h-16 rounded-full object-cover">` : 
          `<div class="w-16 h-16 rounded-full bg-stone-300 flex items-center justify-center">
            <span class="text-xl text-gray-600">${entity.value.name.charAt(0)}</span>
          </div>`
        }
        <div>
          <h1 class="font-bold text-4xl text-gray-900">${entity.value.name}</h1>
          <p class="text-lg text-gray-600 mt-1 capitalize">${entity.value.type}</p>
        </div>
      </div>
    `;
    
    setPageHeader({ customHtml: headerHtml });
  }
});

// Clear the custom header when leaving the page
onBeforeUnmount(() => {
  clearPageHeader();
});

const loadEntity = async () => {
  try {
    loading.value = true;
    entity.value = await apiService.getEntity(route.params.id as string);
  } catch (error) {
    console.error('Failed to load entity:', error);
  } finally {
    loading.value = false;
  }
};

const goToActor = (id: string) => {
  router.push(`/actors/${id}`);
};

const goToTopic = (id: string) => {
  router.push(`/topics/${id}`);
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


onMounted(() => {
  loadEntity();
});
</script>