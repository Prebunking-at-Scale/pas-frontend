<template>
  <span 
    class="inline-flex items-center justify-center text-xs"
  >
    <font-awesome :icon="platformIcon" class="text-sm" :class="platformClass" />
  </span>
</template>

<script setup lang="ts">
import { faYoutube, faTiktok, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { computed } from 'vue';

interface Props {
  platform: 'youtube' | 'tiktok' | 'instagram';
}

const props = defineProps<Props>();

const platformIcon = computed(() => {
  switch (props.platform) {
    case 'youtube':
      return faYoutube;
    case 'tiktok':
      return faTiktok;
    case 'instagram':
      return faInstagram;
    default:
      return faYoutube;
  }
});

const platformClass = computed(() => {
  switch (props.platform) {
    case 'youtube':
      return 'text-red-600';
    case 'tiktok':
      return 'text-stone-900';
    case 'instagram':
      return 'text-pink-600';
    default:
      return 'text-stone-500';
  }
});
</script>