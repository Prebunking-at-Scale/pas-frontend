<template>
  <Badge :variant="variant" class="capitalize">
    {{ $t(`narratives.alertLevels.${level}`) }}
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge';
import type { NarrativeAlertLevel } from '~/types/api';

interface Props {
  level: NarrativeAlertLevel | 'none' | 'viral' | 'early_surge' | 'alert' | 'watch';
}

const props = defineProps<Props>();

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'orange' | 'warning' | 'purple';

// Pick a shadcn Badge variant per alert level. Mapping kept simple so adding
// a new alert level only needs an entry here + an i18n string.
const VARIANT_MAP: Record<string, BadgeVariant> = {
  viral: 'destructive',
  alert: 'warning',
  early_surge: 'orange',
  watch: 'secondary',
  none: 'outline',
};

const variant = computed<BadgeVariant>(() => VARIANT_MAP[props.level] ?? 'outline');
</script>
