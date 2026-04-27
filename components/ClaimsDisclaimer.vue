<template>
  <div class="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
    <Info class="mt-0.5 h-4 w-4 flex-none text-blue-600" />
    <p class="leading-relaxed">
      {{ $t('claims.disclaimer') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next';
</script>
