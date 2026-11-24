<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { organizationLanguageOptionsFor } from '~/utils/organizationLanguages';

const props = defineProps<{
  modelValue?: string;
  id?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// Every language this select has shown. A language that is not in the standard
// list stays on offer after another one is picked, so it can be picked again.
const held = ref<string[]>([]);
watch(() => props.modelValue, (language) => {
  if (language && !held.value.includes(language)) {
    held.value.push(language);
  }
}, { immediate: true });

const options = computed(() => organizationLanguageOptionsFor(...held.value));
</script>

<template>
  <!--
    Inside a form, Select also renders a hidden native select after its trigger.
    The wrapper keeps the two together as one element, so spacing a parent applies
    between its children (space-y, for example) does not land under the trigger.
  -->
  <div>
    <Select
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', String($event))"
    >
      <SelectTrigger :id="id" class="w-full">
        <SelectValue :placeholder="$t('common.selectLanguage')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
