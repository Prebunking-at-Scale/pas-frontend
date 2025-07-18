<template>
  <div class="bg-white overflow-hidden shadow rounded-lg">
    <div class="flex items-center justify-between mb-4 px-4 py-3 sm:p-4" :class="headerClass">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        {{ title }}
      </h3>
      <span class="text-2xl font-bold" :class="countClass">{{ count }}</span>
    </div>
    <div class="px-4 py-5 sm:p-6">
      <div class="space-y-2">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  count: number | string;
  headerClass?: string;
  countClass?: string;
}

withDefaults(defineProps<Props>(), {
  headerClass: 'bg-stone-200',
  countClass: 'text-emerald-900 bg-stone-100 px-2 py-1 rounded-md'
});
</script>