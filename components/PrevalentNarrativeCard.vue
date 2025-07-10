<template>
  <div 
    @click="$emit('click')"
    class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div class="aspect-[3/2] bg-gray-200 rounded-t-lg relative">
      <div class="absolute bottom-2 left-2 right-2">
        <div class="bg-black bg-opacity-60 text-white rounded px-2 py-1">
          <h3 class="font-medium text-sm line-clamp-2">{{ narrative.title }}</h3>
        </div>
      </div>
    </div>
    <div class="p-4">
      <p class="text-sm text-gray-600 line-clamp-3 mb-3">{{ narrative.description }}</p>
      
      <div class="space-y-2 mb-3">
        <div v-if="narrative.actors.length > 0" class="flex items-start">
          <span class="text-xs text-gray-500 w-16">{{ $t('common.actors') }}:</span>
          <div class="flex-1 flex flex-wrap gap-1">
            <span 
              v-for="actor in narrative.actors.slice(0, 3)" 
              :key="actor.id"
              class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {{ actor.name }}
            </span>
            <span v-if="narrative.actors.length > 3" class="text-xs text-gray-500">
              +{{ narrative.actors.length - 3 }}
            </span>
          </div>
        </div>
        
        <div v-if="narrative.entities.length > 0" class="flex items-start">
          <span class="text-xs text-gray-500 w-16">{{ $t('common.entities') }}:</span>
          <div class="flex-1 flex flex-wrap gap-1">
            <span 
              v-for="entity in narrative.entities.slice(0, 3)" 
              :key="entity.id"
              class="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
            >
              {{ entity.name }}
            </span>
            <span v-if="narrative.entities.length > 3" class="text-xs text-gray-500">
              +{{ narrative.entities.length - 3 }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-500">
          {{ $t('narratives.associatedContent') }}: {{ narrative.related_content_count }}
        </span>
        <span 
          :class="[
            'px-2 py-0.5 rounded text-xs font-medium',
            narrative.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          ]"
        >
          {{ narrative.is_active ? $t('common.active') : $t('common.inactive') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Narrative } from '~/types/api';

interface Props {
  narrative: Narrative;
}

defineProps<Props>();

defineEmits<{
  click: []
}>();

const { $i18n } = useNuxtApp();
</script>