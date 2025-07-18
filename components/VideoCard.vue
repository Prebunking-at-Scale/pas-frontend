<template>
  <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
    <div class="p-4">
      <h3 class="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">{{ video.title }}</h3>
      <p class="text-sm text-gray-600 line-clamp-2 mb-3">{{ video.description }}</p>
      
      <!-- YouTube Embed -->
      <div v-if="youtubeVideoId" class="aspect-video bg-stone-200 rounded mb-3 overflow-hidden">
        <iframe
          :src="`https://www.youtube.com/embed/${youtubeVideoId}`"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="w-full h-full"
        ></iframe>
      </div>
      <div v-else class="aspect-video bg-stone-200 rounded mb-3 flex items-center justify-center">
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Platform and Channel Info -->
      <div class="flex items-center gap-2 mb-3 text-sm">
        <span 
          class="px-2 py-1 rounded text-xs font-medium"
          :class="getPlatformClass(video.platform)"
        >
          {{ getPlatformLabel(video.platform) }}
        </span>
        <span v-if="video.channel" class="text-gray-500">
          {{ video.channel }}
        </span>
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div class="flex items-center gap-3">
          <span v-if="video.views" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ formatNumber(video.views) }}
          </span>
          <span v-if="video.likes" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {{ formatNumber(video.likes) }} {{ $t('common.likes') }}
          </span>
          <span v-if="video.comments" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {{ formatNumber(video.comments) }}
          </span>
        </div>
      </div>

      <!-- View Details Button -->
      <button
        @click="$emit('click', video.id)"
        class="w-full text-center py-2 px-4 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
      >
        {{ $t('videos.viewDetails') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Video } from '~/types/api';

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

const getPlatformClass = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return 'bg-black text-white';
    case 'youtube':
      return 'bg-red-600 text-white';
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    default:
      return 'bg-stone-500 text-white';
  }
};

const getPlatformLabel = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return $i18n.t('videos.tiktok');
    case 'youtube':
      return $i18n.t('videos.youtube');
    case 'instagram':
      return $i18n.t('videos.instagram');
    default:
      return platform;
  }
};

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