<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <div v-else>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Topics Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ $t('dashboard.topics') }}
              </h3>
              <span class="text-2xl font-bold text-indigo-600">{{ stats.topics.length }}</span>
            </div>
            <div class="space-y-2">
              <div 
                v-for="topic in stats.topics.slice(0, 5)" 
                :key="topic.id"
                @click="goToTopic(topic.id)"
                class="flex justify-between text-sm p-2 rounded hover:bg-gray-50 cursor-pointer -mx-2"
              >
                <span class="text-gray-600">{{ topic.name }}</span>
                <span class="text-gray-900 font-medium">{{ topic.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Entities Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ $t('dashboard.entities') }}
              </h3>
              <span class="text-2xl font-bold text-indigo-600">{{ stats.entities.length }}</span>
            </div>
            <div class="space-y-3">
              <div 
                v-for="entity in stats.entities.slice(0, 5)" 
                :key="entity.id"
                @click="goToEntity(entity.id)"
                class="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer -mx-2"
              >
                <div class="flex items-center space-x-3">
                  <img 
                    v-if="entity.image_url" 
                    :src="entity.image_url" 
                    :alt="entity.name"
                    class="w-8 h-8 rounded-full object-cover"
                  >
                  <div v-else class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
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
          </div>
        </div>

        <!-- Actors Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ $t('dashboard.actors') }}
              </h3>
              <span class="text-2xl font-bold text-indigo-600">{{ stats.actors.length }}</span>
            </div>
            <div class="space-y-3">
              <div 
                v-for="actor in stats.actors.slice(0, 5)" 
                :key="actor.id"
                @click="goToActor(actor.id)"
                class="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer -mx-2"
              >
                <div class="flex items-center space-x-3">
                  <img 
                    v-if="actor.image_url" 
                    :src="actor.image_url" 
                    :alt="actor.name"
                    class="w-8 h-8 rounded-full object-cover"
                  >
                  <div v-else class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
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
          </div>
        </div>
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
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();

const router = useRouter();

// Load dashboard stats
const stats = ref({
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

const goToEntity = (id: string) => {
  router.push(`/entities/${id}`);
};

const goToActor = (id: string) => {
  router.push(`/actors/${id}`);
};

onMounted(async () => {
  // Load data
  try {
    stats.value = await apiService.getDashboardStats();
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  } finally {
    loading.value = false;
  }
});
</script>