<template>
  <Card class="hover:shadow-lg transition-shadow">
    <CardContent class="p-6">
      <!-- Claim Text -->
      <div class="mb-4">
        <p class="text-gray-900 text-xl leading-tight">
          "{{ claim.claim || claim.text }}"
        </p>
        <p 
          @click="goToVideo(claim.video_id || claim.source_video_id)"
          class="text-gray-600 text-xs mt-2 ml-4 cursor-pointer hover:underline hover:text-gray-900"
        >↳ {{ claim.video.title }}</p>
      </div>
      
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

        <!-- Timestamp -->
        <div v-if="claim.start_time_s !== undefined" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formatTimestamp(claim.start_time_s) }}</span>
        </div>

        <!-- Date -->
        <div v-if="claim.created_at" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(claim.created_at) }}</span>
        </div>
      </div>

    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Claim } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString($i18n.locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>