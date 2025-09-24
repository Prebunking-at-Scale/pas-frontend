<template>
  <div 
    class="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors border border-stone-100 h-18"
    @click="$emit('click')"
  >
    <div class="flex items-center space-x-3">
      <div class="flex-shrink-0">
        <img 
          v-if="entityImage" 
          :src="entityImage" 
          :alt="entity.name"
          class="w-10 h-10 rounded-full object-cover"
          @error="handleImageError"
        >
        <div v-else class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
          <span class="text-sm font-medium text-gray-600">{{ getInitials(entity.name) }}</span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ entity.name }}</p>
        <p v-if="entityType" class="text-xs text-gray-500 capitalize">{{ formatEntityType(entityType) }}</p>
        <p v-if="entityDescription && showDescription" class="text-xs text-gray-400 truncate">{{ entityDescription }}</p>
      </div>
    </div>
    <div class="flex items-center space-x-2">
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

interface Props {
  entity: Entity;
  showFrequency?: boolean;
  showChevron?: boolean;
  showDescription?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFrequency: true,
  showChevron: false,
  showDescription: false
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