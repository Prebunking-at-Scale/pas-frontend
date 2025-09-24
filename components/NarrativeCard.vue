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

      <div class="flex items-center justify-between flex-wrap gap-2">
          
        <!-- Stats -->
        <div class="flex items-center space-x-3 text-xs text-gray-500 grow flex-1">
          <span class="flex items-center">
            👁️ {{ totalViews }}
          </span>
          <span class="flex items-center">
            ❤️ {{ totalLikes }}
          </span>
          <span class="flex items-center">
            💬 {{ totalComments }}
          </span>
        </div>

        <!-- Topics -->
        <div v-if="narrative.topics && narrative.topics.length > 0" class="flex items-center gap-2 justify-between">
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="topic in narrative.topics" 
              :key="topic.id"
              :to="`/topics/${topic.id}`"
              class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition-colors cursor-pointer"
              @click.stop>
              {{ topic.topic }}
            </NuxtLink>
          </div>
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

// Calculate narrative stats using the helper function
const stats = computed(() => calculateNarrativeStats(props.narrative));

const totalViews = computed(() => formatNumber(stats.value.totalViews));
const totalComments = computed(() => formatNumber(stats.value.totalComments));
const totalLikes = computed(() => formatNumber(stats.value.totalLikes));
</script>