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
          <div class="flex gap-2 flex-none">
            <Button @click="openAlertDialog" variant="outline">
              <Bell class="mr-2 h-4 w-4" />
              {{ $t('alerts.create_alert') }}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline">
                  {{ $t('narratives.adminActions') }}
                  <ChevronDown class="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openUpdateTitleDialog">
                  <Captions class="mr-2 h-4 w-4" />
                  {{ $t('narratives.editTitle') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="openMergeDialog">
                  <Combine class="mr-2 h-4 w-4" />
                  {{ $t('narratives.merge.mergeAndDelete') }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-red-600" @click="openDeleteDialog">
                  <Trash class="mr-2 h-4 w-4" />
                  {{ $t('narratives.delete') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        <!-- Languages -->
        <div v-if="languages.length > 0" class="mt-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-gray-700">{{ $t('narratives.languages') }}:</span>
            <span
              v-for="language in languages"
              :key="language"
              class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {{ language }}
            </span>
          </div>
        </div>
      </div>

      <!-- Total stats calculated from videos -->
      <div class="flex flex-col gap-6 bg-white shadow rounded-lg mb-6 p-6">
        <!--Feedback Section -->
        <div class="flex gap-2 place-self-end w-fit items-center">
          <h6 class="text-sm text-gray-500 text-center">{{ $t('narratives.feedback.narrativeGenerationQuestion') }}</h6>
          <FiveStarsFeedback :rating="feedbackRating" :can-update="!!!narrativeFeedbackScore" @rate="handleVote" />
        </div>
        <!-- Total stats calculated from videos -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Stats</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Total Views -->
            <div class="flex items-center justify-center">
              <div class="flex flex-col items-center">
                <div class="text-gray-400 mb-2">
                  👁️
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.totalViews.toLocaleString() }}</div>
                <div class="text-sm text-gray-500">{{ $t('common.views') }}</div>
              </div>
            </div>

            <!-- Total Likes -->
            <div class="flex items-center justify-center">
              <div class="flex flex-col items-center">
                <div class="text-gray-400 mb-2">
                  ❤️
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.totalLikes.toLocaleString() }}</div>
                <div class="text-sm text-gray-500">{{ $t('common.likes') }}</div>
              </div>
            </div>

            <!-- Total Comments -->
            <div class="flex items-center justify-center">
              <div class="flex flex-col items-center">
                <div class="text-gray-400 mb-2">
                  💬
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.totalComments.toLocaleString() }}</div>
                <div class="text-sm text-gray-500">{{ $t('common.comments') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Evolution of the narrative: Chart showing cumulative views, likes, comments -->
        <div class="bg-white shadow rounded-lg mb-6 p-6" v-if="narrativeStats?.time_series?.length">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.evolutionOfNarrative') }}</h3>
          <div class="h-96">
            <NarrativeEvolutionChart
              :time-series="narrativeStats.time_series"
              :locale="$i18n.locale.value"
            />
          </div>
        </div>
      </div>

      <!-- Evolution Description -->
      <div class="bg-white shadow rounded-lg p-6 mb-6" v-if="narrative.narrative_context">
        <button
          class="flex items-center justify-between w-full text-left"
          @click="contextExpanded = !contextExpanded"
        >
          <h3 class="text-lg font-medium text-gray-900">
            {{ $t('narratives.narrativeContext') }}
          </h3>
          <ChevronDown
            class="h-5 w-5 text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': contextExpanded }"
          />
        </button>
        <div v-show="contextExpanded" class="mt-4">
          <div class="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-line">
            {{ narrative.narrative_context }}
          </div>
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

      <!-- Entities -->
      <div class="bg-white shadow rounded-lg p-6 mb-6" v-if="narrative.entities && narrative.entities.length > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
          {{ $t('narratives.entities') }}
          <span class="text-2xl font-bold text-emerald-600">{{ narrative.entities.length }}</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <EntityCard
            v-for="entity in narrative.entities"
            :key="entity.id"
            :entity="entity"
            :show-frequency="false"
            :show-chevron="true"
            @click="goToEntity(entity.id)"
          />
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
      <div class="mb-6 bg-stone-100 rounded-lg p-6" v-if="narrative.claim_count > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ narrative.claim_count }} <span class="lowercase">{{ $t('narratives.claimsSupportingNarrative') }}</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <ClaimCard
            :show-feedback-action="true"
            @open-feedback-dialog="onFeedbackClick"
            v-for="claim in allClaims"
            :key="claim.id"
            :claim="claim"
            :show-unlink-action="true"
            :dialog-open-action="openUnlinkDialog"
          />
        </div>

        <!-- Load more claims button -->
        <div v-if="allClaims.length < narrative.claim_count" class="mt-4 text-center">
          <Button @click="loadMoreClaims" :disabled="claimsLoading" variant="outline">
            <Loader2 v-if="claimsLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ $t('narratives.loadMoreClaims') }}
            ({{ allClaims.length }}/{{ narrative.claim_count }})
          </Button>
        </div>
      </div>

      <!-- Seen in Videos -->
      <div class="bg-stone-100 rounded-lg p-6" v-if="narrative.video_count > 0">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('narratives.seenIn') }} {{ narrative.video_count }} <span class="lowercase">{{ $t('videos.title') }}</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCard
            v-for="video in allVideos"
            :key="video.id"
            :video="video"
            @click="goToVideo"
          />
        </div>

        <!-- Load more videos button -->
        <div v-if="allVideos.length < narrative.video_count" class="mt-4 text-center">
          <Button @click="loadMoreVideos" :disabled="videosLoading" variant="outline">
            <Loader2 v-if="videosLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ $t('narratives.loadMoreVideos') }}
            ({{ allVideos.length }}/{{ narrative.video_count }})
          </Button>
        </div>
      </div>
    </div>

    <!-- Dialogs Section -->
    <AlertFormDialog
      v-if="narrative"
      v-model:open="showAlertDialog"
      :mode="'create'"
      :narrative-id="narrative.id"
      @save="handleAlertSave"
    />
    <NarrativeTitleDialog
      :open="editDialogOpen"
      :narrative="narrative"
      @update:open="editDialogOpen = $event"
      @save="handleUpdate"
    />
    <ConfirmUnlinkDialog />
    <MergeNarrativesDialog />
    <ConfirmDeleteDialog />
    <ClaimFeedbackDialog
      v-if="narrative"
    />
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Claim, Narrative, NarrativeDetail, NarrativeStatsResponse } from '~/types/api';
import type { Alert } from '~/types/alert';
import VideoCard from '~/components/VideoCard.vue';
import ClaimCard from '~/components/ClaimCard.vue';
import NarrativeEvolutionChart from '~/components/NarrativeEvolutionChart.vue';
import EntityCard from '~/components/EntityCard.vue';
import AlertFormDialog from '~/components/AlertFormDialog.vue';
import ConfirmDeleteDialog from '~/components/ConfirmDeleteDialog.vue';
import ConfirmUnlinkDialog from '~/components/ConfirmUnlinkDialog.vue';
import MergeNarrativesDialog from '~/components/MergeNarrativesDialog.vue';
import { Bell, Captions, ChevronDown, Combine, Trash, Loader2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
const narrative = ref<NarrativeDetail | null>(null);
const narrativeStats = ref<NarrativeStatsResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedTimeTab = ref('1w');
const contentType = ref('first');
const showAlertDialog = ref(false);
const editDialogOpen = ref(false);
const contextExpanded = ref(true);
const narrativeFeedbackScore = ref<number | null>(null);

// Pagination state for claims
const allClaims = ref<Claim[]>([]);
const claimsLoading = ref(false);

// Pagination state for videos
const allVideos = ref<typeof narrative.value extends { videos: infer V } ? V : never[]>([]);
const videosLoading = ref(false);

// Constants
const MAX_NUMBER_OF_STARS = 5;
const ITEMS_PER_PAGE = 20;

// Calculate narrative stats using the helper function
const stats = computed(() => {
  if (!narrative.value) return { totalViews: 0, totalLikes: 0, totalComments: 0 };
  return calculateNarrativeStats(narrative.value);
});

const languages = computed(() => {
  if (!narrative.value) return [];

  const languageSet = new Set<string>();

  if (narrative.value.claims) {
    narrative.value.claims.forEach(claim => {
      if (claim.metadata?.language) {
        languageSet.add(getLanguageName(claim.metadata?.language));
      }
    });
  }

  return Array.from(languageSet).sort();
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

const feedbackRating = computed(() => {
  if (narrativeFeedbackScore.value === null) return null;
  return Math.round(narrativeFeedbackScore.value * MAX_NUMBER_OF_STARS);
});

// Load more claims
const loadMoreClaims = async () => {
  if (!narrative.value) return;

  claimsLoading.value = true;
  try {
    const result = await apiService.getNarrativeClaims(narrative.value.id, {
      limit: ITEMS_PER_PAGE,
      offset: allClaims.value.length
    });
    allClaims.value = [...allClaims.value, ...result.data];
  } catch (err) {
    console.error('Failed to load more claims:', err);
  } finally {
    claimsLoading.value = false;
  }
};

// Load more videos
const loadMoreVideos = async () => {
  if (!narrative.value) return;

  videosLoading.value = true;
  try {
    const result = await apiService.getNarrativeVideos(narrative.value.id, {
      limit: ITEMS_PER_PAGE,
      offset: allVideos.value.length
    });
    allVideos.value = [...allVideos.value, ...result.data];
  } catch (err) {
    console.error('Failed to load more videos:', err);
  } finally {
    videosLoading.value = false;
  }
};

// Load narrative data
onMounted(async () => {
  try {
    const narrativeId = route.params.id as string;

    // Fetch narrative detail, stats, and feedback in parallel
    const [narrativeData, statsData, feedbackResponse] = await Promise.all([
      apiService.getNarrative(narrativeId),
      apiService.getNarrativeStats(narrativeId),
      apiService.getNarrativeFeedback(narrativeId)
    ]);

    narrative.value = narrativeData;
    narrativeStats.value = statsData;

    // Initialize displayed items with preview data
    allClaims.value = narrativeData.claims || [];
    allVideos.value = narrativeData.videos || [];

    if (!feedbackResponse) {
      narrativeFeedbackScore.value = null;
    } else {
      narrativeFeedbackScore.value = feedbackResponse.feedback_score;
    }
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

const goToEntity = (entityId: string) => {
  router.push(`/entities/${entityId}`);
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

const openMergeDialog = () => {
  if (!narrative.value) return;
  dialogsStore.openMergeDialog(narrative.value);
};

const openUnlinkDialog = (claim: Claim) => {
  dialogsStore.openUnlinkDialog(claim, async () => {
    await unlinkClaimFromNarrative(claim);
  });
};

const openDeleteDialog = () => {
  if (!narrative.value) return;
  dialogsStore.openDeleteDialog(narrative.value);
};

const handleAlertSave = (alert: Alert) => {
  toast.add({
    title: t('common.success'),
    description: t('alerts.create_success')
  });
  showAlertDialog.value = false;
};

const handleUpdate = (updatedNarrative: Narrative) => {
  narrative.value = updatedNarrative;
  editDialogOpen.value = false;
};

const unlinkClaimFromNarrative = async (claim: Claim) => {
  if (!narrative.value) return;

  try {
    await apiService.deleteClaimFromNarrative(narrative.value.id, claim.id);
    allClaims.value = allClaims.value.filter(c => c.id !== claim.id);
    narrative.value = {
      ...narrative.value,
      claim_count: narrative.value.claim_count - 1,
      claims: narrative.value.claims?.filter(c => c.id !== claim.id) || []
    };

    toast.add({
      title: t('common.success'),
      description: t('narratives.claimUnlinked'),
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

const handleVote = async (rating: number) => {
  if (!narrative.value) return;

  const score = rating / MAX_NUMBER_OF_STARS;
  narrativeFeedbackScore.value = score;

  const infoToast = toast.add({
    title: t('feedback.sending'),
    progress: false,
  });

  const result = await apiService.sendNarrativeFeedback(narrative.value!.id, score).catch(() => null);

  if (!result) {
    toast.update(infoToast.id,
      {
        title: t('feedback.error'),
        color: 'error',
        progress: true,
      });
    narrativeFeedbackScore.value = null;
    return;
  }

  toast.update(infoToast.id,
    {
      title: t('feedback.success'),
      color: 'success',
      progress: true,
    }
  );
};

const onFeedbackClick = (claim: Claim) => {
  if (!narrative.value) return;
  dialogsStore.openClaimFeedbackDialog(claim, narrative.value);
};
</script>
