<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.channel') }}</Label>
    
    <div v-if="type === 'select' && channels.length > 0">
      <Select :model-value="modelValue || ''" @update:model-value="(value) => $emit('update:modelValue', String(value || ''))">
        <SelectTrigger>
          <SelectValue :placeholder="placeholder || $t('filters.allChannels')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('filters.allChannels') }}</SelectItem>
          <SelectItem v-for="channel in channels" :key="channel" :value="channel">
            {{ channel }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div v-else>
      <Input
        :id="id"
        type="text"
        v-model="localValue"
        @keydown.enter="$emit('enter-pressed')"
        :placeholder="placeholder || $t('filters.channelPlaceholder')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  modelValue?: string
  type?: 'select' | 'input'
  channels?: string[]
  label?: string
  placeholder?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'input',
  channels: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'enter-pressed': []
}>()

// Local value for the input
const localValue = ref(props.modelValue || '')

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue || ''
})

// Watch for local changes and emit
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>