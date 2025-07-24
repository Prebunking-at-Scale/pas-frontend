<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="topicStats">

      <!-- Main Content: Two Sections -->
      <div class="space-y-8">
        <!-- Narratives Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-gray-900">
              {{ $t('topics.narratives') }} ({{ topicStats.narrative_count }})
            </h2>
            <Button
              @click="goToNarrativesIndex"
              variant="outline"
              size="sm"
            >
              {{ $t('topics.viewAll') }}
            </Button>
          </div>

          <div v-if="loadingNarratives" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <div v-else-if="narratives.data.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <NarrativeCard 
              v-for="narrative in narratives.data" 
              :key="narrative.id"
              :narrative="narrative"
              @click="goToNarrative(narrative.id)"
            />
          </div>
          <div v-else class="bg-stone-50 rounded-lg p-8 text-center text-gray-500">
            {{ $t('topics.noNarrativesFound') }}
          </div>
        </div>

        <!-- Claims Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-gray-900">
              {{ $t('topics.claims') }} ({{ topicStats.claim_count }})
            </h2>
            <Button
              @click="goToClaimsIndex"
              variant="outline"
              size="sm"
            >
              {{ $t('topics.viewAll') }}
            </Button>
          </div>

          <div v-if="loadingClaims" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <div v-else-if="claims.data.length > 0" class="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <ClaimCard 
              v-for="claim in claims.data" 
              :key="claim.id" 
              :claim="claim"
            />
          </div>
          <div v-else class="bg-stone-50 rounded-lg p-8 text-center text-gray-500">
            {{ $t('topics.noClaimsFound') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Narrative, Claim, PaginatedResponse, TopicWithStats } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Button } from '~/components/ui/button';
import ClaimCard from '~/components/ClaimCard.vue';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { setPageHeader, clearPageHeader } = usePageHeader();
const topicsStore = useTopicsStore();

const loading = ref(true);
const narratives = ref<PaginatedResponse<Narrative>>({
  data: [],
  total: 0,
  page: 1,
  size: 20
});
const claims = ref<PaginatedResponse<Claim>>({
  data: [],
  total: 0,
  page: 1,
  size: 20
});
const loadingNarratives = ref(false);
const loadingClaims = ref(false);
const topicStats = ref<TopicWithStats | null>(null);

// Set dynamic page title in the browser tab
useHead(() => ({
  title: topicStats.value ? `${$i18n.t('topics.topic')}: ${topicStats.value.topic}` : 'Loading...'
}));

// Update the page header with topic information when data changes
watchEffect(() => {
  if (topicStats.value) {
    setPageHeader({ 
      title: `${$i18n.t('topics.topic')}: ${topicStats.value.topic}`
    });
  }
});

// Clear the custom header when leaving the page
onBeforeUnmount(() => {
  clearPageHeader();
});

const loadTopic = async () => {
  try {
    loading.value = true;
    
    // Load stats to get counts and proper topic name
    const foundTopicStats = await topicsStore.ensureTopicLoaded(route.params.id as string);
    if (foundTopicStats) {
      topicStats.value = foundTopicStats;
    }
    
    // Load narratives and claims
    await Promise.all([
      loadNarratives(),
      loadClaims()
    ]);
  } catch (error) {
    console.error('Failed to load topic:', error);
  } finally {
    loading.value = false;
  }
};

const loadNarratives = async () => {
  try {
    loadingNarratives.value = true;
    narratives.value = await apiService.getTopicNarratives(
      route.params.id as string,
      { limit: 20, offset: 0 }
    );
  } catch (error) {
    console.error('Failed to load narratives:', error);
  } finally {
    loadingNarratives.value = false;
  }
};

const loadClaims = async () => {
  try {
    loadingClaims.value = true;
    claims.value = await apiService.getTopicClaims(
      route.params.id as string,
      { limit: 20, offset: 0 }
    );
  } catch (error) {
    console.error('Failed to load claims:', error);
  } finally {
    loadingClaims.value = false;
  }
};

// Navigation methods
const goToNarrativesIndex = () => {
  router.push(`/narratives?topic=${route.params.id}`);
};

const goToClaimsIndex = () => {
  router.push(`/claims?topic=${route.params.id}`);
};

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};


onMounted(() => {
  loadTopic();
});
</script>