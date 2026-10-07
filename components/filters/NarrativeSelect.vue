<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full min-w-0 justify-between font-normal"
      >
        <span :class="cn('truncate', !modelValue && 'text-muted-foreground')">
          {{ modelValue ? (titles[modelValue] ?? '…') : placeholder }}
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) min-w-80 p-0" align="start">
      <Command>
        <CommandInput :placeholder="$t('alertRules.fields.narrativeSearch')" @input="onInput(($event.target as HTMLInputElement).value)" />
        <CommandList>
          <CommandEmpty>
            {{ query.trim().length < MIN_CHARS ? $t('alertRules.fields.narrativeTypeToSearch') : $t('search.noOptions') }}
          </CommandEmpty>
          <!-- The text in the title first; then narratives with it only in their claims -->
          <CommandGroup
            v-for="group in groups"
            :key="group.matched_in"
            :heading="$t(`alertRules.fields.narrativeMatchedIn.${group.matched_in}`)"
          >
            <CommandItem
              v-for="narrative in group.items"
              :key="narrative.id"
              :value="narrative.title"
              @select.prevent="pick(narrative.id)"
            >
              <Check :class="cn('h-4 w-4 shrink-0', modelValue === narrative.id ? 'opacity-100' : 'opacity-0')" />
              <MessageSquareQuote v-if="group.matched_in === 'claims'" class="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span :class="cn('min-w-0 flex-1 truncate', group.matched_in === 'claims' && 'text-gray-600')">{{ narrative.title }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
// One narrative out of tens of thousands, searched in core-api as you type: the
// narrative a "Belongs to this narrative" condition follows. Narratives with the text in
// their title come first; those with it only in one of their claims are listed apart and
// marked. The chosen one's title is fetched when only its id is known.
import { Check, ChevronsUpDown, MessageSquareQuote } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { apiService } from '~/services/api'
import { alertsService } from '~/services/alerts'
import type { NarrativeOption } from '~/services/alerts'

const props = withDefaults(defineProps<{ modelValue: string | null; placeholder: string; id?: string }>(), { id: undefined })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const MIN_CHARS = 2
const open = ref(false)
const query = ref('')
const results = ref<NarrativeOption[]>([])
const groups = computed(() => (['title', 'claims'] as const)
  .map(matched_in => ({ matched_in, items: results.value.filter(n => n.matched_in === matched_in) }))
  .filter(group => group.items.length > 0))
const titles = useState<Record<string, string>>('alerts:narrativeTitles', () => ({}))

let timer: ReturnType<typeof setTimeout> | undefined
const onInput = (text: string) => {
  query.value = text
  clearTimeout(timer)
  if (text.trim().length < MIN_CHARS) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    try {
      results.value = await alertsService.narrativesMatching(text.trim())
      titles.value = { ...titles.value, ...Object.fromEntries(results.value.map(n => [n.id, n.title])) }
    } catch (error) {
      console.error('Failed to search narratives:', error)
    }
  }, 250)
}

const pick = (id: string) => {
  emit('update:modelValue', id)
  open.value = false
}

watch(() => props.modelValue, async (id) => {
  if (!id || titles.value[id]) return
  try {
    const narrative = await apiService.getNarrative(id)
    titles.value = { ...titles.value, [id]: narrative.title }
  } catch {
    // Deleted narratives keep their id: the condition just never matches again
    titles.value = { ...titles.value, [id]: id }
  }
}, { immediate: true })
</script>
