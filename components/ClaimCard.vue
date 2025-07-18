<template>
<Card class="hover:shadow-lg transition-shadow p-0 m-0">
  <CardContent class="p-4 flex justify-between flex-col gap-8 h-full">
      <!-- Claim Text -->
      <div class="mb-4">
        <p class="text-gray-900 text-xl leading-tight">
          "{{ claim.claim || claim.text }}"
        </p>
        <p 
          v-if="claim.video"
          @click="goToVideo(claim.video_id || claim.source_video_id)"
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
</script>