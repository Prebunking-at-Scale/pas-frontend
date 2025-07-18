<template>
  <div class="space-y-2">
    <Label>{{ label || $t('filters.platform') }}</Label>
    
    <div v-if="type === 'select'">
      <Select :model-value="modelValue as string" @update:model-value="$emit('update:modelValue', $event)">
        <SelectTrigger>
          <SelectValue :placeholder="placeholder || $t('filters.allPlatforms')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('filters.allPlatforms') }}</SelectItem>
          <SelectItem v-for="platform in platforms" :key="platform.value" :value="platform.value">
            {{ platform.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div v-else class="space-y-2">
      <div v-for="platform in platforms" :key="platform.value" class="flex items-center space-x-2">
        <Checkbox
          :id="`platform-${platform.value}`"
          :checked="(modelValue as string[]).includes(platform.value)"
          @update:checked="handleCheckboxChange(platform.value, $event)"
        />
        <Label :for="`platform-${platform.value}`" class="text-sm font-normal cursor-pointer">
          {{ platform.label }}
        </Label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface Platform {
  value: string
  label: string
}

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

const platforms: Platform[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' }
]

const handleCheckboxChange = (platform: string, checked: boolean) => {
  if (props.type !== 'checkbox') return
  
  const currentValue = props.modelValue as string[] || []
  let newValue: string[]
  
  if (checked) {
    newValue = [...currentValue, platform]
  } else {
    newValue = currentValue.filter(p => p !== platform)
  }
  
  emit('update:modelValue', newValue)
}
</script>