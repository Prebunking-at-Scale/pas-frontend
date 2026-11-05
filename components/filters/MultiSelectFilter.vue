<template>
  <div class="space-y-2">
    <div class="flex h-6 items-center justify-between gap-2">
      <Label :for="id">{{ label }}</Label>
      <slot name="label-extra" />
    </div>
    <div class="relative">
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
        <!-- Chips: each selected value shown, and removable, on its own -->
        <div
          v-if="chips"
          :id="id"
          role="combobox"
          tabindex="0"
          :aria-expanded="open"
          class="flex min-h-9 w-full min-w-0 items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @keydown.enter.prevent="open = true"
          @keydown.space.prevent="open = true"
        >
          <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <span v-if="modelValue.length === 0" class="px-1 text-muted-foreground">{{ placeholder }}</span>
            <span
              v-for="value in modelValue"
              :key="value"
              class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-gray-800"
            >
              <PlatformBadge v-if="platformFor(value)" :platform="platformFor(value)!" size="xs" />
              {{ labelOf(value) }}
              <button
                type="button"
                class="cursor-pointer text-gray-500 hover:text-gray-900"
                :aria-label="$t('filters.removeValue', { value: labelOf(value) })"
                @pointerdown.stop
                @click.stop="remove(value)"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-1 self-start py-1">
            <button
              v-if="modelValue.length > 0"
              type="button"
              class="rounded-sm p-0.5 text-gray-400 hover:text-gray-900 cursor-pointer"
              :aria-label="$t('filters.clear')"
              :title="$t('filters.clear')"
              @pointerdown.stop
              @click.stop="emit('update:modelValue', [])"
            >
              <X class="h-4 w-4" />
            </button>
            <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
            <SavedSelectionsMenu
              v-if="savedKind"
              :kind="savedKind"
              :model-value="modelValue"
              @load="loadSaved"
            />
          </span>
        </div>
        <Button
          v-else
          :id="id"
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full min-w-0 justify-between font-normal"
          :style="savedKind ? { paddingRight: '2.25rem' } : undefined"
        >
          <span :class="cn('truncate', modelValue.length === 0 && 'text-muted-foreground')">
            {{ summary }}
          </span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-72 p-0" align="start">
        <Command>
          <CommandInput
            v-if="searchable"
            :placeholder="searchPlaceholder || $t('filters.searchPlaceholder')"
            @input="emit('search', ($event.target as HTMLInputElement).value)"
          />
          <CommandList>
            <CommandEmpty>{{ emptyText || $t('search.noOptions') }}</CommandEmpty>
            <CommandGroup v-for="group in groups" :key="group.name" :heading="group.name || undefined">
              <CommandItem
                v-for="option in group.options"
                :key="option.value"
                :value="option.value"
                @select.prevent="toggle(option.value)"
              >
                <Check :class="cn('h-4 w-4', modelValue.includes(option.value) ? 'opacity-100' : 'opacity-0')" />
                <PlatformBadge v-if="platformFor(option.value)" :platform="platformFor(option.value)!" />
                <div class="flex-1 min-w-0">
                  <p class="truncate">{{ option.label }}</p>
                  <p v-if="option.hint" class="text-xs text-gray-500 truncate">{{ option.hint }}</p>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div v-if="modelValue.length > 0" class="border-t p-1">
          <Button variant="ghost" size="sm" class="w-full cursor-pointer" @click="emit('update:modelValue', [])">
            {{ $t('filters.clear') }}
          </Button>
        </div>
        </PopoverContent>
      </Popover>
      <!-- Without chips the trigger is a button, so the bookmark goes over its right end -->
      <div v-if="savedKind && !chips" class="absolute right-2 top-1/2 -translate-y-1/2">
        <SavedSelectionsMenu :kind="savedKind" :model-value="modelValue" @load="loadSaved" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// A filter that accepts several values (OR within the filter). Used by the Research page
// for topics, entities, languages, platforms and channels; for entities and channels
// the options are searched on the server with what's typed (the `search` event).
import { computed, ref } from 'vue'
import { Check, ChevronsUpDown, X } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import SavedSelectionsMenu from '~/components/filters/SavedSelectionsMenu.vue'
import PlatformBadge from '~/components/PlatformBadge.vue'
import type { SavedSelectionKind } from '~/utils/savedSelections'

type Platform = 'youtube' | 'tiktok' | 'instagram'

export interface MultiSelectOption {
  value: string
  label: string
  hint?: string
  /** Options sharing a group are listed together, under its name. */
  group?: string
}

interface Props {
  modelValue: string[]
  options: MultiSelectOption[]
  label: string
  placeholder: string
  searchable?: boolean
  searchPlaceholder?: string
  /** Offer the organization's saved selections of this kind, and saving the current one. */
  savedKind?: SavedSelectionKind
  /** Show each selected value as a removable chip instead of a one-line summary. */
  chips?: boolean
  /** A platform logo for a value (channels), shown in chips and options. */
  platformOf?: (value: string) => string | undefined
  /** Shown when the list is empty, e.g. "type to search" for options found on the server. */
  emptyText?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchable: false,
  searchPlaceholder: undefined,
  savedKind: undefined,
  chips: false,
  platformOf: undefined,
  emptyText: undefined,
  id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  /** What's typed in the search box: for options searched on the server. */
  search: [text: string]
}>()

const open = ref(false)
const { t } = useI18n()

const PLATFORMS: Platform[] = ['youtube', 'tiktok', 'instagram']
const platformFor = (value: string) => {
  const platform = props.platformOf?.(value) as Platform | undefined
  return platform && PLATFORMS.includes(platform) ? platform : undefined
}

// Options keep their order; a group's heading shows once, above its first option.
const groups = computed(() => {
  const out: { name: string; options: MultiSelectOption[] }[] = []
  for (const option of props.options) {
    const name = option.group ?? ''
    const last = out.at(-1)
    if (last && last.name === name) last.options.push(option)
    else out.push({ name, options: [option] })
  }
  return out
})

const labelOf = (value: string) => props.options.find(o => o.value === value)?.label ?? value

const remove = (value: string) => emit('update:modelValue', props.modelValue.filter(v => v !== value))

// Values without an option (e.g. channels outside the selected platforms, loaded from a
// saved selection) still count, shown as they are.
const summary = computed(() => {
  const selected = props.modelValue.map(value => props.options.find(o => o.value === value)?.label ?? value)
  if (selected.length === 0) return props.placeholder
  if (selected.length === 1) return selected[0]
  return t('search.selectedCount', { first: selected[0], count: selected.length - 1 })
})

// A saved selection adds to what's selected, like for keywords; the list stays open.
const loadSaved = (values: string[]) => {
  emit('update:modelValue', [...new Set([...props.modelValue, ...values])])
}

const toggle = (value: string) => {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]
  emit('update:modelValue', next)
}
</script>
