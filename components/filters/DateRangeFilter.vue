<template>
  <div class="space-y-2">
    <Label :for="startId">{{ label || $t('filters.dateRange') }}</Label>

    <div class="flex items-center gap-2">
      <Input
        :id="startId"
        type="date"
        class="flex-1 scheme-light"
        :value="modelValue.start ?? ''"
        :max="modelValue.end ?? undefined"
        :aria-label="$t('filters.selectStartDate')"
        :title="$t('filters.selectStartDate')"
        @input="update('start', $event)"
      />

      <span class="text-gray-500 shrink-0">&ndash;</span>

      <Input
        :id="endId"
        type="date"
        class="flex-1 scheme-light"
        :value="modelValue.end ?? ''"
        :min="modelValue.start ?? undefined"
        :aria-label="$t('filters.selectEndDate')"
        :title="$t('filters.selectEndDate')"
        @input="update('end', $event)"
      />
    </div>

    <p v-if="isInverted" class="text-xs text-red-600">
      {{ $t('filters.invalidDateRange') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { DateRange } from '~/types/filters'

interface Props {
  modelValue: DateRange
  label?: string
  id?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
}>()

const startId = computed(() => `${props.id || 'date-range'}-start`)
const endId = computed(() => `${props.id || 'date-range'}-end`)

// min/max only constrain the picker; a typed date can still invert the range.
const isInverted = computed(() => {
  const { start, end } = props.modelValue
  return !!start && !!end && start > end
})

const update = (key: keyof DateRange, event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, [key]: value || null })
}
</script>
