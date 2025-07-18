<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else>
      <!-- Topic Header -->
      <div v-if="topic" class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ topic.topic }}</h1>
        <div class="flex gap-4 text-sm text-gray-600">
          <span>{{ topic.narrative_count }} {{ $t('topics.narratives') }}</span>
          <span>•</span>
          <span>{{ topic.claim_count }} {{ $t('topics.claims') }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex space-x-1 mb-6 border-b">
        <button
          @click="activeTab = 'narratives'"
          :class="{
            'border-b-2 border-primary text-primary': activeTab === 'narratives',
            'text-gray-500 hover:text-gray-700': activeTab !== 'narratives'
          }"
          class="px-4 py-2 font-medium transition-colors"
        >
          {{ $t('topics.narratives') }} ({{ narratives.total }})
        </button>
        <button
          @click="activeTab = 'claims'"
          :class="{
            'border-b-2 border-primary text-primary': activeTab === 'claims',
            'text-gray-500 hover:text-gray-700': activeTab !== 'claims'
          }"
          class="px-4 py-2 font-medium transition-colors"
        >
          {{ $t('topics.claims') }} ({{ claims.total }})
        </button>
      </div>

      <!-- Narratives Tab -->
      <div v-if="activeTab === 'narratives'" class="space-y-4">
        <div v-if="loadingNarratives" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="narratives.data.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NarrativeCard 
            v-for="narrative in narratives.data" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          {{ $t('topics.noNarrativesFound') }}
        </div>
        
        <!-- Pagination -->
        <Pagination 
          v-if="narratives.total > narratives.size" 
          v-slot="{ page }"
          :total="narratives.total"
          :items-per-page="narratives.size"
          :sibling-count="1"
          show-edges
          :default-page="narratives.page"
          @update:page="loadNarrativesPage"
          class="mt-6"
        >
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationFirst />
            <PaginationPrevious />

            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                <Button 
                  :variant="item.value === page ? 'default' : 'outline'" 
                  size="sm"
                  @click="loadNarrativesPage(item.value)"
                >
                  {{ item.value }}
                </Button>
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
      </div>

      <!-- Claims Tab -->
      <div v-if="activeTab === 'claims'" class="space-y-4">
        <div v-if="loadingClaims" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="claims.data.length > 0">
          <Card v-for="claim in claims.data" :key="claim.id" class="mb-4">
            <CardContent class="p-4">
              <p class="text-gray-900 mb-2">{{ claim.text }}</p>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>{{ $t('topics.confidence') }}: {{ Math.round(claim.confidence * 100) }}%</span>
                <span v-if="claim.timestamp">{{ $t('topics.timestamp') }}: {{ claim.timestamp }}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          {{ $t('topics.noClaimsFound') }}
        </div>
        
        <!-- Pagination -->
        <Pagination 
          v-if="claims.total > claims.size" 
          v-slot="{ page }"
          :total="claims.total"
          :items-per-page="claims.size"
          :sibling-count="1"
          show-edges
          :default-page="claims.page"
          @update:page="loadClaimsPage"
          class="mt-6"
        >
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationFirst />
            <PaginationPrevious />

            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                <Button 
                  :variant="item.value === page ? 'default' : 'outline'" 
                  size="sm"
                  @click="loadClaimsPage(item.value)"
                >
                  {{ item.value }}
                </Button>
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Narrative, Claim, PaginatedResponse, TopicWithStats } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const topicsStore = useTopicsStore();

const topic = ref<TopicWithStats | null>(null);
const loading = ref(true);
const activeTab = ref<'narratives' | 'claims'>('narratives');
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

// Set dynamic page title
useHead(() => ({
  title: topic.value ? `${topic.value.topic} - Topics` : 'Topics'
}));

const loadTopic = async () => {
  try {
    loading.value = true;
    const topicId = route.query.id as string;
    
    if (!topicId) {
      router.push('/dashboard');
      return;
    }
    
    // Get topic details from store
    topic.value = await topicsStore.ensureTopicLoaded(topicId);
    
    if (!topic.value) {
      router.push('/dashboard');
      return;
    }
    
    // Load initial data based on query params
    const tab = route.query.tab as string;
    if (tab === 'claims') {
      activeTab.value = 'claims';
      await loadClaims();
    } else {
      activeTab.value = 'narratives';
      await loadNarratives();
    }
  } catch (error) {
    console.error('Failed to load topic:', error);
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
};

const loadNarratives = async () => {
  if (!topic.value) return;
  
  try {
    loadingNarratives.value = true;
    narratives.value = await apiService.getTopicNarratives(
      topic.value.id,
      { limit: 20, offset: (narratives.value.page - 1) * 20 }
    );
  } catch (error) {
    console.error('Failed to load narratives:', error);
  } finally {
    loadingNarratives.value = false;
  }
};

const loadClaims = async () => {
  if (!topic.value) return;
  
  try {
    loadingClaims.value = true;
    claims.value = await apiService.getTopicClaims(
      topic.value.id,
      { limit: 20, offset: (claims.value.page - 1) * 20 }
    );
  } catch (error) {
    console.error('Failed to load claims:', error);
  } finally {
    loadingClaims.value = false;
  }
};

const loadNarrativesPage = async (page: number) => {
  narratives.value.page = page;
  await loadNarratives();
};

const loadClaimsPage = async (page: number) => {
  claims.value.page = page;
  await loadClaims();
};

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

// Watch for tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'narratives' && narratives.value.data.length === 0) {
    await loadNarratives();
  } else if (newTab === 'claims' && claims.value.data.length === 0) {
    await loadClaims();
  }
});

onMounted(() => {
  loadTopic();
});
</script>