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
          <span>{{ claimsCount }} claims in {{ videosCount }} videos</span>
          <span> · </span>
          <span>{{ $t('narratives.seenIn') }} </span>
          <div class="flex gap-1">
            <PlatformBadge
              v-for="platform in platforms"
              :key="platform"
              :platform="platform as 'youtube' | 'tiktok' | 'instagram'"
            />
          </div>
          <template v-if="languageCount > 0">
            <span> · </span>
            <span>{{ languageCount }} {{ $t('narratives.languagesCount', languageCount) }}</span>
          </template>
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
import type { Narrative, NarrativeSummary } from '~/types/api';
import { calculateNarrativeStats, formatNumber } from '~/utils/narrativeStats';

interface Props {
  narrative: Narrative | NarrativeSummary;
  contentType?: 'first' | 'last' | 'active';
}

const props = withDefaults(defineProps<Props>(), {
  contentType: 'first'
});

defineEmits<{
  click: []
}>();

// Helper to check if narrative is a summary type
const isSummary = computed(() => 'claims_count' in props.narrative);

// Calculate narrative stats - use pre-calculated values for summaries
const stats = computed(() => {
  if (isSummary.value) {
    const summary = props.narrative as NarrativeSummary;
    return {
      totalViews: summary.total_views || 0,
      totalLikes: summary.total_likes || 0,
      totalComments: summary.total_comments || 0
    };
  }
  return calculateNarrativeStats(props.narrative as Narrative);
});

const totalViews = computed(() => formatNumber(stats.value.totalViews));
const totalComments = computed(() => formatNumber(stats.value.totalComments));
const totalLikes = computed(() => formatNumber(stats.value.totalLikes));

// Get claims count
const claimsCount = computed(() => {
  if (isSummary.value) {
    return (props.narrative as NarrativeSummary).claims_count || 0;
  }
  return (props.narrative as Narrative).claims?.length || 0;
});

// Get videos count
const videosCount = computed(() => {
  if (isSummary.value) {
    return (props.narrative as NarrativeSummary).videos_count || 0;
  }
  return (props.narrative as Narrative).videos?.length || 0;
});

// Get platforms
const platforms = computed(() => {
  if (isSummary.value) {
    return (props.narrative as NarrativeSummary).platforms || [];
  }
  const narrative = props.narrative as Narrative;
  return [...new Set(narrative.videos?.map(v => v.platform) || [])];
});

// Calculate unique languages from claims or use pre-calculated value
const languageCount = computed(() => {
  if (isSummary.value) {
    return (props.narrative as NarrativeSummary).languages_count || 0;
  }

  const narrative = props.narrative as Narrative;
  if (!narrative.claims || narrative.claims.length === 0) {
    return 0;
  }

  const languages = new Set(
    narrative.claims
      .map(claim => claim.metadata?.language)
      .filter(lang => lang != null && lang !== '')
  );

  return languages.size;
});
</script>