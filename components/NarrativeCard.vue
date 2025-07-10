<template>
  <div 
    @click="$emit('click')"
    class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
  >
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex space-x-2">
          <span 
            v-for="(active, index) in [narrative.first_seen, narrative.last_seen, narrative.is_active]"
            :key="index"
            :class="[
              'w-2 h-2 rounded-full',
              index === 0 ? 'bg-gray-300' : index === 1 ? 'bg-gray-400' : narrative.is_active ? 'bg-green-500' : 'bg-gray-300'
            ]"
          />
        </div>
        <div class="text-xs text-gray-500">
          <span v-if="contentType === 'first'">{{ $t('narratives.first') }}</span>
          <span v-else-if="contentType === 'last'">{{ $t('narratives.last') }}</span>
          <span v-else>{{ $t('narratives.active') }}</span>
        </div>
      </div>

      <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">{{ narrative.title }}</h3>
      
      <div class="text-xs text-gray-500 mb-3">
        {{ $t('narratives.relatedContent') }}: {{ narrative.related_content_count }}
      </div>

      <div class="aspect-video bg-gray-200 rounded mb-3">
        <!-- Content preview placeholder -->
      </div>

      <div class="space-y-2">
        <div class="flex items-center text-xs">
          <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="text-gray-600">{{ $t('common.actors') }}: {{ narrative.actors.length }}</span>
        </div>
        
        <div class="flex items-center text-xs">
          <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span class="text-gray-600">{{ $t('common.entities') }}: {{ narrative.entities.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Narrative } from '~/types/api';

interface Props {
  narrative: Narrative;
  contentType?: 'first' | 'last' | 'active';
}

withDefaults(defineProps<Props>(), {
  contentType: 'first'
});

defineEmits<{
  click: []
}>();

const { $i18n } = useNuxtApp();
</script>