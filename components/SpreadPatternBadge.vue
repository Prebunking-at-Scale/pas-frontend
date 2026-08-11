<template>
  <Badge v-if="pattern" :variant="SPREAD_PATTERN_VARIANT[pattern]" class="capitalize">
    {{ $t(`narratives.spreadPatterns.${pattern}`) }}
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge';
import type { NarrativeSpreadPattern, RawNarrativeSpreadPattern } from '~/types/api';
import { SPREAD_PATTERN_VARIANT, normalizeSpreadPattern } from '~/utils/spreadPatterns';

interface Props {
  /**
   * Accepts whatever the API sent, retired values included. Anything that is not one of
   * the four current patterns renders nothing at all — no badge is a legitimate state
   * (small and flat), not an error to paper over with a placeholder.
   */
  pattern: RawNarrativeSpreadPattern | string | null | undefined;
}

const props = defineProps<Props>();

const pattern = computed<NarrativeSpreadPattern | null>(() => normalizeSpreadPattern(props.pattern));
</script>
