<template>
  <div>
    <FilterCard
      :title="$t('entities.filters')"
      :has-active-filters="hasActiveFilters"
      @apply-filters="applyFilters"
      @clear-filters="clearFilters"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <KeywordsFilter
          class="w-full"
          v-model="filters.text"
          :label="$t('entities.name')"
          :placeholder="$t('entities.namePlaceholder')"
          @enter-pressed="applyFilters"
        />
        <NumericRangeFilter
          class="w-full"
          v-model="filters.linkedNarrativesRange"
          :label="$t('entities.linkedNarrativesRange')"
          :min="DEFAULT_MIN"
          :max="DEFAULT_MAX"
          :step="1"
        />
        <LanguageFilter
          class="w-full"
          v-model="filters.language"
          :label="$t('videos.language')"
          :placeholder="$t('videos.selectLanguage')"
          type="select"
        />
      </div>
    </FilterCard>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>

    <div v-else>
      <div class="mb-4 text-sm text-gray-600">
        {{ $t('entities.showingResults', { count: totalEntities }) }}
      </div>

      <div
        v-if="entities.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <EntityCard
          v-for="entity in entities"
          :key="entity.id"
          :entity="entity"
          :show-frequency="false"
          :show-chevron="true"
          @click="goToEntity(entity.id)"
        />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        {{ $t('entities.noEntitiesFound') }}
      </div>

      <Pagination
        v-if="totalEntities > itemsPerPage"
        v-slot="{ page }"
        :total="totalEntities"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        :default-page="currentPage"
        @update:page="loadPage"
        class="mt-8"
      >
        <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
          <PaginationFirst />
          <PaginationPrevious />

          <template v-for="(item, index) in items">
            <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
              <Button
                :variant="item.value === page ? 'default' : 'outline'"
                size="sm"
                class="cursor-pointer"
                @click="loadPage(item.value)"
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
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Entity } from '~/types/api';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';
import FilterCard from '~/components/filters/FilterCard.vue';
import KeywordsFilter from '~/components/filters/KeywordsFilter.vue';
import LanguageFilter from '~/components/filters/LanguageFilter.vue';
import NumericRangeFilter from '~/components/filters/NumericRangeFilter.vue';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { setPageHeader, clearPageHeader } = usePageHeader();
const { saveListState, restoreListState, clearListState } = useListStatePreservation('entities');

const entities = ref<Entity[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const totalEntities = ref(0);
const itemsPerPage = 20;

// Range filter defaults
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 99999;

// Model values for filter controls
const filters = ref({
  text: [] as string[],
  language: 'all',
  linkedNarrativesRange: [String(DEFAULT_MIN), String(DEFAULT_MAX)] as string[]
});

const appliedFilters = ref({
  text: [] as string[],
  language: 'all',
  linkedNarrativesRange: [DEFAULT_MIN, DEFAULT_MAX] as number[]
});

const hasActiveFilters = computed(() => {
  const hasRangeFilter =
    appliedFilters.value.linkedNarrativesRange[0] !== DEFAULT_MIN ||
    appliedFilters.value.linkedNarrativesRange[1] !== DEFAULT_MAX;

  return appliedFilters.value.text.length > 0 || appliedFilters.value.language !== 'all' || hasRangeFilter;
});

const loadEntities = async () => {
  try {
    loading.value = true;

    const params: {
      limit: number;
      offset: number;
      text?: string;
      language?: string;
      narratives_min?: number;
      narratives_max?: number;
    } = {
      limit: itemsPerPage,
      offset: (currentPage.value - 1) * itemsPerPage
    };

    if (appliedFilters.value.text.length > 0) {
      params.text = appliedFilters.value.text.join(' ');
    }

    if (appliedFilters.value.language && appliedFilters.value.language !== 'all') {
      params.language = appliedFilters.value.language;
    }

    if (appliedFilters.value.linkedNarrativesRange[0] !== DEFAULT_MIN) {
      params.narratives_min = appliedFilters.value.linkedNarrativesRange[0];
    }

    if (appliedFilters.value.linkedNarrativesRange[1] !== DEFAULT_MAX) {
      params.narratives_max = appliedFilters.value.linkedNarrativesRange[1];
    }

    const response = await apiService.getEntities(params);
    entities.value = response.data;
    totalEntities.value = response.total;
  } catch (error) {
    console.error('Error loading entities:', error);
    entities.value = [];
    totalEntities.value = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
  currentPage.value = 1;
  loadEntities();
};

const clearFilters = () => {
  filters.value = {
    text: [],
    language: 'all',
    linkedNarrativesRange: [String(DEFAULT_MIN), String(DEFAULT_MAX)]
  };
  appliedFilters.value = {
    text: [],
    language: 'all',
    linkedNarrativesRange: [DEFAULT_MIN, DEFAULT_MAX]
  };
  currentPage.value = 1;
  loadEntities();
};

const getNormalizedRange = (range?: number[]) => {
  const minValue = Math.max(DEFAULT_MIN, range?.[0] ?? DEFAULT_MIN);
  const maxValue = Math.max(minValue, range?.[1] ?? DEFAULT_MAX);
  return [minValue, maxValue] as number[];
};

const loadPage = (page: number) => {
  currentPage.value = page;
  loadEntities();
};

const goToEntity = (id: string) => {
  saveListState({
    currentPage: currentPage.value,
    filters: filters.value,
    appliedFilters: appliedFilters.value
  });
  router.push(`/entities/${id}`);
};

onMounted(async () => {
  const savedState = restoreListState();
  if (savedState) {
    currentPage.value = savedState.currentPage;
    filters.value = { ...filters.value, ...savedState.filters };
    appliedFilters.value = { ...appliedFilters.value, ...savedState.appliedFilters };

    filters.value.linkedNarrativesRange = getNormalizedRange(filters.value.linkedNarrativesRange.map(Number)).map(String);
    appliedFilters.value.linkedNarrativesRange = getNormalizedRange(appliedFilters.value.linkedNarrativesRange.map(Number));

    clearListState();
  } else {
    const textFromQuery = route.query.text as string | undefined;
    const languageFromQuery = route.query.language as string | undefined;
    const narrativesMinFromQuery = Number(route.query.narratives_min);
    const narrativesMaxFromQuery = Number(route.query.narratives_max);

    if (textFromQuery) {
      const queryTokens = textFromQuery.split(' ').filter(Boolean);
      filters.value.text = queryTokens;
      appliedFilters.value.text = queryTokens;
    }

    if (languageFromQuery) {
      filters.value.language = languageFromQuery;
      appliedFilters.value.language = languageFromQuery;
    }

    if (!Number.isNaN(narrativesMinFromQuery) || !Number.isNaN(narrativesMaxFromQuery)) {
      const rangeFromQuery = [
        Number.isNaN(narrativesMinFromQuery) ? DEFAULT_MIN : narrativesMinFromQuery,
        Number.isNaN(narrativesMaxFromQuery) ? DEFAULT_MAX : narrativesMaxFromQuery
      ];
      const normalized = getNormalizedRange(rangeFromQuery);
      filters.value.linkedNarrativesRange = normalized.map(String);
      appliedFilters.value.linkedNarrativesRange = normalized;
    }
  }

  setPageHeader({
    title: $i18n.t('entities.title')
  });

  await loadEntities();
});

onBeforeUnmount(() => {
  clearPageHeader();
});
</script>