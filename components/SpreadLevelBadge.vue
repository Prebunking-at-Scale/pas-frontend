<template>
  <Badge v-if="level" :variant="SPREAD_LEVEL_VARIANT[level]" class="capitalize">
    {{ $t(`narratives.spreadLevels.${level}`) }}
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge';
import type { NarrativeSpreadLevel, RawNarrativeSpreadLevel } from '~/types/api';
import { SPREAD_LEVEL_VARIANT, normalizeSpreadLevel } from '~/utils/spreadLevels';

interface Props {
  /**
   * Accepts whatever the API sent, retired values included. Anything that is not one of
   * the four current levels renders nothing at all — no badge is a legitimate state
   * (small and flat), not an error to paper over with a placeholder.
   */
  level: RawNarrativeSpreadLevel | string | null | undefined;
}

const props = defineProps<Props>();

const level = computed<NarrativeSpreadLevel | null>(() => normalizeSpreadLevel(props.level));
</script>
