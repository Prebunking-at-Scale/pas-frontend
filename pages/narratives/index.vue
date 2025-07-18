<template>
  <div>
      <!-- Topic Context Banner -->
      <div v-if="currentTopicName" class="mb-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          {{ $t('narratives.showingNarrativesFor') }} <span class="font-semibold">{{ currentTopicName }}</span>
          <button 
            @click="clearTopicFilter"
            class="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            {{ $t('narratives.clearFilter') }}
          </button>
        </p>
      </div>

      <!-- Filters -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ $t('narratives.filters') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Channel Filter -->
            <div>
              <Label class="mb-2">
                {{ $t('narratives.channel') }}
              </Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <Checkbox id="youtube" v-model:checked="platformYoutube" />
                  <Label htmlFor="youtube" class="cursor-pointer">YouTube</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="tiktok" v-model:checked="platformTiktok" />
                  <Label htmlFor="tiktok" class="cursor-pointer">TikTok</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="instagram" v-model:checked="platformInstagram" />
                  <Label htmlFor="instagram" class="cursor-pointer">Instagram</Label>
                </div>
              </div>
            </div>

            <!-- Language Filter -->
            <div>
              <Label class="mb-2">
                {{ $t('narratives.language') }}
              </Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <Checkbox id="lang-en" v-model:checked="languageEn" />
                  <Label htmlFor="lang-en" class="cursor-pointer">English</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="lang-es" v-model:checked="languageEs" />
                  <Label htmlFor="lang-es" class="cursor-pointer">Español</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="lang-fr" v-model:checked="languageFr" />
                  <Label htmlFor="lang-fr" class="cursor-pointer">Français</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="lang-de" v-model:checked="languageDe" />
                  <Label htmlFor="lang-de" class="cursor-pointer">Deutsch</Label>
                </div>
              </div>
            </div>

            <!-- Topic Filter -->
            <div>
              <Label class="mb-2">
                {{ $t('narratives.topic') }}
              </Label>
              <Select v-model="filters.topic_id">
                <SelectTrigger>
                  <SelectValue :placeholder="$t('narratives.selectTopic')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">{{ $t('narratives.allTopics') }}</SelectItem>
                  <SelectItem
                    v-for="topic in topicsStore.topics"
                    :key="topic.id"
                    :value="topic.id"
                  >
                    {{ topic.topic }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Keywords Filter -->
            <div>
              <Label htmlFor="keywords" class="mb-2">
                {{ $t('narratives.keywords') }}
              </Label>
              <Input
                id="keywords"
                type="text"
                v-model="keywordsInput"
                @keyup.enter="addKeyword"
                :placeholder="$t('narratives.keywordsPlaceholder')"
              />
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="(keyword, index) in filters.keywords"
                  :key="index"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {{ keyword }}
                  <button @click="removeKeyword(index)" class="ml-1 hover:text-primary/80">×</button>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end space-x-2">
          <Button
            @click="resetFilters"
            variant="outline"
          >
            {{ $t('narratives.clearFilters') }}
          </Button>
          <Button
            @click="applyFilters"
          >
            {{ $t('narratives.applyFilters') }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Narratives Grid -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <NarrativeCard
          v-for="narrative in narratives"
          :key="narrative.id"
          :narrative="narrative"
          @click="goToNarrative(narrative.id)"
        />
      </div>

      <!-- Pagination -->
      <Pagination 
        v-if="totalNarratives > itemsPerPage" 
        v-slot="{ page }"
        :total="totalNarratives"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        :default-page="currentPage"
        @update:page="(newPage) => { currentPage = newPage; loadNarratives(); }"
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
                @click="() => { currentPage = item.value; loadNarratives(); }"
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
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Narrative } from '~/types/api';
import { useTopicsStore } from '~/stores/topics';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { CalendarIcon } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationEllipsis } from '~/components/ui/pagination';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const topicsStore = useTopicsStore();
const { setPageHeader, clearPageHeader } = usePageHeader();


// State
const narratives = ref<Narrative[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalNarratives = ref(0);
const itemsPerPage = 20;

// Filters
const filters = ref({
  platform: [] as string[],
  language: [] as string[],
  dateFrom: '',
  dateTo: '',
  actors: [] as string[],
  entities: [] as string[],
  topic_id: null as string | null,
  keywords: [] as string[]
});

const keywordsInput = ref('');
const currentTopicName = ref('');

// Individual checkbox states for platforms
const platformYoutube = computed({
  get: () => filters.value.platform.includes('youtube'),
  set: (val) => {
    if (val) {
      filters.value.platform.push('youtube');
    } else {
      filters.value.platform = filters.value.platform.filter(p => p !== 'youtube');
    }
  }
});

const platformTiktok = computed({
  get: () => filters.value.platform.includes('tiktok'),
  set: (val) => {
    if (val) {
      filters.value.platform.push('tiktok');
    } else {
      filters.value.platform = filters.value.platform.filter(p => p !== 'tiktok');
    }
  }
});

const platformInstagram = computed({
  get: () => filters.value.platform.includes('instagram'),
  set: (val) => {
    if (val) {
      filters.value.platform.push('instagram');
    } else {
      filters.value.platform = filters.value.platform.filter(p => p !== 'instagram');
    }
  }
});

// Individual checkbox states for languages
const languageEn = computed({
  get: () => filters.value.language.includes('en'),
  set: (val) => {
    if (val) {
      filters.value.language.push('en');
    } else {
      filters.value.language = filters.value.language.filter(l => l !== 'en');
    }
  }
});

const languageEs = computed({
  get: () => filters.value.language.includes('es'),
  set: (val) => {
    if (val) {
      filters.value.language.push('es');
    } else {
      filters.value.language = filters.value.language.filter(l => l !== 'es');
    }
  }
});

const languageFr = computed({
  get: () => filters.value.language.includes('fr'),
  set: (val) => {
    if (val) {
      filters.value.language.push('fr');
    } else {
      filters.value.language = filters.value.language.filter(l => l !== 'fr');
    }
  }
});

const languageDe = computed({
  get: () => filters.value.language.includes('de'),
  set: (val) => {
    if (val) {
      filters.value.language.push('de');
    } else {
      filters.value.language = filters.value.language.filter(l => l !== 'de');
    }
  }
});

// Date picker values
const dateFromValue = computed({
  get: () => filters.value.dateFrom ? new Date(filters.value.dateFrom) : undefined,
  set: (val) => {
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      filters.value.dateFrom = `${year}-${month}-${day}`;
    } else {
      filters.value.dateFrom = '';
    }
  }
});

const dateToValue = computed({
  get: () => filters.value.dateTo ? new Date(filters.value.dateTo) : undefined,
  set: (val) => {
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      filters.value.dateTo = `${year}-${month}-${day}`;
    } else {
      filters.value.dateTo = '';
    }
  }
});

// Format date for display
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Methods
const loadNarratives = async () => {
  loading.value = true;
  try {
    let result;
    
    // If we have a topic filter, use the topic-specific endpoint
    if (filters.value.topic_id) {
      result = await apiService.getTopicNarratives(
        filters.value.topic_id,
        {
          limit: itemsPerPage,
          offset: (currentPage.value - 1) * itemsPerPage
        }
      );
    } else {
      // Use the general narratives endpoint
      result = await apiService.getNarratives({
        limit: itemsPerPage,
        offset: (currentPage.value - 1) * itemsPerPage
      });
    }
    
    // Apply client-side filters if needed
    let filteredData = result.data;
    
    // Filter by keywords if any
    if (filters.value.keywords.length > 0) {
      const keywordsLower = filters.value.keywords.map(k => k.toLowerCase());
      filteredData = filteredData.filter(narrative => {
        const textToSearch = `${narrative.title} ${narrative.description}`.toLowerCase();
        return keywordsLower.some(keyword => textToSearch.includes(keyword));
      });
    }
    
    // Set default values for UI fields if not present
    narratives.value = filteredData.map(narrative => ({
      ...narrative,
      actors: narrative.actors || [],
      entities: narrative.entities || [],
      topics: narrative.topics || [],
      related_content_count: narrative.claim_ids?.length || 0,
      is_active: true, // Default to active since API doesn't provide this
      first_seen: narrative.created_at || new Date().toISOString(),
      last_seen: narrative.updated_at || new Date().toISOString()
    }));
    
    totalNarratives.value = result.total;
  } catch (error) {
    console.error('Failed to load narratives:', error);
    narratives.value = [];
    totalNarratives.value = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  loadNarratives();
};

const resetFilters = () => {
  filters.value = {
    platform: [],
    language: [],
    dateFrom: '',
    dateTo: '',
    actors: [],
    entities: [],
    topic_id: null,
    keywords: []
  };
  currentTopicName.value = '';
  currentPage.value = 1;
  loadNarratives();
};

const clearTopicFilter = () => {
  filters.value.topic_id = null;
  currentTopicName.value = '';
  currentPage.value = 1;
  updatePageHeader();
  loadNarratives();
};

const updatePageHeader = () => {
  if (currentTopicName.value) {
    setPageHeader({ 
      title: `${currentTopicName.value}: ${$i18n.t('narratives.title')}`
    });
  } else {
    setPageHeader({ 
      title: $i18n.t('narratives.title')
    });
  }
};

const addKeyword = () => {
  if (keywordsInput.value.trim() && !filters.value.keywords.includes(keywordsInput.value.trim())) {
    filters.value.keywords.push(keywordsInput.value.trim());
    keywordsInput.value = '';
  }
};

const removeKeyword = (index: number) => {
  filters.value.keywords.splice(index, 1);
};

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};


// Watch for topic filter changes
watch(() => filters.value.topic_id, (newTopicId) => {
  if (newTopicId) {
    const topic = topicsStore.getTopicById(newTopicId);
    currentTopicName.value = topic?.topic || '';
  } else {
    currentTopicName.value = '';
  }
  updatePageHeader();
});

// Load initial data
onMounted(async () => {
  // Load available topics for filter
  await topicsStore.fetchTopics();
  
  // Check if we have a topic filter from query params
  const topicId = route.query.topic as string;
  if (topicId) {
    // Load topic from store
    const topic = await topicsStore.ensureTopicLoaded(topicId);
    if (topic) {
      filters.value.topic_id = topicId;
      currentTopicName.value = topic.topic;
    }
  }
  
  // Update page header
  updatePageHeader();
  
  loadNarratives();
});

onBeforeUnmount(() => {
  clearPageHeader();
});
</script>
