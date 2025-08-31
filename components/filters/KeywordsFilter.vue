<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.keywords') }}</Label>
    <Input
      :id="id"
      type="text"
      v-model="localText"
      @keydown.enter="$emit('enter-pressed')"
      :placeholder="placeholder || $t('filters.keywordsPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
  id?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'enter-pressed': []
}>()

// Local text state for the input
const localText = ref(props.modelValue.join(' '))

// Watch for prop changes to update local text
watch(() => props.modelValue, (newValue) => {
  localText.value = newValue.join(' ')
})

// Update the model value when local text changes
watch(localText, (newValue) => {
  const trimmed = newValue.trim()
  const keywords = trimmed ? trimmed.split(/\s+/).filter(k => k.length > 0) : []
  emit('update:modelValue', keywords)
})
</script>