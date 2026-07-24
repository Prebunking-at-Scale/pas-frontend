<template>
  <Badge v-if="level" :variant="ALERT_LEVEL_VARIANT[level]" class="capitalize">
    {{ $t(`narratives.alertLevels.${level}`) }}
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge';
import type { NarrativeAlertLevel, RawNarrativeAlertLevel } from '~/types/api';
import { ALERT_LEVEL_VARIANT, normalizeAlertLevel } from '~/utils/alertLevels';

interface Props {
  /**
   * Accepts whatever the API sent, retired values included. Anything that is not one of
   * the four current levels renders nothing at all — no badge is a legitimate state
   * (small and flat), not an error to paper over with a placeholder.
   */
  level: RawNarrativeAlertLevel | string | null | undefined;
}

const props = defineProps<Props>();

const level = computed<NarrativeAlertLevel | null>(() => normalizeAlertLevel(props.level));
</script>
