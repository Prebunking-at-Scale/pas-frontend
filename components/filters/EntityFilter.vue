<template>
  <div class="space-y-2">
    <Label :for="id">{{ label || $t('filters.entity') }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          :id="id"
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
        >
          <span :class="cn('truncate', !selectedEntity && 'text-muted-foreground')">
            {{ selectedEntity ? selectedEntity.name : (placeholder || $t('filters.selectEntity')) }}
          </span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full p-0" align="start">
        <Command>
          <CommandInput 
            :placeholder="$t('filters.searchEntity')" 
            v-model="searchQuery"
            @update:model-value="debouncedSearch"
          />
          <CommandEmpty>{{ $t('filters.noEntityFound') }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value="all"
              @select="selectEntity(null)"
            >
              <Check
                :class="cn(
                  'mr-2 h-4 w-4',
                  !modelValue ? 'opacity-100' : 'opacity-0'
                )"
              />
              {{ $t('filters.allEntities') }}
            </CommandItem>
            <CommandItem
              v-for="entity in entities"
              :key="entity.id"
              :value="entity.id"
              @select="selectEntity(entity)"
            >
              <Check
                :class="cn(
                  'mr-2 h-4 w-4',
                  modelValue === entity.id ? 'opacity-100' : 'opacity-0'
                )"
              />
              <div class="flex items-center space-x-2 flex-1">
                <img 
                  v-if="getEntityImage(entity)" 
                  :src="getEntityImage(entity)" 
                  :alt="entity.name"
                  class="w-6 h-6 rounded-full object-cover"
                  @error="(e) => e.target.style.display = 'none'"
                >
                <div v-else class="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
                  <span class="text-xs text-gray-500">{{ entity.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="truncate">{{ entity.name }}</p>
                  <p v-if="getEntityDescription(entity)" class="text-xs text-gray-500 truncate">
                    {{ getEntityDescription(entity) }}
                  </p>
                </div>
              </div>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { apiService } from '~/services/api'
import type { Entity } from '~/types/api'
import { getEntityImage, getEntityDescription } from '~/utils/entityHelpers'
import { useDebounceFn } from '@vueuse/core'

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  id?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const open = ref(false)
const searchQuery = ref('')
const entities = ref<Entity[]>([])
const loading = ref(false)
const selectedEntity = ref<Entity | null>(null)

// Load initial entities
const loadEntities = async (search?: string) => {
  loading.value = true
  try {
    const params: any = { limit: 20 }
    if (search && search.trim()) {
      params.text = search.trim()
    }
    const result = await apiService.getEntities(params)
    entities.value = result.data
  } catch (error) {
    console.error('Failed to load entities:', error)
    entities.value = []
  } finally {
    loading.value = false
  }
}

// Debounced search function
const debouncedSearch = useDebounceFn((value: string) => {
  loadEntities(value)
}, 300)

// Select an entity
const selectEntity = (entity: Entity | null) => {
  selectedEntity.value = entity
  emit('update:modelValue', entity?.id || null)
  open.value = false
  searchQuery.value = ''
}

// Watch for external changes to modelValue
watch(() => props.modelValue, async (newValue) => {
  if (newValue && !selectedEntity.value?.id) {
    // If a value is set externally and we don't have the entity loaded, fetch it
    try {
      const entity = await apiService.getEntity(newValue)
      selectedEntity.value = entity
    } catch (error) {
      console.error('Failed to load selected entity:', error)
    }
  } else if (!newValue) {
    selectedEntity.value = null
  }
}, { immediate: true })

// Load initial entities when component mounts
onMounted(() => {
  loadEntities()
})
</script>