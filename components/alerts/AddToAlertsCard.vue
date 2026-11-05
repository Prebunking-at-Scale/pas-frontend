<template>
  <button
    type="button"
    class="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-6 text-center text-emerald-900 transition-colors hover:border-emerald-600 hover:bg-emerald-50 cursor-pointer"
    @click="emit('click')"
  >
    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
      <BellPlus class="h-5 w-5" />
    </span>
    <span class="font-semibold">+ {{ $t('alertRules.addFromSearch.card') }}</span>
    <span class="max-w-60 text-sm text-emerald-800/80">{{ $t(`alertRules.addFromSearch.cardHint.${tab}`) }}</span>
  </button>
</template>

<script setup lang="ts">
// The last card of the search results: turns the search into an alert.
import { BellPlus } from 'lucide-vue-next'

defineProps<{ tab: string }>()
const emit = defineEmits<{ click: [] }>()
</script>
