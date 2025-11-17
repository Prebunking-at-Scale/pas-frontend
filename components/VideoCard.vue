<template>
  <div @click="$emit('click', video.id)" class="cursor-pointer bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden hover:bg-stone-100 flex flex-col h-full">
      <!-- YouTube Embed -->
      <div v-if="youtubeVideoId" class="aspect-video bg-stone-200 rounded overflow-hidden flex-shrink-0">
        <iframe
          :src="`https://www.youtube.com/embed/${youtubeVideoId}`"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="w-full h-full"
        ></iframe>
      </div>
      <div v-else class="aspect-video bg-stone-200 rounded mb-3 flex items-center justify-center flex-shrink-0">
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      <div class="p-4 flex flex-col flex-grow">
        <!-- Channel Info -->
        <div v-if="video.channel" class="text-sm text-gray-600 mb-2 flex items-center gap-2">
          <PlatformBadge :platform="video.platform" /> {{ video.channel }}
        </div>

        <!-- Title and Description -->
        <div class="flex-grow">
          <h3 class="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight mb-1">{{ video.title }}</h3>
          <p v-if="video.description" class="text-sm text-gray-500 line-clamp-2 leading-tight">{{ video.description }}</p>
        </div>

        <!-- Bottom Section: Platform, Stats, and Metadata -->
        <div class="flex items-center justify-between gap-2 flex-wrap" :class="video.description ? 'mt-6' : 'mt-3'">
        
          <!-- Left side: Stats, Language, and Date -->
          <div class="flex items-center gap-3 text-sm text-gray-600 text-xs">
            <!-- Stats with emojis -->
            <span class="flex items-center gap-1">
              👁️
              {{ formatNumber(video.views || 0) }}
            </span>
            <span class="flex items-center gap-1">
              ❤️
              {{ formatNumber(video.likes || 0) }}
            </span>
            <span class="flex items-center gap-1">
              💬
              {{ formatNumber(video.comments || 0) }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-600">
            <!-- Language Badge -->
            <div v-if="video.metadata?.language" class="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              <span>{{ getLanguageName(video.metadata?.language) }}</span>
            </div>

            <!-- Date -->
            <div v-if="video.uploaded_at" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-xs">{{ formatDate(video.uploaded_at, $i18n.locale.value) }}</span>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import type { Video } from '~/types/api';
import PlatformBadge from '~/components/PlatformBadge.vue';
import { formatDate } from '~/utils/date';
import { getLanguageName } from '~/utils/languageMapping';

interface Props {
  video: Video;
}

const props = defineProps<Props>();

defineEmits<{
  click: [videoId: string]
}>();

const { $i18n } = useNuxtApp();

// Extract YouTube video ID from source_url
const youtubeVideoId = computed(() => {
  if (!props.video.source_url) return null;

  // Handle various YouTube URL formats
  const url = props.video.source_url;

  // Regular YouTube URLs
  const standardMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/);
  if (standardMatch) return standardMatch[1];

  // YouTube Shorts
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^&\n?#]+)/);
  if (shortsMatch) return shortsMatch[1];

  // Youtu.be URLs
  const shortUrlMatch = url.match(/youtu\.be\/([^&\n?#]+)/);
  if (shortUrlMatch) return shortUrlMatch[1];

  return null;
});

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
</script>