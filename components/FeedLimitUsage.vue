<template>
  <p class="mt-1 text-sm" :class="reached ? 'text-red-600' : 'text-gray-500'">
    {{ $t('channels.limitUsage', { count, limit }) }}
    <span v-if="reached">· {{ $t('channels.limitReached') }}</span>
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number;
  limit: number;
}>();

const reached = computed(() => props.count >= props.limit);
</script>
