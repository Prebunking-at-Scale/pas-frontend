<template>
  <div>
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
        <h3 class="text-red-800 font-medium mb-2">{{ $t('common.error') }}</h3>
        <p class="text-red-600">{{ error }}</p>
      </div>
    </div>
    <div v-else-if="narrative">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-gray-900">{{ narrative.title }}</h1>
            <p v-if="narrative.description != narrative.title" class="mt-2 text-gray-600">{{ narrative.description }}</p>
          </div>
          <!-- Actions -->
          <div class="flex flex-col gap-2 flex-none">
            <Button @click="openAlertDialog" variant="outline">
              <Bell class="mr-2 h-4 w-4" />
              {{ $t('alerts.create_alert') }}
            </Button>
            <Button @click="openUpdateTitleDialog" variant="outline">
              <Captions class="mr-2 h-4 w-4" />
              {{ $t('narratives.editTitle') }}
            </Button>
          </div>
        </div>
        
        <!-- Topics -->
        <div v-if="narrative.topics && narrative.topics.length > 0" class="mt-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-gray-700">{{ $t('narratives.topics') }}:</span>
            <span 
              v-for="topic in narrative.topics" 
              :key="topic.id"
              class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm cursor-pointer hover:bg-emerald-200"
              @click="goToTopic(topic.id)"
            >
              {{ topic.topic }}
            </span>
          </div>
        </div>
      </div>

      <!-- Total stats calculated from videos -->
      <div class="bg-white shadow rounded-lg mb-6 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Stats</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Views -->
          <div class="flex items-center justify-center">
            <div class="flex flex-col items-center">
              <div class="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats.totalViews.toLocaleString() }}</div>
              <div class="text-sm text-gray-500">{{ $t('common.views') }}</div>
            </div>
          </div>

          <!-- Total Likes -->
          <div class="flex items-center justify-center">
            <div class="flex flex-col items-center">
              <div class="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats.totalLikes.toLocaleString() }}</div>
              <div class="text-sm text-gray-500">{{ $t('common.likes') }}</div>
            </div>
          </div>

          <!-- Total Comments -->
          <div class="flex items-center justify-center">
            <div class="flex flex-col items-center">
              <div class="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats.totalComments.toLocaleString() }}</div>
              <div class="text-sm text-gray-500">{{ $t('common.comments') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline: Show all related video dates as a timeline, 100% width -->
      <div class="bg-white shadow rounded-lg mb-6 p-6 flex flex-col justify-center text-sm text-gray-500 w-full" v-if="narrative.videos && narrative.videos.length > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Timeline of the narrative</h3>
        <div class="flex items-center w-full">
          <template v-for="(video, idx) in sortedVideos" :key="video.id || video.uploaded_at || idx">
            <!-- Timeline point -->
            <div class="flex flex-col items-center flex-shrink-0 min-w-[70px]">
              <div class="w-4 h-4 rounded-full bg-emerald-700 border-2 border-emerald-900"></div>
              <span class="mt-2 font-medium text-gray-700">
                <template v-if="idx === 0">
                  {{ $t('timeline.firstSeen') || 'First seen' }}
                </template>
                <template v-else-if="idx === sortedVideos.length - 1">
                  {{ $t('timeline.lastSeen') || 'Last seen' }}
                </template>
                <template v-else>
                  {{ $t('timeline.seen') || 'Seen' }}
                </template>
              </span>
              <span class="text-xs mt-1" v-if="video.uploaded_at">
                {{ formatDate(video.uploaded_at, $i18n.locale.value) }}
              </span>
            </div>
            <!-- Line between points, except after last -->
            <div
              v-if="idx < sortedVideos.length - 1"
              class="flex-1 h-0.5 bg-stone-400 mx-2"
            ></div>
          </template>
        </div>
      </div>

      
      <!-- Timeline Tabs -->
      <div class="bg-white shadow rounded-lg mb-6" v-if="false">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex">
            <button
              v-for="tab in timeTabs"
              :key="tab.value"
              @click="selectedTimeTab = tab.value"
              :class="[
                'py-2 px-6 text-sm font-medium border-b-2',
                selectedTimeTab === tab.value
                  ? 'border-green-900 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Content Tabs -->
        <div class="p-4" v-if="false">
          <div class="flex space-x-4 mb-4">
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="first" class="mr-2">
              {{ $t('narratives.first') }}
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="last" class="mr-2">
              {{ $t('narratives.last') }}
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="contentType" value="active" class="mr-2">
              {{ $t('narratives.active') }}
            </label>
          </div>

          <!-- Statistics Grid -->
          <div v-if="false" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div v-if="narrative.views_count" class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(narrative.views_count) }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.views') }}</div>
            </div>
            <div v-if="narrative.comments_count" class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(narrative.comments_count) }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.comments') }}</div>
            </div>
            <div v-if="narrative.related_content_count !== undefined" class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ narrative.related_content_count }}</div>
              <div class="text-sm text-gray-500">{{ $t('narratives.relatedContent') }}</div>
            </div>
            <div v-if="narrative.platform_breakdown" class="text-center">
              <div class="flex justify-center space-x-2">
                <span v-if="narrative.platform_breakdown.instagram > 0" class="text-pink-600">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  </svg>
                </span>
                <span v-if="narrative.platform_breakdown.tiktok > 0" class="text-gray-900">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </span>
                <span v-if="narrative.platform_breakdown.youtube > 0" class="text-red-600">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <!-- Content Recurrences Chart -->
          <div class="mb-6" v-if="false">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ $t('narratives.timelineContentRecurrences') }}
            </h3>
            <div class="bg-stone-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <span class="text-gray-500">{{ $t('common.chartPlaceholder') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actors and Entities -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" v-if="false">
        <!-- Actors -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            {{ $t('narratives.actors') }}
            <span class="text-2xl font-bold text-emerald-600">{{ narrative.actors.length }}</span>
          </h3>
          <div class="space-y-3">
            <div v-for="actor in narrative.actors" :key="actor.id" class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <img 
                  v-if="actor.image_url" 
                  :src="actor.image_url" 
                  :alt="actor.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <span class="text-sm text-gray-500">{{ actor.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ actor.name }}</p>
                  <p v-if="actor.role || actor.affiliation" class="text-xs text-gray-500">
                    {{ actor.role }}{{ actor.role && actor.affiliation ? ' • ' : '' }}{{ actor.affiliation }}
                  </p>
                </div>
              </div>
              <span class="text-sm text-gray-500">{{ actor.frequency }} {{ $t('common.mentions') }}</span>
            </div>
          </div>
        </div>

        <!-- Entities -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
            {{ $t('narratives.entities') }}
            <span class="text-2xl font-bold text-emerald-600">{{ narrative.entities.length }}</span>
          </h3>
          <div class="space-y-3">
            <div v-for="entity in narrative.entities" :key="entity.id" class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <img 
                  v-if="entity.image_url" 
                  :src="entity.image_url" 
                  :alt="entity.name"
                  class="w-10 h-10 rounded-full object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <span class="text-sm text-gray-500">{{ entity.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ entity.name }}</p>
                  <p v-if="entity.type" class="text-xs text-gray-500 capitalize">{{ entity.type }}</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">{{ entity.frequency }} {{ $t('common.mentions') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolution of the narrative -->
      <div class="bg-white shadow rounded-lg p-6 mb-6" v-if="false">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.evolutionOfNarrative') }}</h3>
        <div class="bg-stone-100 rounded-lg p-4 h-64 flex items-center justify-center">
          <span class="text-gray-500">{{ $t('common.chartPlaceholder') }}</span>
        </div>
      </div>

      <!-- Claims supporting this narrative -->
      <div class="mb-6 bg-stone-100 rounded-lg p-6" v-if="narrative.claims && narrative.claims.length > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ narrative.claims.length }} <span class="lowercase">{{ $t('narratives.claimsSupportingNarrative') }}</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <ClaimCard 
            v-for="claim in narrative.claims" 
            :key="claim.id" 
            :claim="claim"
            :show-unlink-action="true"
            :dialog-open-action="openUnlinkDialog"
          />
        </div>
      </div>

      <!-- Seen in Videos -->
      <div class="bg-stone-100 rounded-lg p-6" v-if="narrative.videos && narrative.videos.length > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.seenIn') }} {{ narrative.videos.length }} <span class="lowercase">{{ $t('videos.title') }}</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCard 
            v-for="video in narrative.videos" 
            :key="video.id" 
            :video="video"
            @click="goToVideo"
          />
        </div>
      </div>
    </div>

    <!-- Alert Dialog -->
    <AlertFormDialog
      v-if="narrative"
      v-model:open="showAlertDialog"
      :mode="'create'"
      :narrative-id="narrative.id"
      @save="handleAlertSave"
    />
    <!-- Update Title Dialog -->
    <NarrativeTitleDialog 
      :open="editDialogOpen" 
      :narrative="narrative"
      @update:open="editDialogOpen = $event"
      @save="handleUpdate"
    />

    <!-- Confirmation Dialog -->
    <ConfirmUnlinkDialog />
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import { type Claim, type Narrative } from '~/types/api';
import type { Alert } from '~/types/alert';
import VideoCard from '~/components/VideoCard.vue';
import ClaimCard from '~/components/ClaimCard.vue';
import AlertFormDialog from '~/components/AlertFormDialog.vue';
import ConfirmUnlinkDialog from '~/components/ConfirmUnlinkDialog.vue';
import { Bell, Captions } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { calculateNarrativeStats, formatNumber as formatNum } from '~/utils/narrativeStats';
import { formatDate } from '~/utils/date';
import { useNarrativeDialogsStore } from '~/stores/narrativeDialogs';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const dialogsStore = useNarrativeDialogsStore();

// State
const narrative = ref<Narrative | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedTimeTab = ref('1w');
const contentType = ref('first');
const showAlertDialog = ref(false);
const editDialogOpen = ref(false);

// Calculate narrative stats using the helper function
const stats = computed(() => {
  if (!narrative.value) return { totalViews: 0, totalLikes: 0, totalComments: 0 };
  return calculateNarrativeStats(narrative.value);
});

const timeTabs = [
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '1y', label: '1 year' }
];

// Computed properties
const sortedVideos = computed(() => {
  if (!narrative.value?.videos) return [];
  return [...narrative.value.videos].sort((a, b) => {
    const dateA = new Date(a.uploaded_at || a.created_at || '').getTime();
    const dateB = new Date(b.uploaded_at || b.created_at || '').getTime();
    return dateA - dateB;
  });
});

// Load narrative data
onMounted(async () => {
  try {
    const narrativeId = route.params.id as string;
    narrative.value = await apiService.getNarrative(narrativeId);
  } catch (err) {
    console.error('Failed to load narrative:', err);
    error.value = t('narratives.loadError');
  } finally {
    loading.value = false;
  }
});

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};


const goToTopic = (topicId: string) => {
  router.push(`/topics/${topicId}`);
};

const goToVideo = (videoId: string) => {
  router.push(`/videos/${videoId}`);
};

const openAlertDialog = () => {
  showAlertDialog.value = true;
};

const openUpdateTitleDialog = () => {
  editDialogOpen.value = true;
};

const openUnlinkDialog = (claim: Claim) => {
  dialogsStore.openUnlinkDialog(claim, async () => {
    await unlinkClaimFromNarrative(claim);
  });
};

const handleAlertSave = (alert: Alert) => {
  toast.add({
    title: t('common.success'),
    description: t('alerts.create_success')
  });
  showAlertDialog.value = false;
};

const handleUpdate = (updatedNarrative: Narrative) => {
  toast.add({
    title: t('common.success'),
    description: t('narratives.updateSuccess')
  });

  narrative.value = updatedNarrative;
  editDialogOpen.value = false;
};

const unlinkClaimFromNarrative = async (claim: Claim) => {
  if (!narrative.value) return;

  try {
    const body = {
      claim_ids: narrative.value.claims?.filter(c => c.id !== claim.id).map(c => c.id) || []
    };
    const updatedNarrative = await apiService.updateNarrative(narrative.value.id, body);
    narrative.value = updatedNarrative;

    toast.add({
      title: t('common.success'),
      description: t('narratives.claimUnlinked'),
      type: 'foreground'
    });
  } catch (err) {
    console.error('Failed to unlink claim:', err);
    toast.add({
      title: t('common.error'),
      description: t('narratives.claimUnlinkError'),
    });
    throw err; // Re-throw to let the store handle it
  }
};
</script>
