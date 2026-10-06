<template>
  <span class="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
    {{ $t(`alertRules.types.${shownType(type)}.name`) }}
  </span>
</template>

<script setup lang="ts">
// What a case watches, as a badge (docs/alerts.md).
import { shownType } from '~/utils/alertRules'
import type { ConditionType } from '~/utils/alertRules'

defineProps<{ type: ConditionType }>()
</script>
