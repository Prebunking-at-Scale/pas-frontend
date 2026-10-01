<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="rounded-sm p-0.5 text-gray-400 hover:text-emerald-800 cursor-pointer data-[state=open]:text-emerald-800"
        :aria-label="$t('savedSelections.title')"
        :title="$t('savedSelections.title')"
        @pointerdown.stop
        @mousedown.stop
        @click.stop
      >
        <Bookmark class="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <!-- Floating: the lists cover the filters below instead of pushing them down -->
    <PopoverContent class="w-72 p-1 text-sm" align="end" @click.stop @pointerdown.stop>
      <p class="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {{ $t('savedSelections.title') }}
      </p>

      <p v-if="selections.length === 0" class="px-2 py-1.5 text-xs text-gray-500">{{ $t('savedSelections.empty') }}</p>

      <ul v-else class="max-h-56 overflow-y-auto">
        <li v-for="selection in selections" :key="selection.id" class="group flex items-center gap-1">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent cursor-pointer"
            :title="selection.values.join(', ')"
            @click="emit('load', [...selection.values])"
          >
            <Check class="h-4 w-4 shrink-0" :class="isCurrent(selection.values) ? 'opacity-100' : 'opacity-0'" />
            <span class="truncate">{{ selection.name }}</span>
            <Building2
              v-if="selection.is_default"
              class="h-3.5 w-3.5 shrink-0 text-gray-400"
              :aria-label="$t('savedSelections.organizationDefault')"
            />
            <span class="ml-auto shrink-0 text-xs text-gray-500">
              {{ $t(`savedSelections.count.${kind}`, { count: selection.values.length }, selection.values.length) }}
            </span>
          </button>
          <button
            v-if="!selection.is_default"
            type="button"
            class="rounded-sm p-1 text-gray-400 opacity-0 hover:text-red-700 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
            :aria-label="$t('savedSelections.delete', { name: selection.name })"
            @click="remove(selection.id)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </li>
      </ul>

      <!-- Saving the current selection, at the bottom: a name is suggested -->
      <form v-if="naming" class="space-y-1.5 border-t px-1 pb-1 pt-2" @submit.prevent="submit">
        <Input
          ref="nameInput"
          v-model="name"
          :maxlength="SAVED_SELECTION_NAME_MAX"
          :placeholder="$t('savedSelections.namePlaceholder')"
          :aria-label="$t('savedSelections.namePlaceholder')"
          class="h-8"
          @keydown.esc.stop="naming = false"
        />
        <p v-if="error" role="alert" class="text-xs text-red-700">{{ $t(`savedSelections.errors.${error}`) }}</p>
        <div class="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" class="h-7 cursor-pointer" @click="naming = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button type="submit" size="sm" class="h-7 cursor-pointer" :disabled="!name.trim() || busy">
            {{ $t('savedSelections.confirm') }}
          </Button>
        </div>
      </form>
      <button
        v-else
        type="button"
        class="mt-0.5 flex w-full items-center gap-2 rounded-sm border-t px-2 py-1.5 text-left text-emerald-800 hover:bg-accent disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent cursor-pointer"
        :disabled="modelValue.length === 0"
        :title="modelValue.length === 0 ? $t('savedSelections.nothingToSave') : undefined"
        @click="startNaming"
      >
        <BookmarkPlus class="h-4 w-4" />
        {{ $t('savedSelections.save') }}
      </button>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
// The saved selections of a filter (docs/filters.md, "Saved selections"), behind the
// bookmark at the end of the filter's box: load one in a click, or save what's in the
// filter under a name. It floats over the filters below, and opening it doesn't touch
// the filter itself (its options list, or the channels' Ours/All switch).
import { Bookmark, BookmarkPlus, Building2, Check, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { SAVED_SELECTION_NAME_MAX } from '~/utils/savedSelections'
import { keywordKey } from '~/utils/keywords'
import type { SavedSelectionError, SavedSelectionKind } from '~/utils/savedSelections'

interface Props {
  kind: SavedSelectionKind
  /** The filter's current values: what "save" saves. */
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ load: [values: string[]] }>()

const { selections, load, save, remove } = useSavedSelections(props.kind)

const open = ref(false)
const naming = ref(false)
const name = ref('')
const busy = ref(false)
const error = ref<SavedSelectionError | 'save_failed' | null>(null)
const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(load)

watch(open, (isOpen) => {
  if (isOpen) load() // does nothing once loaded; retries after a failed first load
  else naming.value = false
})

// Ticked when all of the selection is in the filter, whatever else was added.
const isCurrent = (values: string[]) => {
  const key = props.kind === 'keyword' ? keywordKey : (value: string) => value
  const current = new Set(props.modelValue.map(key))
  return values.every(v => current.has(key(v)))
}

const { t } = useI18n()

/** "List #1", or the first number that isn't taken. */
const suggestedName = () => {
  const taken = new Set(selections.value.map(s => s.name.toLowerCase()))
  for (let n = 1; ; n++) {
    const candidate = t('savedSelections.defaultName', { number: n })
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}

const startNaming = () => {
  naming.value = true
  name.value = suggestedName()
  error.value = null
  nextTick(() => {
    nameInput.value?.$el?.focus()
    nameInput.value?.$el?.select()
  })
}

const submit = async () => {
  busy.value = true
  error.value = await save(name.value, props.modelValue)
  busy.value = false
  if (!error.value) naming.value = false
}
</script>
