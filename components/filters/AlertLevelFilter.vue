<template>
  <div class="space-y-2">
    <Label>{{ label || $t('narratives.alertLevel') }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
        >
          <span class="truncate text-left">
            <template v-if="modelValue.length === 0">
              {{ placeholder || $t('narratives.allAlertLevels') }}
            </template>
            <template v-else>
              {{ $t('narratives.alertLevelsSelected', { count: modelValue.length }) }}
            </template>
          </span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[240px] p-2" align="start">
        <div class="space-y-2">
          <div
            v-for="level in LEVELS"
            :key="level"
            class="flex items-center space-x-2"
          >
            <Checkbox
              :id="`alert-level-${level}`"
              :model-value="modelValue.includes(level)"
              @update:model-value="(c: boolean | string) => toggle(level, c === true)"
            />
            <Label
              :for="`alert-level-${level}`"
              class="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
            >
              <AlertLevelBadge :level="level" />
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChevronsUpDown } from 'lucide-vue-next';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import AlertLevelBadge from '~/components/AlertLevelBadge.vue';
import { NarrativeAlertLevel } from '~/types/api';

interface Props {
  modelValue: NarrativeAlertLevel[];
  label?: string;
  placeholder?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: NarrativeAlertLevel[]];
}>();

const open = ref(false);

// "none" is excluded on purpose — it's the default state and filtering on it
// would essentially show every narrative without alerts (rarely useful and
// matches the un-checked default UX).
const LEVELS: NarrativeAlertLevel[] = [
  NarrativeAlertLevel.VIRAL,
  NarrativeAlertLevel.ALERT,
  NarrativeAlertLevel.EARLY_SURGE,
  NarrativeAlertLevel.WATCH,
];

const toggle = (level: NarrativeAlertLevel, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, level]
    : props.modelValue.filter((l) => l !== level);
  emit('update:modelValue', next);
};
</script>
