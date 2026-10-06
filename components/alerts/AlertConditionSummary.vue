<template>
  <span class="inline-flex flex-wrap items-center gap-1">
    <span
      v-for="part in parts"
      :key="part"
      class="rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-xs text-gray-700"
    >
      {{ part }}
    </span>
  </span>
</template>

<script setup lang="ts">
// A condition in one line: "Topic: Migration", "Language: Spanish"…
import type { ConditionFilters, ConditionType } from '~/utils/alertRules'

const props = defineProps<{ type: ConditionType; filters: ConditionFilters }>()

const summarize = useConditionSummary()
const parts = computed(() => summarize(props.type, props.filters))
</script>
