<template>
  <div>
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
    <div v-else-if="narrative">
      <!-- Header -->
      <div class="mb-6">
        <button
          @click="$router.back()"
          class="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← {{ $t('common.back') }}
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ narrative.title }}</h1>
        <p class="mt-2 text-gray-600">{{ narrative.description }}</p>
      </div>

      <!-- Timeline Tabs -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex">
            <button
              v-for="tab in timeTabs"
              :key="tab.value"
              @click="selectedTimeTab = tab.value"
              :class="[
                'py-2 px-6 text-sm font-medium border-b-2',
                selectedTimeTab === tab.value
                  ? 'border-green-900 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Content Tabs -->
        <div class="p-4">
          <div class="flex space-x-4 mb-4">
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="first" class="mr-2">
              {{ $t('narratives.first') }}
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="last" class="mr-2">
              {{ $t('narratives.last') }}
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="active" class="mr-2">
              {{ $t('narratives.active') }}
            </label>
          </div>

          <!-- Statistics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(narrative.views_count) }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.views') }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(narrative.comments_count) }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.comments') }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ narrative.related_content_count }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.relatedContent') }}</div>
            </div>
            <div class="text-center">
              <div class="flex justify-center space-x-2">
                <span v-if="narrative.platform_breakdown.instagram > 0" class="text-pink-600">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  </svg>
                </span>
                <span v-if="narrative.platform_breakdown.tiktok > 0" class="text-gray-900">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </span>
                <span v-if="narrative.platform_breakdown.youtube > 0" class="text-red-600">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <!-- Content Recurrences Chart -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ $t('narratives.timelineContentRecurrences') }}
            </h3>
            <div class="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <span class="text-gray-500">{{ $t('common.chartPlaceholder') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actors and Entities -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Actors -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            {{ $t('narratives.actors') }}
            <span class="text-2xl font-bold text-indigo-600">{{ narrative.actors.length }}</span>
          </h3>
          <div class="space-y-3">
            <div v-for="actor in narrative.actors" :key="actor.id" class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <img 
                  v-if="actor.image_url" 
                  :src="actor.image_url" 
                  :alt="actor.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-sm text-gray-500">{{ actor.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ actor.name }}</p>
                  <p v-if="actor.role || actor.affiliation" class="text-xs text-gray-500">
                    {{ actor.role }}{{ actor.role && actor.affiliation ? ' • ' : '' }}{{ actor.affiliation }}
                  </p>
                </div>
              </div>
              <span class="text-sm text-gray-500">{{ actor.frequency }} {{ $t('common.mentions') }}</span>
            </div>
          </div>
        </div>

        <!-- Entities -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            {{ $t('narratives.entities') }}
            <span class="text-2xl font-bold text-indigo-600">{{ narrative.entities.length }}</span>
          </h3>
          <div class="space-y-3">
            <div v-for="entity in narrative.entities" :key="entity.id" class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <img 
                  v-if="entity.image_url" 
                  :src="entity.image_url" 
                  :alt="entity.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-sm text-gray-500">{{ entity.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ entity.name }}</p>
                  <p v-if="entity.type" class="text-xs text-gray-500 capitalize">{{ entity.type }}</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">{{ entity.frequency }} {{ $t('common.mentions') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolution of the narrative -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.evolutionOfNarrative') }}</h3>
        <div class="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
          <span class="text-gray-500">{{ $t('common.chartPlaceholder') }}</span>
        </div>
      </div>

      <!-- Associated Content -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.associatedContent') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="bg-white shadow rounded-lg overflow-hidden">
            <div class="bg-gray-200 h-48"></div>
            <div class="p-4">
              <h4 class="font-medium text-gray-900 mb-2">{{ $t('narratives.associatedContent') }} {{ i }}</h4>
              <p class="text-sm text-gray-600 mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <div class="flex justify-between text-xs text-gray-500">
                <span>1.2M {{ $t('common.views') }}</span>
                <span>12K {{ $t('common.comments') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Narrative } from '~/types/api';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const route = useRoute();
const router = useRouter();


// State
const narrative = ref<Narrative | null>(null);
const loading = ref(true);
const selectedTimeTab = ref('1w');
const contentType = ref('first');

const timeTabs = [
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '1y', label: '1 year' }
];

// Load narrative data
onMounted(async () => {
  try {
    const narrativeId = route.params.id as string;
    narrative.value = await apiService.getNarrative(narrativeId);
  } catch (error) {
    console.error('Failed to load narrative:', error);
    router.push('/narratives');
  } finally {
    loading.value = false;
  }
});

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
</script>
