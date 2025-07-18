<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.keywords') }}</Label>
    <div class="space-y-2">
      <Input
        :id="id"
        type="text"
        v-model="newKeyword"
        @keydown.enter.prevent="addKeyword"
        :placeholder="placeholder || $t('filters.keywordsPlaceholder')"
      />
      <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2">
        <Badge
          v-for="(keyword, index) in modelValue"
          :key="index"
          variant="secondary"
          class="cursor-pointer"
          @click="removeKeyword(index)"
        >
          {{ keyword }}
          <X class="w-3 h-3 ml-1" />
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-vue-next'

interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
  id?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const newKeyword = ref('')

const addKeyword = () => {
  if (newKeyword.value.trim() && !props.modelValue.includes(newKeyword.value.trim())) {
    emit('update:modelValue', [...props.modelValue, newKeyword.value.trim()])
    newKeyword.value = ''
  }
}

const removeKeyword = (index: number) => {
  const newKeywords = [...props.modelValue]
  newKeywords.splice(index, 1)
  emit('update:modelValue', newKeywords)
}
</script>