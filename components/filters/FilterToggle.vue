<template>
  <!-- h-6 matches the label row, so a filter with a toggle lines up with the rest -->
  <div
    role="radiogroup"
    :aria-label="groupLabel"
    class="inline-flex h-6 items-center rounded-full border border-input p-px text-[11px]"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :title="option.title"
      class="flex h-full items-center rounded-full px-2 leading-none transition-colors cursor-pointer"
      :class="modelValue === option.value ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-stone-100'"
      @click="option.value !== modelValue && emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// The two-way switch next to a filter's label (any/all keywords, ours/all channels).
// Kept as one component so every filter's box starts at the same height.
defineProps<{
  modelValue: string
  options: { value: string; label: string; title?: string }[]
  /** Names the pair of options for screen readers. */
  groupLabel: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
