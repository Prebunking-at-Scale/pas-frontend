<template>
  <div role="radiogroup" :aria-label="$t('alertRules.fields.type')" class="grid gap-2 text-sm" :class="types.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'">
    <button
      v-for="type in types"
      :key="type"
      type="button"
      role="radio"
      :aria-checked="modelValue === type"
      :disabled="disabled && modelValue !== type"
      class="rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      :class="[compact ? 'px-3 py-2' : 'p-3', modelValue === type
        ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700'
        : 'border-neutral-200 bg-white hover:bg-stone-50']"
      @click="emit('update:modelValue', type)"
    >
      <span class="block font-semibold text-gray-900">{{ $t(`alertRules.types.${type}.name`) }}</span>
      <span class="mt-1 block text-xs text-gray-600">{{ $t(`${descriptions}.${type}.description`) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// The two condition types side by side (docs/alerts.md): New narrative and New claim.
import { EDITOR_TYPES } from '~/utils/alertRules'
import type { ConditionType } from '~/utils/alertRules'

withDefaults(defineProps<{
  modelValue: ConditionType
  disabled?: boolean
  /** Tighter, for the picker inside each case. */
  compact?: boolean
  /** The types offered, in order. */
  types?: ConditionType[]
  /** Where each type's description is in the translations. */
  descriptions?: string
}>(), { disabled: false, compact: false, types: () => EDITOR_TYPES, descriptions: 'alertRules.typesV2' })

const emit = defineEmits<{ 'update:modelValue': [value: ConditionType] }>()
</script>
