<template>
  <div class="space-y-2">
    <Label v-if="label">{{ label }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
        >
          {{ selectedNarrative?.title || placeholder || $t('narratives.selectNarrative') }}
          <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full p-0" align="start">
        <div class="flex items-center border-b px-3 pb-2 pt-3">
          <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            v-model="searchQuery"
            @update:model-value="() => handleSearch(searchQuery)"
            :placeholder="$t('narratives.searchNarrative')"
            class="h-8 border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div class="max-h-[300px] overflow-y-auto">
          <div v-if="loading" class="py-6 text-center text-sm">
            <Loader2 class="h-4 w-4 animate-spin mx-auto mb-2" />
            {{ $t('common.loading') }}
          </div>
          <div v-else-if="filteredNarratives.length === 0" class="py-6 text-center text-sm">
            {{ $t('narratives.noNarrativesFound') }}
          </div>
          <div
            v-for="narrative in filteredNarratives"
            :key="narrative.id"
            @click="selectNarrative(narrative)"
            class="cursor-pointer px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            :class="{
              'bg-accent text-accent-foreground': modelValue === narrative
            }"
          >
            <div class="flex items-center">
              <Check
                class="mr-2 h-4 w-4"
                :class="modelValue === narrative ? 'opacity-100' : 'opacity-0'"
              />
              {{ narrative.title }}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronDown, Search, Loader2 } from 'lucide-vue-next'
import type { Narrative } from '~/types/api'

interface Props {
  modelValue?: Narrative | null
  narratives: Narrative[]
  label?: string
  placeholder?: string
  loading?: boolean
  debounceTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  debounceTime: 600,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Narrative | null]
  'search': [query: string]
}>()

const open = ref(false)
const searchQuery = ref('')
const debounceTimer = ref<NodeJS.Timeout | null>(null)

const filteredNarratives = computed(() => {
  if (!searchQuery.value) {
    return props.narratives
  }
  return props.narratives.filter((narrative) =>
    narrative.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectedNarrative = computed(() => {
  return props.narratives.find(n => n.id === props.modelValue?.id)
})

const selectNarrative = (narrative: Narrative) => {
  emit('update:modelValue', narrative)
  open.value = false
  searchQuery.value = ''
}

const handleSearch = (value: string) => {
  // Clear existing timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // Set new timer with debounce
  debounceTimer.value = setTimeout(() => {
    emit('search', value)
  }, props.debounceTime)
}

watch(open, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
    // Clear timer when closing
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
  } else {
    // Emit initial search when opening
    emit('search', '')
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
})
</script>