<template>
  <div class="space-y-2">
    <Label>{{ label || $t('filters.created') }}</Label>
    <Select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event as Timeframe)">
      <SelectTrigger>
        <SelectValue :placeholder="$t('timeframes.select')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="value in TIMEFRAMES" :key="value" :value="value">
          {{ $t(`timeframes.${value}`) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { TIMEFRAMES, type Timeframe } from '~/utils/timeframes';

defineProps<{
  modelValue: Timeframe;
  label?: string;
}>();

defineEmits<{
  'update:modelValue': [value: Timeframe];
}>();
</script>
