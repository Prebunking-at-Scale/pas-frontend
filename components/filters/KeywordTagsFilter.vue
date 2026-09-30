<template>
  <div class="space-y-2">
    <div class="flex h-6 items-center justify-between gap-2">
      <Label :for="id">{{ label || $t('filters.keywords') }}</Label>
      <!-- Any / all: only meaningful, so only shown, with two keywords or more -->
      <FilterToggle
        v-if="mode !== undefined && modelValue.length > 1"
        :model-value="mode"
        :group-label="$t('search.keywordMode.label')"
        :options="modeOptions"
        @update:model-value="emit('update:mode', $event as 'any' | 'all')"
      />
    </div>
    <div
      class="flex flex-wrap items-center gap-1 min-h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring"
      @click="input?.focus()"
    >
      <span
        v-for="keyword in modelValue"
        :key="keyword"
        class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-gray-800"
      >
        {{ keyword }}
        <button
          type="button"
          class="cursor-pointer text-gray-500 hover:text-gray-900"
          :aria-label="$t('search.removeKeyword', { keyword })"
          @click.stop="remove(keyword)"
        >
          <X class="h-3 w-3" />
        </button>
      </span>
      <input
        :id="id"
        ref="input"
        v-model="draft"
        type="text"
        class="flex-1 min-w-24 bg-transparent text-sm outline-none py-1"
        :placeholder="modelValue.length === 0 ? (placeholder || $t('filters.keywordsPlaceholder')) : ''"
        @keydown.enter.prevent="onEnter"
        @keydown.backspace="onBackspace"
        @paste="onPaste"
        @blur="commit"
      >
      <span class="ml-auto flex shrink-0 items-center gap-1">
        <button
          v-if="modelValue.length > 0"
          type="button"
          class="rounded-sm p-0.5 text-gray-400 hover:text-gray-900 cursor-pointer"
          :aria-label="$t('search.clearKeywords')"
          :title="$t('search.clearKeywords')"
          @click.stop="emit('update:modelValue', [])"
        >
          <X class="h-4 w-4" />
        </button>
        <SavedSelectionsMenu
          v-if="savedKind"
          :kind="savedKind"
          :model-value="modelValue"
          @load="loadSaved"
        />
      </span>
    </div>
    <p v-if="hint !== false" class="text-xs text-gray-500">{{ hint ?? $t('search.keywordsHint') }}</p>
  </div>
</template>

<script setup lang="ts">
// Keywords as separate values: Enter adds the typed text as one keyword, phrases
// included ("climate change" stays one keyword), and pasting a list adds one keyword
// per line. Saved selections add to what's there, so they combine with typed keywords
// and with each other (docs/filters.md, "Keywords"). Unlike KeywordsFilter, which
// splits on spaces and is sent joined into a single `text` param.
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Label } from '~/components/ui/label'
import FilterToggle from '~/components/filters/FilterToggle.vue'
import SavedSelectionsMenu from '~/components/filters/SavedSelectionsMenu.vue'
import type { SavedSelectionKind } from '~/utils/savedSelections'
import { cleanKeyword, keywordsFromPaste, mergeKeywords } from '~/utils/keywords'

interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
  /** Offer the organization's saved keyword selections, and saving the current one. */
  savedKind?: SavedSelectionKind
  /** Help under the box; the keyword help by default, false for none. */
  hint?: string | false
  /** Any keyword or all of them (v-model:mode); no switch when not bound. */
  mode?: 'any' | 'all'
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  placeholder: undefined,
  savedKind: undefined,
  hint: undefined,
  mode: undefined,
  id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:mode': [value: 'any' | 'all']
  'enter-pressed': []
}>()

const { t } = useI18n()

const modeOptions = computed(() => (['any', 'all'] as const).map(value => ({
  value,
  label: t(`search.keywordMode.${value}`),
  title: t(`search.keywordMode.${value}Hint`),
})))

const input = ref<HTMLInputElement>()
const draft = ref('')

// A saved selection adds its keywords; the menu stays open to add another one.
const loadSaved = (values: string[]) => {
  emit('update:modelValue', mergeKeywords(props.modelValue, values))
  input.value?.focus()
}

/** Adds whatever is typed as a keyword. Returns false if there was nothing to add. */
const commit = () => {
  const keyword = cleanKeyword(draft.value)
  draft.value = ''
  if (!keyword) return false
  emit('update:modelValue', mergeKeywords(props.modelValue, [keyword]))
  return true
}

const onPaste = (event: ClipboardEvent) => {
  const keywords = keywordsFromPaste(event.clipboardData?.getData('text') ?? '')
  if (!keywords) return
  event.preventDefault()
  emit('update:modelValue', mergeKeywords(props.modelValue, keywords))
}

// Enter on an empty input applies the filters, like the other text filters do.
const onEnter = () => {
  if (!commit()) emit('enter-pressed')
}

const onBackspace = () => {
  if (draft.value === '' && props.modelValue.length > 0) {
    emit('update:modelValue', props.modelValue.slice(0, -1))
  }
}

const remove = (keyword: string) => {
  emit('update:modelValue', props.modelValue.filter(k => k !== keyword))
}

defineExpose({ commit })
</script>
