<template>
  <ClientOnly>
    <div>
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
      
      <div v-else>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Topics Card -->
        <StatsCard 
          :title="$t('dashboard.topics')" 
          :count="stats.topics.length"
        >
          <div 
            v-for="topic in stats.topics.slice(0, 5)" 
            :key="topic.id"
            class="flex justify-between items-center text-sm p-2 rounded hover:bg-stone-50 -mx-2"
          >
            <span 
              @click="goToTopic(topic.id)"
              class="text-gray-600 hover:text-gray-900 cursor-pointer flex-1"
            >{{ topic.topic }}</span>
            <div class="flex gap-2">
              <button
                @click.stop="goToTopicWithType(topic.id, 'narratives')"
                class="cursor-pointer px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                :title="$t('dashboard.narrativesCount')"
              >
                {{ $t('dashboard.narratives') }}: {{ topic.narrative_count }}
              </button>
              <button
                @click.stop="goToTopicWithType(topic.id, 'claims')"
                class="cursor-pointer px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                :title="$t('dashboard.claimsCount')"
              >
                {{ $t('dashboard.claims') }}: {{ topic.claim_count }}
              </button>
            </div>
          </div>
        </StatsCard>

        <!-- Entities Card -->
        <StatsCard 
          :title="$t('dashboard.entities')" 
          :count="stats.entities.length"
        >
          <div class="space-y-3">
            <div 
              v-for="entity in stats.entities.slice(0, 5)" 
              :key="entity.id"
              @click="goToEntity(entity.id)"
              class="flex items-center justify-between p-2 rounded hover:bg-stone-50 cursor-pointer -mx-2"
            >
              <div class="flex items-center space-x-3">
                <img 
                  v-if="entity.image_url" 
                  :src="entity.image_url" 
                  :alt="entity.name"
                  class="w-8 h-8 rounded-full object-cover"
                >
                <div v-else class="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                  <span class="text-xs text-gray-500">{{ entity.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ entity.name }}</p>
                  <p v-if="entity.type" class="text-xs text-gray-500">{{ entity.type }}</p>
                </div>
              </div>
              <span class="text-sm text-gray-900 font-medium">{{ entity.count }}</span>
            </div>
          </div>
        </StatsCard>

        <!-- Actors Card -->
        <StatsCard 
          :title="$t('dashboard.actors')" 
          :count="stats.actors.length"
        >
          <div class="space-y-3">
            <div 
              v-for="actor in stats.actors.slice(0, 5)" 
              :key="actor.id"
              @click="goToActor(actor.id)"
              class="flex items-center justify-between p-2 rounded hover:bg-stone-50 cursor-pointer -mx-2"
            >
              <div class="flex items-center space-x-3">
                <img 
                  v-if="actor.image_url" 
                  :src="actor.image_url" 
                  :alt="actor.name"
                  class="w-8 h-8 rounded-full object-cover"
                >
                <div v-else class="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                  <span class="text-xs text-gray-500">{{ actor.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ actor.name }}</p>
                  <p v-if="actor.role" class="text-xs text-gray-500">{{ actor.role }}</p>
                </div>
              </div>
              <span class="text-sm text-gray-900 font-medium">{{ actor.count }}</span>
            </div>
          </div>
        </StatsCard>
      </div>

      <!-- Viral Narratives -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">{{ $t('dashboard.viralNarratives') }}</h2>
          <span class="text-sm text-gray-500">{{ $t('dashboard.last24h') }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ViralNarrativeCard 
            v-for="narrative in stats.viralNarratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>

      <!-- Prevalent Narratives -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('dashboard.prevalentNarratives') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PrevalentNarrativeCard 
            v-for="narrative in stats.prevalentNarratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>
    </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { TopicWithStats } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();
const topicsStore = useTopicsStore();

// Load dashboard stats with safe defaults
const stats = ref<{
  topics: TopicWithStats[];
  entities: any[];
  actors: any[];
  viralNarratives: any[];
  prevalentNarratives: any[];
}>({
  topics: [],
  entities: [],
  actors: [],
  viralNarratives: [],
  prevalentNarratives: []
});

const loading = ref(true);

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

const goToTopic = (id: string) => {
  router.push(`/topics/${id}`);
};

const goToTopicWithType = (id: string, type: 'narratives' | 'claims') => {
  if (type === 'narratives') {
    router.push(`/narratives?topic=${id}`);
  } else {
    router.push(`/claims?topic=${id}`);
  }
};

const goToEntity = (id: string) => {
  router.push(`/entities/${id}`);
};

const goToActor = (id: string) => {
  router.push(`/actors/${id}`);
};

onMounted(async () => {
  // Load data
  try {
    const data = await apiService.getDashboardStats();
    // Ensure all arrays exist with defaults
    stats.value = {
      topics: data.topics || [],
      entities: data.entities || [],
      actors: data.actors || [],
      viralNarratives: data.viralNarratives || [],
      prevalentNarratives: data.prevalentNarratives || []
    };
    
    // Also populate the topics store if we got topics
    if (data.topics && data.topics.length > 0) {
      topicsStore.$patch({
        topics: data.topics,
        lastFetch: new Date()
      });
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    // Keep default empty arrays on error
  } finally {
    loading.value = false;
  }
});
</script>