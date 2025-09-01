<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <Label>{{ label || $t('filters.range') }}</Label>
      <span class="text-sm text-gray-600">
        {{ modelValue[0] }} - {{ modelValue[1] }}
      </span>
    </div>
    
    <div class="px-2">
      <Slider
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :minStepsBetweenThumbs="minStepsBetweenThumbs"
        @update:model-value="handleUpdate"
        class="w-full"
      />
    </div>
    
    <div class="flex justify-between text-xs text-gray-500">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface Props {
  modelValue: number[]
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 5,
  step: 0.1,
  minStepsBetweenThumbs: 0.1
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const handleUpdate = (value: number[]) => {
  emit('update:modelValue', value)
}
</script>