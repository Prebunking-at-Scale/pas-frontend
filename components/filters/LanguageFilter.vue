<template>
  <div class="space-y-2">
    <Label>{{ label || $t('filters.language') }}</Label>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex items-center gap-2 text-sm text-gray-500">
      <Icon name="lucide:loader-2" class="animate-spin w-4 h-4" />
      Loading languages...
    </div>
    
    <div v-else-if="type === 'select'" class="space-y-1">
      <Select :model-value="modelValue as string" @update:model-value="$emit('update:modelValue', $event)">
        <SelectTrigger>
          <SelectValue :placeholder="placeholder || $t('filters.allLanguages')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="language in languages" :key="language.value" :value="language.value">
            {{ language.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div v-else class="space-y-2 max-h-60 overflow-y-auto">
      <div v-for="language in languages" :key="language.value" class="flex items-center space-x-2">
        <Checkbox
          :id="`language-${language.value}`"
          :checked="(modelValue as string[]).includes(language.value)"
          @update:checked="handleCheckboxChange(language.value, $event)"
        />
        <Label :for="`language-${language.value}`" class="text-sm font-normal cursor-pointer">
          {{ language.label }}
        </Label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '#components'

interface Props {
  modelValue?: string | string[]
  type?: 'select' | 'checkbox'
  label?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'select'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const {
  languages,
  isLoading,
} = useLanguages({
  includeAllOption: true
})

const handleCheckboxChange = (language: string, checked: boolean) => {
  if (props.type !== 'checkbox') return
  
  const currentValue = props.modelValue as string[] || []
  let newValue: string[]
  
  if (checked) {
    newValue = [...currentValue, language]
  } else {
    newValue = currentValue.filter(l => l !== language)
  }
  
  emit('update:modelValue', newValue)
}
</script>