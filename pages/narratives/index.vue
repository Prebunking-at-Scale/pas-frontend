<template>
  <div>

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

            <!-- Date Filter -->
            <div>
              <Label class="mb-2">
                {{ $t('narratives.dateRange') }}
              </Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full justify-start text-left font-normal mb-2">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ filters.dateFrom ? formatDate(filters.dateFrom) : $t('narratives.selectStartDate') }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="dateFromValue" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full justify-start text-left font-normal">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ filters.dateTo ? formatDate(filters.dateTo) : $t('narratives.selectEndDate') }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="dateToValue" />
                </PopoverContent>
              </Popover>
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
      <div v-if="narratives.length > 0" class="mt-6 flex justify-center">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {{ $t('common.previous') }}
          </button>
          <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {{ $t('common.next') }}
          </button>
        </nav>
      </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Narrative } from '~/types/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CalendarIcon } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();


// State
const narratives = ref<Narrative[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 12;

// Filters
const filters = ref({
  platform: [],
  language: [],
  dateFrom: '',
  dateTo: '',
  actors: [],
  entities: [],
  topics: [],
  keywords: []
});

const keywordsInput = ref('');

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
    const result = await apiService.getNarratives(filters.value);
    narratives.value = result.data.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage);
    totalPages.value = Math.ceil(result.total / itemsPerPage);
  } catch (error) {
    console.error('Failed to load narratives:', error);
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
    topics: [],
    keywords: []
  };
  currentPage.value = 1;
  loadNarratives();
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

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadNarratives();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadNarratives();
  }
};

// Load initial data
onMounted(() => {
  loadNarratives();
});
</script>
