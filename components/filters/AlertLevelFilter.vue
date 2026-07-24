<template>
  <div class="space-y-2">
    <Label>{{ label || $t('narratives.alertLevel') }}</Label>
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
              <AlertLevelBadge :level="level" />
            </button>
          </TooltipTrigger>
          <TooltipContent :class="ALERT_LEVEL_FILL[level]">
            {{ $t(`narratives.alertLevelDescriptions.${level}`) }}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Label } from '~/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import AlertLevelBadge from '~/components/AlertLevelBadge.vue';
import type { NarrativeAlertLevel } from '~/types/api';
import { ALERT_LEVEL_FILL, ALERT_LEVEL_ORDER } from '~/utils/alertLevels';

interface Props {
  modelValue: NarrativeAlertLevel[];
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: NarrativeAlertLevel[]];
}>();

// The unbadged region is not offered as a filter: it is an absence rather than a level,
// and it covers most of the corpus, so selecting it would say almost nothing.
const LEVELS = ALERT_LEVEL_ORDER;

const toggle = (level: NarrativeAlertLevel, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, level]
    : props.modelValue.filter((l) => l !== level);
  emit('update:modelValue', next);
};
</script>
