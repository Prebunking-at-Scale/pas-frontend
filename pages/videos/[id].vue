<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600">{{ $t('videos.errorLoading') }}</p>
      <Button @click="$router.push('/videos')" class="mt-4">
        {{ $t('common.back') }}
      </Button>
    </div>

    <!-- Video Content -->
    <div v-else-if="video" class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Video Player Card -->
          <Card class="m-0 p-0 rounded">
            <CardContent class="p-0 m-0 rounded">
              <!-- Video Embed -->
              <div v-if="videoEmbedUrl" class="aspect-video bg-black">
                <iframe
                  ref="videoPlayer"
                  :src="videoEmbedUrl"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="w-full h-full rounded"
                ></iframe>
              </div>
              <div v-else class="aspect-video bg-stone-200 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p class="text-gray-500">{{ $t('videos.noEmbed') }}</p>
                  <a v-if="video.source_url" :href="video.source_url" target="_blank" class="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                    {{ $t('videos.viewOriginal') }}
                  </a>
                </div>
              </div>

              <!-- Video Info -->
              <div class="p-6">
                <div class="flex items-start justify-between mb-4">
                  <h1 class="text-2xl font-bold text-gray-900">{{ video.title }}</h1>
                  <PlatformBadge :platform="video.platform as 'youtube' | 'tiktok' | 'instagram'" />
                </div>

                <p class="text-gray-600 mb-4">{{ video.description }}</p>

                <!-- Channel and Date -->
                <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span v-if="video.channel" class="font-medium">{{ video.channel }}</span>
                  <span v-if="video.published_at">{{ formatDate(video.published_at, $i18n.locale.value) }}</span>
                </div>

                <!-- Statistics -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div v-if="video.views !== undefined" class="text-center">
                    <div class="text-2xl font-bold text-gray-900">{{ formatNumber(video.views) }}</div>
                    <div class="text-sm text-gray-500">{{ $t('videos.views') }}</div>
                  </div>
                  <div v-if="video.likes !== undefined" class="text-center">
                    <div class="text-2xl font-bold text-gray-900">{{ formatNumber(video.likes) }}</div>
                    <div class="text-sm text-gray-500">{{ $t('videos.likes') }}</div>
                  </div>
                  <div v-if="video.comments !== undefined" class="text-center">
                    <div class="text-2xl font-bold text-gray-900">{{ formatNumber(video.comments) }}</div>
                    <div class="text-sm text-gray-500">{{ $t('videos.comments') }}</div>
                  </div>
                  <div v-if="video.shares !== undefined" class="text-center">
                    <div class="text-2xl font-bold text-gray-900">{{ formatNumber(video.shares) }}</div>
                    <div class="text-sm text-gray-500">{{ $t('videos.shares') }}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Related Claims -->
          <Card class="mt-4 p-0 rounded pb-4" v-if="claims.length > 0">
            <CardHeader class="p-4 bg-stone-200">
              <CardTitle>{{ $t('videos.relatedClaims') }} ({{ claims.length }})</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div v-for="claim in claims" :key="claim.id" class="border-b last:border-0 pb-4 last:pb-0">
                  <p class="text-gray-900 mb-2">{{ claim.claim || claim.text }}</p>
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    
                    <button
                      v-if="claim.start_time_s !== undefined"
                      @click="seekToTime(claim.start_time_s)"
                      class="flex items-center gap-1 text-stone-900 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md px-2 py-1 transition-colors border border-stone-200 cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ formatTimestamp(claim.start_time_s) }}
                    </button>
                    <NuxtLink 
                      :to="`/claims/${claim.id}`" 
                      class="text-indigo-600 hover:text-indigo-800"
                    >
                      <!-- {{ $t('common.viewDetails') }} -->
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Video Metadata -->
          <Card class="mt-4 p-0 rounded pb-4" v-if="claims.length > 0">
            <CardHeader class="p-4 bg-stone-200">
              <CardTitle>{{ $t('videos.metadata') }} ({{ claims.length }})</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-if="video.duration">
                <span class="text-sm text-gray-500">{{ $t('videos.duration') }}</span>
                <p class="font-medium">{{ formatDuration(video.duration) }}</p>
              </div>
              <div v-if="video.language">
                <span class="text-sm text-gray-500">{{ $t('videos.language') }}</span>
                <p class="font-medium">{{ getLanguageName(video.language) }}</p>
              </div>
              <div v-if="video.source_url">
                <span class="text-sm text-gray-500">{{ $t('videos.source') }}</span>
                <a :href="video.source_url" target="_blank" class="block text-indigo-600 hover:text-indigo-800 truncate">
                  {{ $t('videos.viewOriginal') }}
                </a>
              </div>
            </CardContent>
          </Card>

          <!-- Related Narratives -->
          <Card class="mt-4 p-0 rounded pb-4" v-if="claims.length > 0">
            <CardHeader class="p-4 bg-stone-200">
              <CardTitle>{{ $t('videos.relatedNarratives') }} ({{ narratives.length }})</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <NuxtLink
                  v-for="narrative in narratives"
                  :key="narrative.id"
                  :to="`/narratives/${narrative.id}`"
                  class="block p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <h4 class="font-medium text-gray-900 mb-1">{{ narrative.title }}</h4>
                  <p class="text-sm text-gray-600 line-clamp-2">{{ narrative.description }}</p>
                </NuxtLink>
              </div>
            </CardContent>
          </Card>

          <!-- Transcript -->
          <Card class="mt-4 p-0 rounded pb-4" v-if="transcriptSentences.length > 0">
            <CardHeader class="p-4 bg-stone-200 flex flex-row items-center justify-between">
              <CardTitle>{{ $t('videos.transcript') }} ({{ transcriptSentences.length }})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                @click="showTranscriptDialog = true"
              >
                {{ $t('videos.viewFullTranscript') }}
              </Button>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div v-for="sentence in transcriptSentences.slice(0, 3)" :key="sentence.id" class="flex items-start gap-3">
                  <button
                    @click="seekToTime(sentence.start_time_s)"
                    class="flex-shrink-0 flex items-center gap-1 text-stone-900 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md px-2 py-1 transition-colors border border-stone-200 cursor-pointer text-sm"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatTimestamp(sentence.start_time_s) }}
                  </button>
                  <p class="text-gray-700 text-sm">{{ sentence.text }}</p>
                </div>
                <p v-if="transcriptSentences.length > 3" class="text-sm text-gray-400 italic">
                  ...{{ transcriptSentences.length - 3 }} more
                </p>
              </div>
            </CardContent>
          </Card>

          <!-- Transcript Dialog -->
          <Dialog v-model:open="showTranscriptDialog">
            <DialogScrollContent class="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{{ $t('videos.transcriptTitle') }}</DialogTitle>
                <DialogDescription>{{ $t('videos.transcriptDescription') }}</DialogDescription>
              </DialogHeader>
              <div class="space-y-3 py-4">
                <div
                  v-for="sentence in transcriptSentences"
                  :key="sentence.id"
                  class="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0"
                >
                  <button
                    @click="seekToTime(sentence.start_time_s); showTranscriptDialog = false"
                    class="flex-shrink-0 flex items-center gap-1 text-stone-900 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md px-2 py-1 transition-colors border border-stone-200 cursor-pointer text-sm"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatTimestamp(sentence.start_time_s) }}
                  </button>
                  <p class="text-gray-700">{{ sentence.text }}</p>
                </div>
              </div>
            </DialogScrollContent>
          </Dialog>

          <!-- Topics -->
          <Card v-if="video.topics && video.topics.length > 0">
            <CardHeader>
              <CardTitle>{{ $t('videos.topics') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-2">
                <NuxtLink
                  v-for="topic in video.topics"
                  :key="topic.id"
                  :to="`/topics/${topic.id}`"
                  class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors"
                >
                  {{ topic.name }}
                </NuxtLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Video, Claim, Narrative, VideoDetailResponse } from '~/types/api';
import { apiService } from '~/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Dialog, DialogScrollContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';
import PlatformBadge from '~/components/PlatformBadge.vue';
import { formatDate } from '~/utils/date';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const { $i18n } = useNuxtApp();

// Refs
const videoPlayer = ref<HTMLIFrameElement | null>(null);

// State
const video = ref<Video | null>(null);
const claims = ref<Claim[]>([]);
const narratives = ref<Narrative[]>([]);
const transcriptSentences = ref<NonNullable<VideoDetailResponse['transcript']>['sentences']>([]);
const showTranscriptDialog = ref(false);
const loading = ref(true);
const error = ref(false);

// Computed
const videoEmbedUrl = computed(() => {
  if (!video.value?.source_url) return null;
  
  const url = video.value.source_url.trim();
  console.log('Computing videoEmbedUrl for:', url);
  
  // YouTube - Enhanced pattern matching for various URL formats
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?m\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\/([A-Za-z0-9_-]{11})/
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      // Extract video ID and add player parameters for better UX
      const videoId = match[1];
      const params = new URLSearchParams({
        'rel': '0', // Don't show related videos from other channels
        'modestbranding': '1', // Minimal YouTube branding
        'controls': '1', // Show player controls
        'autoplay': '0', // Don't autoplay
        'fs': '1', // Allow fullscreen
        'enablejsapi': '1', // Enable JavaScript API for player control
        'origin': window.location.origin // Security parameter
      });
      console.log('YouTube match found, videoId:', videoId);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      console.log('Generated embed URL:', embedUrl);
      return embedUrl;
    }
  }
  
  // TikTok (basic embed support)
  const tiktokMatch = url.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/);
  if (tiktokMatch) {
    return `https://www.tiktok.com/embed/v2/${tiktokMatch[2]}`;
  }
  
  // Vimeo support
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0`;
  }
  
  return null;
});

// Methods
const loadVideoData = async () => {
  try {
    loading.value = true;
    error.value = false;
    
    const videoId = route.params.id as string;
    
    // Load video details
    const videoResponse = await apiService.getVideo(videoId);
    console.log('Loaded video data:', videoResponse);
    
    // Extract video data
    video.value = videoResponse;
    

    // Extract claims from the response
    if (videoResponse.claims?.claims) {
      claims.value = videoResponse.claims.claims;
    } else {
      claims.value = [];
    }
    
    // Extract narratives from the response
    if (videoResponse.narratives) {
      narratives.value = videoResponse.narratives;
    } else {
      narratives.value = [];
    }

    // Extract transcript sentences from the response
    if (videoResponse.transcript?.sentences) {
      transcriptSentences.value = videoResponse.transcript.sentences;
    } else {
      transcriptSentences.value = [];
    }
    
  } catch (e) {
    console.error('Failed to load video:', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
};


const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatTimestamp = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getLanguageName = (code: string) => {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch'
  };
  return languages[code] || code;
};

const seekToTime = (seconds: number) => {
  if (!videoPlayer.value) return;
  
  const url = video.value?.source_url?.trim();
  if (!url) return;
  
  // YouTube videos
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Use postMessage to control YouTube player
    videoPlayer.value.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }),
      '*'
    );
  }
  // Vimeo videos
  else if (url.includes('vimeo.com')) {
    videoPlayer.value.contentWindow?.postMessage(
      JSON.stringify({
        method: 'seekTo',
        value: seconds
      }),
      '*'
    );
  }
  // TikTok doesn't support seeking via API
  else {
    console.warn('Seeking not supported for this video platform');
  }
};

// Lifecycle
onMounted(() => {
  loadVideoData();
});

</script>