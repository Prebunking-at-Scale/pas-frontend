<template>
  <div class="filter-card-container mb-8">
    <Card class="shadow-sm m-0 p-0 rounded">
      <CardHeader v-if="title" class="pb-0 bg-stone-200 flex py-2 items-center justify-between">
        <CardTitle class="text-lg flex items-center">{{ title }}</CardTitle>
          <div v-if="showActiveFilters && hasActiveFilters" class="">
            <Button @click="$emit('clear-filters')" variant="ghost" size="sm" class="text-emerald-800 hover:text-emerald-900 cursor-pointer">
              <X class="w-4 h-4 mr-1" />
              {{ $t('filters.clearAll') }}
            </Button>
        </div>
      </CardHeader>
      
      <CardContent :class="{ 'pt-6': !title }">
        <div :class="gridClass">
          <slot />
        </div>
      </CardContent>
      
      <CardFooter v-if="showActions" class="flex justify-end gap-2 pt-4 pb-4 border-t">
        <Button v-if="showClearButton" @click="$emit('clear-filters')" variant="outline" size="sm">
          {{ $t('filters.clear') }}
        </Button>
        <Button @click="$emit('apply-filters')" variant="default" size="sm">
          {{ $t('filters.apply') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'

interface Props {
  title?: string
  columns?: number | { default?: number; sm?: number; md?: number; lg?: number }
  showActions?: boolean
  showClearButton?: boolean
  showActiveFilters?: boolean
  hasActiveFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 1,
  showActions: true,
  showClearButton: true,
  showActiveFilters: true,
  hasActiveFilters: false
})

defineEmits<{
  'apply-filters': []
  'clear-filters': []
}>()

const gridClass = computed(() => {
  if (typeof props.columns === 'number') {
    return `grid grid-cols-1 gap-4 ${props.columns > 1 ? `lg:grid-cols-${props.columns}` : ''}`
  }
  
  const classes = ['grid', 'gap-4']
  
  if (props.columns.default) {
    classes.push(`grid-cols-${props.columns.default}`)
  } else {
    classes.push('grid-cols-1')
  }
  
  if (props.columns.sm) {
    classes.push(`sm:grid-cols-${props.columns.sm}`)
  }
  
  if (props.columns.md) {
    classes.push(`md:grid-cols-${props.columns.md}`)
  }
  
  if (props.columns.lg) {
    classes.push(`lg:grid-cols-${props.columns.lg}`)
  }
  
  return classes.join(' ')
})
</script>