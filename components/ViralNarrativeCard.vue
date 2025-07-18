<template>
  <div 
    @click="$emit('click')"
    class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4"
  >
    <div class="aspect-video bg-stone-200 rounded mb-3 relative">
      <div class="absolute top-2 right-2 flex space-x-1">
        <span v-if="narrative.platform_breakdown.youtube > 0" class="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">YT</span>
        <span v-if="narrative.platform_breakdown.tiktok > 0" class="bg-stone-900 text-white text-xs px-1.5 py-0.5 rounded">TT</span>
        <span v-if="narrative.platform_breakdown.instagram > 0" class="bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded">IG</span>
      </div>
    </div>
    <h3 class="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{{ narrative.title }}</h3>
    <p class="text-xs text-gray-600 line-clamp-2 mb-3">{{ narrative.description }}</p>
    <div class="flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center space-x-3">
        <span class="flex items-center">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{ formatNumber(stats.totalViews) }}
        </span>
        <span class="flex items-center">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {{ formatNumber(stats.totalComments) }}
        </span>
      </div>
      <div v-if="timeAgo" class="text-xs text-gray-400">
        {{ timeAgo }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Narrative } from '~/types/api';
import { calculateNarrativeStats, formatNumber } from '~/utils/narrativeStats';

interface Props {
  narrative: Narrative;
}

const props = defineProps<Props>();

defineEmits<{
  click: []
}>();

const { $i18n } = useNuxtApp();

// Calculate narrative stats using the helper function
const stats = computed(() => calculateNarrativeStats(props.narrative));

// Calculate time ago from the most recent video updated_at
const timeAgo = computed(() => {
  if (!props.narrative.videos || props.narrative.videos.length === 0) {
    return null;
  }
  
  // Find the most recent updated_at from all videos
  const mostRecentDate = props.narrative.videos.reduce((latest, video) => {
    if (!video.updated_at) return latest;
    const videoDate = new Date(video.updated_at);
    return !latest || videoDate > latest ? videoDate : latest;
  }, null as Date | null);
  
  if (!mostRecentDate) return null;
  
  // Calculate time difference
  const now = new Date();
  const diffMs = now.getTime() - mostRecentDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return $i18n.t('common.minutesAgo', { count: diffMins });
  } else if (diffHours < 24) {
    return $i18n.t('common.hoursAgo', { count: diffHours });
  } else {
    return $i18n.t('common.daysAgo', { count: diffDays });
  }
});
</script>