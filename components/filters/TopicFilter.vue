<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.topic') }}</Label>
    <Select :id="id" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <SelectTrigger>
        <SelectValue :placeholder="placeholder || $t('filters.allTopics')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ $t('filters.allTopics') }}</SelectItem>
        <SelectItem v-for="topic in topics" :key="topic.id" :value="topic.id">
          {{ topic.topic }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTopicsStore } from '@/stores/topics'

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  id?: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const topicsStore = useTopicsStore()
const topics = computed(() => topicsStore.topics)
</script>