<template>

<Card 
  class="hover:shadow-lg transition-shadow p-0 m-0 cursor-pointer"
  @click="$emit('click')"
>
    <CardContent class="p-4 flex justify-between flex-col gap-8 h-full">
      <!-- Claim Text -->
      <div class="mb-4">
        <p class="text-gray-900 text-xl font-semibold leading-tight">
          {{ narrative.title.endsWith('.') ? narrative.title.slice(0, -1) : narrative.title }}
        </p>
        <div 
          class="text-gray-600 text-xs mt-2 flex items-center gap-2"
        >
          <span>{{ narrative.claims?.length || 0 }} claims in {{ narrative.videos?.length  || 0 }} videos</span>
          <span> · </span>
          <span>Seen in </span>
          <div class="flex gap-1">
            <PlatformBadge 
              v-for="platform in [...new Set(narrative.videos?.map(v => v.platform) || [])]"
              :key="platform"
              :platform="platform as 'youtube' | 'tiktok' | 'instagram'"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center space-x-3">
          <span class="flex items-center">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ totalViews }}
          </span>
          <span class="flex items-center">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {{ totalComments }}
          </span>
          <span class="flex items-center">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 9l-2 2m0 0l-2-2m2 2V7m6 5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ totalLikes }}
          </span>
        </div>
      </div>
      
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Narrative } from '~/types/api';
import { calculateNarrativeStats, formatNumber } from '~/utils/narrativeStats';

interface Props {
  narrative: Narrative;
  contentType?: 'first' | 'last' | 'active';
}

const props = withDefaults(defineProps<Props>(), {
  contentType: 'first'
});

defineEmits<{
  click: []
}>();

const { $i18n } = useNuxtApp();

// Calculate narrative stats using the helper function
const stats = computed(() => calculateNarrativeStats(props.narrative));

const totalViews = computed(() => formatNumber(stats.value.totalViews));
const totalComments = computed(() => formatNumber(stats.value.totalComments));
const totalLikes = computed(() => formatNumber(stats.value.totalLikes));
</script>