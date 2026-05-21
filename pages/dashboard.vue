<template>
  <ClientOnly>
    <!--filters-->
    <div class="flex gap-1 items-center bg-neutral-100 bord rounded-md text-xs text-gray-600 px-3 py-2 mb-4">
      <div class="flex gap-1 items-center">
        <div class="h-min shrink-0">{{$t('dashboard.displayDataFrom')}}: </div>
        <Select v-model="selectedTimeframe" class="shrink">
          <SelectTrigger class="w-full bg-neutral-50 dark:bg-white text-xs"
            :disabled="loading"
          >
            <SelectValue :placeholder="$t('dashboard.selectTimeframe')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="value in Object.values(AVAILABLE_TIMEFRAMES)" :key="value" :value="value">
              {{ $t(`dashboard.${value}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <hr class="mb-4">
    <div>
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
      
      <div v-else>
      
      <!-- Stats Cards -->
      <div class="flex flex-col gap-6 mb-8">

        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('dashboard.topics') }}</h2>
          
          <div class="flex flex-row gap-2 text-sm">
            <div 
                v-for="topic in stats.topics.slice(0, 5)" 
                :key="topic.id"
                class="border border-sky-200 bg-sky-50 text-sky-800 px-4 py-2 rounded-full flex flex-row justify-between items-center"
              >
                <span 
                  @click="goToTopic(topic.id)"
                  class="text-sky-800 hover:text-sky-900 cursor-pointer mr-4"
                >{{ topic.topic }}</span>
                <div class="flex gap-2">
                  <button
                    @click.stop="goToTopicWithType(topic.id, 'narratives')"
                    class="flex cursor-pointer text-xs rounded-full transition-colors bg-sky-50 hover:bg-sky-200 text-sky-800"
                    :title="$t('dashboard.narrativesCount')"
                  >
                    <font-awesome :icon="faCircleNodes" class="mr-2"/> {{ topic.narrative_count }}
                  </button>
                  <button
                    @click.stop="goToTopicWithType(topic.id, 'claims')"
                    class="flex cursor-pointer text-xs rounded-full transition-colors bg-sky-50 hover:bg-sky-200 text-sky-800"
                    :title="$t('dashboard.claimsCount')"
                  >
                  <font-awesome :icon="faComment" class="mr-2"/> {{ topic.claim_count }}
                  </button>
                </div>
              </div>
            </div>
        </div>

        <div v-if="stats.entities.length > 0">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('dashboard.entities') }}</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <EntityCard
              v-for="entity in stats.entities.slice(0, 12)"
              :key="entity.id"
              :entity="entity"
              :show-frequency="false"
              :show-chevron="true"
              @click="goToEntity(entity.id)"
            />
          </div>
        </div>

      </div>

      <hr class="py-3"/>

      <!-- Viral Narratives -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">🔥 {{ $t('dashboard.viralNarratives') }}</h2>
          <!-- <span class="text-sm text-gray-500">{{ $t('dashboard.lastWeek') }}</span> -->
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NarrativeCard 
            v-for="narrative in stats.viralNarratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>

      <hr class="py-3"/>

      <!-- Prevalent Narratives -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">🌐 {{ $t('dashboard.prevalentNarratives') }}</h2>
          <!-- <span class="text-sm text-gray-500">{{ $t('dashboard.lastWeek') }}</span> -->
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NarrativeCard 
            v-for="narrative in stats.prevalentNarratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
      </div>
    </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { interval, sub } from "date-fns";
import { apiService } from '~/services/api';
import type { TopicWithStats, Entity, NarrativeSummary } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { faCircleNodes, faComment } from '@fortawesome/free-solid-svg-icons';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const router = useRouter();
const topicsStore = useTopicsStore();

enum AVAILABLE_TIMEFRAMES {
  LAST_24_HOURS = 'last24Hours',
  LAST_WEEK = 'lastWeek',
  LAST_MONTH = 'lastMonth',
  ALL_TIME = 'allTime'
}

const selectedTimeframe = ref(AVAILABLE_TIMEFRAMES.LAST_24_HOURS);

// Initialize from localStorage when component mounts (client-side only)
onMounted(() => {
  const saved = localStorage.getItem('dashboardTimeframe');
  if (saved && Object.values(AVAILABLE_TIMEFRAMES).includes(saved as AVAILABLE_TIMEFRAMES)) {
    selectedTimeframe.value = saved as AVAILABLE_TIMEFRAMES;
  }
  loadData();
});

// Load dashboard stats with safe defaults
const stats = ref<{
  topics: TopicWithStats[];
  entities: Entity[];
  actors: any[];
  viralNarratives: NarrativeSummary[];
  prevalentNarratives: NarrativeSummary[];
}>({
  topics: [],
  entities: [],
  actors: [],
  viralNarratives: [],
  prevalentNarratives: []
});

const loading = ref(true);

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

const goToTopic = (id: string) => {
  router.push(`/topics/${id}`);
};

const goToTopicWithType = (id: string, type: 'narratives' | 'claims') => {
  if (type === 'narratives') {
    router.push(`/narratives?topic=${id}`);
  } else {
    router.push(`/claims?topic=${id}`);
  }
};

const goToEntity = (id: string) => {
  router.push(`/entities/${id}`);
};

const getDateIntervalFromTimeframe = (timeframe: string) => {
  const now = new Date();

  switch (timeframe) {
    case AVAILABLE_TIMEFRAMES.LAST_24_HOURS:
      return interval(sub(now, { hours: 24 }), now);
    case AVAILABLE_TIMEFRAMES.LAST_WEEK:
      return interval(sub(now, { days: 7 }), now);
    case AVAILABLE_TIMEFRAMES.LAST_MONTH:
      return interval(sub(now, { months: 1 }), now);
    case AVAILABLE_TIMEFRAMES.ALL_TIME:
    default:
      return null; // No filter
  }
};

watch(selectedTimeframe, (newValue) => {
  if (import.meta.client) {
    localStorage.setItem('dashboardTimeframe', newValue);
  }
  loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    const timeframeInterval = getDateIntervalFromTimeframe(selectedTimeframe.value);
    const data = await apiService.getDashboardStats(timeframeInterval);
    // Ensure all arrays exist with defaults
    stats.value = {
      topics: data.topics || [],
      entities: data.entities || [],
      actors: data.actors || [],
      viralNarratives: data.viralNarratives || [],
      prevalentNarratives: data.prevalentNarratives || []
    };
    
    // Also populate the topics store if we got topics
    if (data.topics && data.topics.length > 0) {
      topicsStore.$patch({
        topics: data.topics,
        lastFetch: new Date()
      });
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    // Keep default empty arrays on error
  } finally {
    loading.value = false;
  }
}
</script>