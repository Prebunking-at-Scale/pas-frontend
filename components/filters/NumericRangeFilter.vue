<template>
  <div class="space-y-2">
    <Label>{{ label || $t('filters.range') }}</Label>

    <div class="grid grid-cols-2 gap-3">
      <div class="md:flex gap-2">
        <Label class="text-xs text-gray-500">{{ $t('filters.min') }}</Label>
        <Input
          v-model="localMin"
          type="number"
          :min="min"
          :max="max"
          :step="step"
          :placeholder="minPlaceholder || $t('filters.min')"
        />
      </div>

      <div class="md:flex gap-2">
        <Label class="text-xs text-gray-500">{{ $t('filters.max') }}</Label>
        <Input
          v-model="localMax"
          type="number"
          :min="min"
          :max="max"
          :step="step"
          :placeholder="maxPlaceholder || $t('filters.max')"
        />
      </div>
    </div>

    <p v-if="isRangeInvalid" class="text-xs text-red-600">
      {{ $t('filters.invalidRange') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  modelValue: string[]
  min?: number
  max?: number
  step?: number
  label?: string
  minPlaceholder?: string
  maxPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const localMin = ref(String(props.modelValue?.[0] ?? props.min))
const localMax = ref(String(props.modelValue?.[1] ?? props.max))

const parsedMin = computed(() => Number(localMin.value))
const parsedMax = computed(() => Number(localMax.value))

const hasValidNumbers = computed(() => {
  if (localMin.value === '' || localMax.value === '') return false
  return !Number.isNaN(parsedMin.value) && !Number.isNaN(parsedMax.value)
})

const isRangeInvalid = computed(() => {
  if (!hasValidNumbers.value) return false
  return parsedMin.value > parsedMax.value
})

// Watch localMin and localMax to emit changes when valid
watch([localMin, localMax], () => {
  if (!hasValidNumbers.value || isRangeInvalid.value) return
  emit('update:modelValue', [localMin.value, localMax.value])
})

// Watch props to update local state when parent changes
watch(() => props.modelValue, (newValue) => {
  const newMin = String(newValue?.[0] ?? props.min)
  const newMax = String(newValue?.[1] ?? props.max)
  
  if (Number(newMin) !== Number(localMin.value)) {
    localMin.value = newMin
  }
  if (Number(newMax) !== Number(localMax.value)) {
    localMax.value = newMax
  }
})
</script>