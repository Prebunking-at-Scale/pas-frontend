<template>
  <span 
    class="inline-flex items-center justify-center text-xs"
  >
    <font-awesome :icon="platformIcon" :class="[size === 'xs' ? 'text-[11px]' : 'text-sm', platformClass]" />
  </span>
</template>

<script setup lang="ts">
import { faYoutube, faTiktok, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { computed } from 'vue';

interface Props {
  platform: 'youtube' | 'tiktok' | 'instagram';
  /** xs: for chips and dense lists. */
  size?: 'sm' | 'xs';
}

const props = withDefaults(defineProps<Props>(), { size: 'sm' });

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