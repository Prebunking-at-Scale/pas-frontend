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
          <TooltipContent :class="TOOLTIP_BG[level]">
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
import { NarrativeAlertLevel } from '~/types/api';

interface Props {
  modelValue: NarrativeAlertLevel[];
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: NarrativeAlertLevel[]];
}>();

// "none" is excluded on purpose — it's the default state, so filtering on it
// would just show every narrative without an alert (rarely useful).
const LEVELS: NarrativeAlertLevel[] = [
  NarrativeAlertLevel.VIRAL,
  NarrativeAlertLevel.ALERT,
  NarrativeAlertLevel.EARLY_SURGE,
  NarrativeAlertLevel.WATCH,
];

// Tooltip tinted to each level's alert colour (mirrors the badge variants).
const TOOLTIP_BG: Record<string, string> = {
  [NarrativeAlertLevel.VIRAL]: 'bg-red-600 text-white',
  [NarrativeAlertLevel.ALERT]: 'bg-yellow-500 text-white',
  [NarrativeAlertLevel.EARLY_SURGE]: 'bg-orange-500 text-white',
  [NarrativeAlertLevel.WATCH]: 'bg-gray-500 text-white',
};

const toggle = (level: NarrativeAlertLevel, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, level]
    : props.modelValue.filter((l) => l !== level);
  emit('update:modelValue', next);
};
</script>
