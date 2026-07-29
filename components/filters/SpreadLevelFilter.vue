<template>
  <div class="space-y-2">
    <Label>{{ label || $t('narratives.spreadLevel') }}</Label>
    <TooltipProvider :delay-duration="150">
      <div class="flex flex-wrap md:flex-nowrap gap-2">
        <Tooltip v-for="level in LEVELS" :key="level">
          <TooltipTrigger as-child>
            <button
              type="button"
              :aria-pressed="modelValue.includes(level)"
              class="rounded-full transition focus:outline-none cursor-pointer"
              :class="modelValue.includes(level)
                ? ''
                : 'opacity-45 hover:opacity-100'"
              @click="toggle(level, !modelValue.includes(level))"
            >
              <SpreadLevelBadge :level="level" />
            </button>
          </TooltipTrigger>
          <TooltipContent :class="SPREAD_LEVEL_FILL[level]">
            {{ $t(`narratives.spreadLevelDescriptions.${level}`) }}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Label } from '~/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import SpreadLevelBadge from '~/components/SpreadLevelBadge.vue';
import type { NarrativeSpreadLevel } from '~/types/api';
import { SPREAD_LEVEL_FILL, SPREAD_LEVEL_ORDER } from '~/utils/spreadLevels';

interface Props {
  modelValue: NarrativeSpreadLevel[];
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: NarrativeSpreadLevel[]];
}>();

// The unbadged region is not offered as a filter: it is an absence rather than a level,
// and it covers most of the corpus, so selecting it would say almost nothing.
const LEVELS = SPREAD_LEVEL_ORDER;

const toggle = (level: NarrativeSpreadLevel, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, level]
    : props.modelValue.filter((l) => l !== level);
  emit('update:modelValue', next);
};
</script>
