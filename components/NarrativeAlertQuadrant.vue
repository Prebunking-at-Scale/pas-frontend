<template>
  <figure class="w-full">
    <svg
      :viewBox="`0 0 ${VB} ${VB}`"
      class="w-full max-w-sm mx-auto overflow-visible"
      role="img"
      :aria-label="ariaLabel"
    >
      <!-- Regions, painted in reverse classification order so the ones carved out of
           the others (viral out of trending) end up on top. -->
      <g>
        <rect
          v-for="region in paintOrder"
          :key="region.level"
          :x="region.x"
          :y="region.y"
          :width="region.w"
          :height="region.h"
          :class="REGION_CLASS[region.level]"
          :fill-opacity="level === region.level ? 0.42 : 0.13"
        />
      </g>

      <!-- Region labels, only where the rectangle can hold one. -->
      <text
        v-for="region in paintOrder"
        :key="`label-${region.level}`"
        :x="region.labelX"
        :y="region.labelY"
        :text-anchor="region.labelAnchor"
        class="fill-gray-600 select-none"
        :class="level === region.level ? 'font-semibold' : ''"
        :font-size="LABEL_SIZE"
      >
        {{ $t(`narratives.alertLevels.${region.level}`) }}
      </text>

      <!-- Frame and the two boundary grids. -->
      <rect :x="0" :y="0" :width="VB" :height="VB" class="fill-none stroke-gray-300" stroke-width="1" />
      <g class="stroke-gray-300" stroke-width="0.5" stroke-dasharray="2 2">
        <line v-for="c in COMPOSITE_TICKS" :key="`v${c}`" :x1="sx(c)" :y1="0" :x2="sx(c)" :y2="VB" />
        <line v-for="a in ACCEL_TICKS" :key="`h${a}`" :x1="0" :y1="sy(a)" :x2="VB" :y2="sy(a)" />
      </g>

      <!-- The narrative itself. With no acceleration there is no point to plot, only a
           known composite: a vertical line says "somewhere on this column, we don't
           know how high" rather than dropping the dot to zero and implying flat. -->
      <template v-if="accelPct !== null">
        <circle :cx="sx(compositePct)" :cy="sy(accelPct)" :r="6" class="fill-white stroke-gray-900" stroke-width="2" />
        <circle :cx="sx(compositePct)" :cy="sy(accelPct)" :r="2.5" class="fill-gray-900" />
      </template>
      <template v-else>
        <line
          :x1="sx(compositePct)"
          :y1="0"
          :x2="sx(compositePct)"
          :y2="VB"
          class="stroke-gray-900"
          stroke-width="2"
          stroke-dasharray="4 3"
        />
      </template>

      <!-- Axis ticks. -->
      <g class="fill-gray-400" :font-size="TICK_SIZE">
        <text v-for="c in COMPOSITE_TICKS" :key="`vt${c}`" :x="sx(c)" :y="VB + 12" text-anchor="middle">
          {{ c.toFixed(1) }}
        </text>
        <text v-for="a in ACCEL_TICKS" :key="`ht${a}`" :x="-6" :y="sy(a) + 3" text-anchor="end">
          {{ a.toFixed(1) }}
        </text>
      </g>
    </svg>

    <figcaption class="mt-6 flex justify-between text-xs text-gray-500 gap-4">
      <span>{{ $t('narratives.indicators.quadrant.xAxis') }}</span>
      <span>{{ $t('narratives.indicators.quadrant.yAxis') }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
/**
 * The narrative's position on the percentile plane, with the four regions drawn.
 *
 * Two bars cannot show this: `viral` is a conjunction (top of BOTH axes) and
 * `early_surge` is capped on composite — a small narrative climbing, never a large one.
 * Read as two independent readings, both look like "high-ish on something".
 */
import type { NarrativeAlertLevel } from '~/types/api';
import { ALERT_BOUNDS, ALERT_REGIONS } from '~/utils/alertLevels';

interface Props {
  compositePct: number;
  /** Null when the narrative was not re-measured on this date — drawn as a column, not a dot. */
  accelPct: number | null;
  level: NarrativeAlertLevel | null;
}
const props = defineProps<Props>();

const { $i18n } = useNuxtApp();

const VB = 200;
const LABEL_SIZE = 9;
const TICK_SIZE = 8;

const COMPOSITE_TICKS = [ALERT_BOUNDS.composite.lo, ALERT_BOUNDS.composite.mid, ALERT_BOUNDS.composite.hi];
const ACCEL_TICKS = [ALERT_BOUNDS.accel.lo, ALERT_BOUNDS.accel.mid, ALERT_BOUNDS.accel.hi];

// Percentile space is [0,1]; SVG y grows downward, so the accel axis is flipped.
const sx = (v: number) => v * VB;
const sy = (v: number) => (1 - v) * VB;

const REGION_CLASS: Record<NarrativeAlertLevel, string> = {
  viral: 'fill-red-500',
  early_surge: 'fill-orange-500',
  trending: 'fill-yellow-500',
  consolidated: 'fill-blue-500',
} as Record<NarrativeAlertLevel, string>;

const paintOrder = computed(() =>
  // Reversed: ALERT_REGIONS is in classification order (viral first, because it is
  // carved out of trending), so painting back to front puts the carve-outs on top.
  [...ALERT_REGIONS].reverse().map((region) => {
    const [c0, c1] = region.composite;
    const [a0, a1] = region.accel;
    const x = sx(c0);
    const y = sy(a1);
    const w = sx(c1) - sx(c0);
    const h = sy(a0) - sy(a1);
    return {
      level: region.level,
      x, y, w, h,
      // Labels sit in the top-left of their rectangle, inset, so overlapping regions
      // (trending under viral) keep their captions visible.
      labelX: x + 4,
      labelY: y + LABEL_SIZE + 2,
      labelAnchor: 'start' as const,
    };
  }),
);

const ariaLabel = computed(() => {
  const composite = (props.compositePct * 100).toFixed(0);
  if (props.accelPct === null) {
    return $i18n.t('narratives.indicators.quadrant.ariaNoAccel', { composite });
  }
  return $i18n.t('narratives.indicators.quadrant.aria', {
    composite,
    accel: (props.accelPct * 100).toFixed(0),
  });
});
</script>
