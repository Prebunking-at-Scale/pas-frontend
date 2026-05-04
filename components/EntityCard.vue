<template>
  <div 
    class="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-gray-100 cursor-pointer transition-colors border-l-4 border-emerald-500 px-6 min-h-20 shadow-[0_0_0_1px_theme(colors.stone.200)]"
    @click="$emit('click')"
  >
    <div class="flex items-center space-x-3 flex-1 min-w-0">
      <div class="flex-shrink-0">
        <img 
          v-if="entityImage" 
          :src="entityImage" 
          :alt="entity.name"
          class="w-10 h-10 rounded object-cover"
          @error="handleImageError"
        >
        <div v-else class="w-10 h-10 rounded bg-stone-200 flex items-center justify-center">
          <span class="text-sm font-medium text-gray-600">{{ getInitials(entity.name) }}</span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate" :title="entity.name">{{ entity.name }}</p>
        <p v-if="entityDescription" class="text-xs text-gray-600 truncate" :title="entityDescription">{{ entityDescription }}</p>
        <p v-else-if="entityType" class="text-xs text-gray-600 capitalize truncate">{{ formatEntityType(entityType) }}</p>
        <!--Claims & videos stats-->
        <p v-if="entity.total_claims && entity.total_videos" class="text-xs text-gray-500 truncate">
          {{ $t('entities.claimsInVideos', { claims: entity.total_claims, videos: entity.total_videos }) }}
        </p>
        <div v-if="entity.platforms?.length > 0" class="flex text-xs text-gray-500">
          <p class="mr-1">{{ $t('entities.platformsLabel') }}</p>
          <PlatformBadge
            v-for="platform in entity.platforms || []"
            :key="platform"
            :platform="platform as 'youtube' | 'tiktok' | 'instagram'"
            class="mr-1"
          />
        </div>
        <p v-if="entity.languages?.length > 0" class="flex text-xs text-gray-500">
          {{ $t('entities.languagesCount', { count: entity.languages.length }) }}
        </p>
      </div>
    </div>
    <div class="flex items-center space-x-2 flex-shrink-0">
      <Badge v-if="showFrequency && entity.frequency" variant="secondary" class="text-xs">
        {{ entity.frequency }}
      </Badge>
      <ChevronRight v-if="showChevron" class="ml-4 w-4 h-4 text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { Entity } from '~/types/api';
import { getEntityImage, getEntityDescription, getEntityType } from '~/utils/entityHelpers';
import PlatformBadge from './PlatformBadge.vue';

interface Props {
  entity: Entity;
  showFrequency?: boolean;
  showChevron?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFrequency: true,
  showChevron: false
});

defineEmits<{
  click: []
}>();

// Computed properties using helper functions
const entityImage = computed(() => getEntityImage(props.entity));
const entityDescription = computed(() => getEntityDescription(props.entity));
const entityType = computed(() => getEntityType(props.entity));

const getInitials = (name: string): string => {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const formatEntityType = (type: string): string => {
  return type.replace(/_/g, ' ').toLowerCase();
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.style.display = 'none';
  const parent = target.parentElement;
  if (parent) {
    const fallback = document.createElement('div');
    fallback.className = 'w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center';
    const initials = document.createElement('span');
    initials.className = 'text-sm font-medium text-gray-600';
    initials.textContent = getInitials(props.entity.name);
    fallback.appendChild(initials);
    parent.appendChild(fallback);
  }
};
</script>