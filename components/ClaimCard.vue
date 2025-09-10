<template>
<Card 
  class="hover:shadow-lg transition-shadow p-0 m-0 cursor-pointer"
  @click="handleCardClick"
>
  <CardContent class="p-4 flex justify-between flex-col gap-8 h-full">
      <!-- Claim Text -->
      <div class="mb-4">
        <p class="text-gray-900 text-xl leading-tight">
          "{{ claim.claim || claim.text }}"
        </p>
        <p 
          v-if="claim.video"
          @click.stop="goToVideo(claim.video_id || claim.source_video_id)"
          class="text-gray-600 text-xs mt-2 ml-4 cursor-pointer hover:underline hover:text-gray-900 flex items-center gap-2"
        >
          <span>↳ {{ claim.video.title }}</span>
        </p>
      </div>
      
      <div class="flex items-center gap-2 justify-between flex-wrap">
        <PlatformBadge v-if="claim.video" :platform="claim.video.platform" />

        <!-- Metadata -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <!-- Topics -->
          <div v-if="claim.topics && claim.topics.length > 0" class="flex items-center gap-2">
            <div class="flex flex-wrap gap-1">
              <NuxtLink
                v-for="topic in claim.topics" 
                :key="topic.id"
                :to="`/topics/${topic.id}`"
                class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition-colors cursor-pointer">
                {{ topic.topic }}
              </NuxtLink>
            </div>
          </div>

          <!-- Score -->
          <div v-if="claim.metadata?.score !== undefined">
            <span 
              :class="getScoreClass(claim.metadata.score)"
              class="px-2 py-1 rounded-full text-xs"
            >
              {{ claim.metadata.score.toFixed(1) }}
            </span>
          </div>

          <!-- Date -->
          <div v-if="claim.created_at" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs">{{ formatDate(claim.created_at, $i18n.locale.value) }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Claim } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import PlatformBadge from '~/components/PlatformBadge.vue';
import { formatDate } from '~/utils/date';

interface Props {
  claim: Claim;
}

const props = defineProps<Props>();

const router = useRouter();
const { $i18n } = useNuxtApp();

const handleCardClick = () => {
  const videoId = props.claim.video_id || props.claim.source_video_id;
  if (videoId) {
    router.push(`/videos/${videoId}`);
  }
};

const goToVideo = (videoId: string) => {
  router.push(`/videos/${videoId}`);
};

const goToTopic = (topicId: string) => {
  router.push(`/topics/${topicId}`);
};

const formatTimestamp = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getScoreClass = (score: number) => {
  // Score ranges:
  // 0-1: light gray
  // 1-2: gray
  // 2-2.5: light yellow
  // 2.5-3: yellow
  // 3-3.5: light orange
  // 3.5-4: orange
  // 4-4.5: light red
  // 4.5-5: red
  
  if (score < 1) {
    return 'bg-gray-100 text-gray-700';
  } else if (score < 2) {
    return 'bg-gray-200 text-gray-800';
  } else if (score < 2.5) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (score < 3) {
    return 'bg-yellow-200 text-yellow-900';
  } else if (score < 3.5) {
    return 'bg-orange-100 text-orange-800';
  } else if (score < 4) {
    return 'bg-orange-200 text-orange-900';
  } else if (score < 4.5) {
    return 'bg-red-100 text-red-800';
  } else {
    return 'bg-red-200 text-red-900';
  }
};
</script>