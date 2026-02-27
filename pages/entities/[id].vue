<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="entity">
      <!-- Entity Info Card -->
      <Card class="mb-6">
        <CardContent class="p-6">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <img 
                v-if="entityImage" 
                :src="entityImage" 
                :alt="entity.name"
                class="w-32 h-32 rounded-lg object-cover"
              >
              <div v-else class="w-32 h-32 rounded-lg bg-stone-200 flex items-center justify-center">
                <span class="text-3xl text-gray-600">{{ entity.name.charAt(0) }}</span>
              </div>
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ entity.name }}</h1>
              <p v-if="entityClass" class="text-lg text-gray-600 mb-2">{{ entityClass }}</p>
              <p v-if="entityDescription" class="text-gray-600 mb-4">{{ entityDescription }}</p>
              
              <!-- Wikidata Link -->
              <a 
                v-if="entity.wikidata_id"
                :href="`https://www.wikidata.org/wiki/${entity.wikidata_id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink class="w-4 h-4 mr-1" />
                {{ $t('entities.viewOnWikidata') }}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-primary">{{ videosCount }}</div>
            <p class="text-sm text-gray-500">{{ $t('entities.relatedVideos') }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Related Narratives -->
      <div v-if="narratives.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">{{ $t('entities.relatedNarratives') }}</h2>
          <span class="text-lg font-medium text-primary">{{ narrativesTotal }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NarrativeCard 
            v-for="narrative in narratives" 
            :key="narrative.id"
            :narrative="narrative"
            @click="goToNarrative(narrative.id)"
          />
        </div>
        <div v-if="narrativesTotal > narratives.length" class="mt-4 text-center">
          <Button 
            variant="outline" 
            @click="router.push(`/narratives?entity=${entity.id}`)"
          >
            {{ $t('entities.viewAllNarratives', { count: narrativesTotal }) }}
          </Button>
        </div>
      </div>

     
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500">{{ $t('entities.notFound') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Entity, Narrative } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { ExternalLink } from 'lucide-vue-next';
import { formatDate } from '~/utils/date';
import { getEntityImage, getEntityDescription, getEntityClass } from '~/utils/entityHelpers';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { setPageHeader, clearPageHeader } = usePageHeader();

const entity = ref<Entity | null>(null);
const narratives = ref<Narrative[]>([]);
const narrativesTotal = ref(0);
const loading = ref(true);

// Computed properties for entity details
const entityImage = computed(() => entity.value ? getEntityImage(entity.value) : null);
const entityDescription = computed(() => entity.value ? getEntityDescription(entity.value) : null);
const entityClass = computed(() => entity.value ? getEntityClass(entity.value) : null);

// Extract videos count from narratives
const videosCount = computed(() => {
  const uniqueVideos = new Set<string>();
  narratives.value.forEach(narrative => {
    if (narrative.videos) {
      narrative.videos.forEach(video => uniqueVideos.add(video.id));
    }
  });
  return uniqueVideos.size;
});

// Extract related entities from Wikidata claims
const relatedEntities = computed(() => {
  if (!entity.value?.metadata?.wikidata_info?.claims) return [];
  
  const entities: { id: string; label: string }[] = [];
  const claims = entity.value.metadata.wikidata_info.claims;
  
  // Extract entities from various claim properties
  const claimProps = ['P17', 'P6']; // Country, head of government
  
  claimProps.forEach(prop => {
    if (claims[prop]) {
      claims[prop].forEach(claim => {
        if (claim.id && claim.label && !entities.find(e => e.id === claim.id)) {
          entities.push({ id: claim.id, label: claim.label });
        }
      });
    }
  });
  
  return entities.slice(0, 5);
});

// Set dynamic page title
useHead(() => ({
  title: entity.value ? entity.value.name : 'Loading...'
}));

// Update page header when entity changes
watchEffect(() => {
  if (entity.value) {
    const headerHtml = `
      <div class="flex items-center">
        ${entityImage.value ? 
          `<img src="${entityImage.value}" alt="${entity.value.name}" class="w-8 h-8 rounded-lg object-cover">` : 
          `<div class="w-8 h-8 rounded-lg bg-stone-300 flex items-center justify-center">
            <span class="text-xl text-gray-600">${entity.value.name.charAt(0)}</span>
          </div>`
        }
        <div>
          <h1 class="font-bold text-4xl ml-4">${entity.value.name}</h1>
        </div>
      </div>
    `;
    
    setPageHeader({ customHtml: headerHtml });
  }
});

// Clear header on unmount
onBeforeUnmount(() => {
  clearPageHeader();
});

const loadEntityData = async () => {
  try {
    loading.value = true;
    const entityId = route.params.id as string;
    
    // Load entity and narratives in parallel
    const [entityData, narrativesData] = await Promise.all([
      apiService.getEntity(entityId),
      apiService.getEntityNarratives(entityId, { limit: 12 })
    ]);
    
    entity.value = entityData;
    narratives.value = narrativesData.data;
    narrativesTotal.value = narrativesData.total;
  } catch (error) {
    console.error('Failed to load entity data:', error);
    entity.value = null;
  } finally {
    loading.value = false;
  }
};

const goToNarrative = (id: string) => {
  router.push(`/narratives/${id}`);
};

onMounted(() => {
  loadEntityData();
});
</script>