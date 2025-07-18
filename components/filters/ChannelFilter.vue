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
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder || $t('filters.channelPlaceholder')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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

withDefaults(defineProps<Props>(), {
  type: 'input',
  channels: () => []
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>