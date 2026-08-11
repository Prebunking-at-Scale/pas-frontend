<template>
  <div class="space-y-2">
    <Label>{{ label || $t('narratives.spreadPattern') }}</Label>
    <TooltipProvider :delay-duration="150">
      <div class="flex flex-wrap md:flex-nowrap gap-2">
        <Tooltip v-for="pattern in PATTERNS" :key="pattern">
          <TooltipTrigger as-child>
            <button
              type="button"
              :aria-pressed="modelValue.includes(pattern)"
              class="rounded-full transition focus:outline-none cursor-pointer"
              :class="modelValue.includes(pattern)
                ? ''
                : 'opacity-45 hover:opacity-100'"
              @click="toggle(pattern, !modelValue.includes(pattern))"
            >
              <SpreadPatternBadge :pattern="pattern" />
            </button>
          </TooltipTrigger>
          <TooltipContent :class="SPREAD_PATTERN_FILL[pattern]">
            {{ $t(`narratives.spreadPatternDescriptions.${pattern}`) }}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Label } from '~/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import SpreadPatternBadge from '~/components/SpreadPatternBadge.vue';
import type { NarrativeSpreadPattern } from '~/types/api';
import { SPREAD_PATTERN_FILL, SPREAD_PATTERN_ORDER } from '~/utils/spreadPatterns';

interface Props {
  modelValue: NarrativeSpreadPattern[];
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: NarrativeSpreadPattern[]];
}>();

// The unbadged region is not offered as a filter: it is an absence rather than a pattern,
// and it covers most of the corpus, so selecting it would say almost nothing.
const PATTERNS = SPREAD_PATTERN_ORDER;

const toggle = (pattern: NarrativeSpreadPattern, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, pattern]
    : props.modelValue.filter((l) => l !== pattern);
  emit('update:modelValue', next);
};
</script>
