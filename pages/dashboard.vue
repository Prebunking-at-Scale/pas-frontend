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

      <!-- Top narratives per alert level, ordered by severity (viral, alert,
           early surge, watch), ranked by composite virality score (early surge
           by acceleration). alert_level is the current daily classification, so
           these sections are not scoped by the timeframe selector (which still
           drives Topics and Entities below). Each box is tinted towards its
           alert colour. -->
      <template v-for="level in ALERT_SECTIONS" :key="level">
        <div v-if="sections[level].length" class="mb-6 rounded-lg p-6" :class="SECTION_BG[level]">
          <div class="flex items-center justify-between gap-4 mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ $t('dashboard.topN', { n: sections[level].length }) }}
              <span class="lowercase">{{ $t(`narratives.alertLevels.${level}`) }}</span>
            </h3>
            <button
              @click="goToAlertLevel(level)"
              class="shrink-0 text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2 cursor-pointer"
            >
              {{ $t('entities.viewAllNarratives', { count: counts[level] }) }}
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NarrativeCard
              v-for="narrative in sections[level]"
              :key="narrative.id"
              :narrative="narrative"
              @click="goToNarrative(narrative.id)"
            />
          </div>
        </div>
      </template>

      <hr class="py-3"/>

      <!-- Topics -->
      <div class="mb-8">
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

      <!-- Entities -->
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
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { interval, sub } from "date-fns";
import { apiService } from '~/services/api';
import type { TopicWithStats, Entity, NarrativeSummary } from '~/types/api';
import { NarrativeAlertLevel } from '~/types/api';
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

// Alert-level sections, ordered by severity: viral first, then alert,
// early surge and watch.
const ALERT_SECTIONS = [
  NarrativeAlertLevel.VIRAL,
  NarrativeAlertLevel.ALERT,
  NarrativeAlertLevel.EARLY_SURGE,
  NarrativeAlertLevel.WATCH,
] as const;
const SECTION_LIMIT = 6;

// Box background tinted towards each level's alert colour (translucent).
const SECTION_BG: Record<string, string> = {
  [NarrativeAlertLevel.VIRAL]: 'bg-red-500/10',
  [NarrativeAlertLevel.ALERT]: 'bg-amber-500/10',
  [NarrativeAlertLevel.EARLY_SURGE]: 'bg-orange-500/10',
  [NarrativeAlertLevel.WATCH]: 'bg-blue-500/10',
};

// Ranking score per level: early surge is defined by acceleration (the
// emerging signal), the rest by overall composite virality.
const SECTION_SORT: Record<string, string> = {
  [NarrativeAlertLevel.VIRAL]: 'composite',
  [NarrativeAlertLevel.ALERT]: 'composite',
  [NarrativeAlertLevel.EARLY_SURGE]: 'acceleration',
  [NarrativeAlertLevel.WATCH]: 'composite',
};

// Initialize from localStorage when component mounts (client-side only)
onMounted(() => {
  const saved = localStorage.getItem('dashboardTimeframe');
  if (saved && Object.values(AVAILABLE_TIMEFRAMES).includes(saved as AVAILABLE_TIMEFRAMES)) {
    selectedTimeframe.value = saved as AVAILABLE_TIMEFRAMES;
  }
  loadData();
});

// Topics / entities context (timeframe-scoped).
const stats = ref<{
  topics: TopicWithStats[];
  entities: Entity[];
}>({
  topics: [],
  entities: []
});

// Narratives and totals per alert level.
const sections = ref<Record<NarrativeAlertLevel, NarrativeSummary[]>>({
  [NarrativeAlertLevel.NONE]: [],
  [NarrativeAlertLevel.VIRAL]: [],
  [NarrativeAlertLevel.EARLY_SURGE]: [],
  [NarrativeAlertLevel.ALERT]: [],
  [NarrativeAlertLevel.WATCH]: [],
});
const counts = ref<Record<NarrativeAlertLevel, number>>({
  [NarrativeAlertLevel.NONE]: 0,
  [NarrativeAlertLevel.VIRAL]: 0,
  [NarrativeAlertLevel.EARLY_SURGE]: 0,
  [NarrativeAlertLevel.ALERT]: 0,
  [NarrativeAlertLevel.WATCH]: 0,
});

const loading = ref(true);

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

const goToAlertLevel = (level: NarrativeAlertLevel) => {
  router.push(`/narratives?alert_level=${level}`);
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
    const hours = timeframeInterval
      ? Math.round((timeframeInterval.end.getTime() - timeframeInterval.start.getTime()) / 3_600_000)
      : null;

    const [topicsResponse, entitiesResponse, ...levelResponses] = await Promise.all([
      apiService.getTopicsWithStats({ limit: 5, startDate: timeframeInterval?.start, endDate: timeframeInterval?.end }),
      apiService.getEntities({ limit: 12, hours }),
      ...ALERT_SECTIONS.map((level) =>
        apiService.getNarratives({ alert_level: [level], limit: SECTION_LIMIT, sort: SECTION_SORT[level] })
      ),
    ]);

    stats.value = {
      topics: topicsResponse.data || [],
      entities: entitiesResponse.data || [],
    };

    ALERT_SECTIONS.forEach((level, i) => {
      sections.value[level] = levelResponses[i]?.data || [];
      counts.value[level] = levelResponses[i]?.total || 0;
    });

    // Populate the topics store so the narratives filter has them ready.
    if (topicsResponse.data && topicsResponse.data.length > 0) {
      topicsStore.$patch({
        topics: topicsResponse.data,
        lastFetch: new Date()
      });
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    // Keep default empty state on error
  } finally {
    loading.value = false;
  }
}
</script>
