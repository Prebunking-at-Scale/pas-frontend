<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.search') }}</Label>
    <Input
      :id="id"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder || $t('filters.searchPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  id?: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>