<template>
  <div class="space-y-4">
    <div
      v-for="(entry, index) in entries"
      :key="index"
      class="relative pl-8 border-l-2 border-emerald-200"
    >
      <!-- Timeline dot -->
      <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>

      <!-- Date label -->
      <div class="text-sm font-medium text-emerald-700 mb-1">
        <template v-if="entry.date">
          {{ formatDate(entry.date.toISOString(), locale, 'long') }} · {{ formatTime(entry.date) }}
        </template>
        <template v-else>
          {{ $t('narratives.evolutionFirstAnalysis') }}
        </template>
      </div>

      <!-- Entry text -->
      <div class="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-line">
        {{ entry.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseEvolutionDescription } from '~/utils/narrativeEvolution';
import { formatDate } from '~/utils/date';

const props = defineProps<{
  evolutionDescription: string;
  locale?: string;
}>();

const entries = computed(() => parseEvolutionDescription(props.evolutionDescription));

function formatTime(date: Date): string {
  return date.toLocaleTimeString(props.locale || 'en', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
