<template>
  <figure class="w-full">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full max-w-xs mx-auto"
      role="img"
      :aria-label="ariaLabel"
    >
      <!-- Base layer: the unbadged region. The four labels do not tile the plane, so
           whatever no region claims stays neutral — "small AND flat earns no label" is
           a result, not an empty space. -->
      <rect
        :x="sx(0)"
        :y="sy(1)"
        :width="sx(1) - sx(0)"
        :height="sy(0) - sy(1)"
        class="fill-gray-200"
      />

      <!-- The four regions, each in its own colour. Painted in REVERSE classification
           order with opaque fills: later regions only claim what earlier ones did not,
           so `viral` lands on top of the `trending` box it is carved out of. Opaque
           rather than translucent is the whole trick — alpha over overlapping
           rectangles is what produced muddy in-between tones before. -->
      <rect
        v-for="region in paintOrder"
        :key="region.level"
        :x="sx(region.composite[0])"
        :y="sy(region.accel[1])"
        :width="sx(region.composite[1]) - sx(region.composite[0])"
        :height="sy(region.accel[0]) - sy(region.accel[1])"
        :class="REGION_FILL[region.level]"
      />

      <!-- Plot frame -->
      <rect
        :x="sx(0)"
        :y="sy(1)"
        :width="sx(1) - sx(0)"
        :height="sy(0) - sy(1)"
        class="fill-none stroke-slate-400"
        stroke-width="1"
      />

      <!-- Region names. Every label carries a halo so a marker landing on one cannot
           destroy it, and identity never rests on colour alone. -->
      <text
        v-for="label in LABELS"
        :key="label.level ?? 'unbadged'"
        :x="sx(label.x)"
        :y="sy(label.y)"
        :text-anchor="label.anchor"
        :dominant-baseline="label.baseline"
        :class="[
          label.level ? 'fill-white stroke-black/30' : 'fill-gray-500 stroke-white',
          label.level === level ? 'font-bold' : 'font-medium',
        ]"
        font-size="10"
        stroke-width="2.5"
        paint-order="stroke"
        stroke-linejoin="round"
        class="select-none"
      >{{ label.level ? $t(`narratives.alertLevels.${label.level}`) : $t('narratives.alertLevels.unbadged') }}</text>

      <!-- The narrative's own region, outlined in a darker step of its own hue. -->
      <rect
        v-if="activeRegion"
        :x="sx(activeRegion.composite[0])"
        :y="sy(activeRegion.accel[1])"
        :width="sx(activeRegion.composite[1]) - sx(activeRegion.composite[0])"
        :height="sy(activeRegion.accel[0]) - sy(activeRegion.accel[1])"
        class="fill-none"
        :class="REGION_EDGE[activeRegion.level]"
        stroke-width="3"
      />

      <!-- The narrative. Dark ink with a white ring, so it reads against any region.
           With no acceleration there is no point to plot, only a known spread: a column
           says "somewhere on this line, height unknown" rather than dropping the marker
           to zero and implying flat. -->
      <circle
        v-if="accelPct !== null"
        :cx="sx(compositePct)"
        :cy="sy(accelPct)"
        r="7"
        class="fill-gray-900 stroke-white"
        stroke-width="3"
      >
        <title>{{ ariaLabel }}</title>
      </circle>
      <line
        v-else
        :x1="sx(compositePct)"
        :y1="sy(1)"
        :x2="sx(compositePct)"
        :y2="sy(0)"
        class="stroke-gray-900"
        stroke-width="2.5"
        stroke-dasharray="3 3"
      >
        <title>{{ ariaLabel }}</title>
      </line>

      <!-- Axis ticks at the thresholds themselves — the only values on these axes that
           change what a narrative is called. -->
      <g class="fill-gray-400" font-size="8">
        <text v-for="c in AXIS_TICKS" :key="`vt${c}`" :x="sx(c)" :y="sy(0) + 11" text-anchor="middle">{{ fmt(c) }}</text>
        <text v-for="a in AXIS_TICKS" :key="`ht${a}`" :x="sx(0) - 5" :y="sy(a) + 3" text-anchor="end">{{ fmt(a) }}</text>
      </g>
    </svg>

    <figcaption class="mt-2 flex justify-between gap-4 text-[11px] text-gray-500">
      <span>{{ $t('narratives.indicators.quadrant.yAxis') }}</span>
      <span>{{ $t('narratives.indicators.quadrant.xAxis') }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
/**
 * Where the narrative sits on the percentile plane, with the four regions drawn.
 *
 * Two bars cannot show this. `viral` is a conjunction — top of BOTH axes — and
 * `early_surge` is capped on spread, so it means "small and climbing" rather than
 * "anything climbing". Read as two independent readings, both look like "high-ish on
 * something", which is exactly the confusion the plane resolves.
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

// Plot box plus room for tick labels on the left and under the baseline.
const PLOT = 200;
const PAD = { left: 22, top: 8, right: 8, bottom: 16 };
const W = PAD.left + PLOT + PAD.right;
const H = PAD.top + PLOT + PAD.bottom;

// Percentile space is [0,1]; SVG y grows downward, so the acceleration axis is flipped.
const sx = (v: number) => PAD.left + v * PLOT;
const sy = (v: number) => PAD.top + (1 - v) * PLOT;

// 0.50 is a real boundary but sits 10 points from 0.40; labelling both crowds the axis,
// so only the outer two are numbered.
const AXIS_TICKS = [ALERT_BOUNDS.composite.lo, ALERT_BOUNDS.composite.hi];
const fmt = (v: number) => v.toFixed(1);

const REGION_FILL: Record<NarrativeAlertLevel, string> = {
  viral: 'fill-red-600',
  early_surge: 'fill-orange-600',
  trending: 'fill-yellow-600',
  consolidated: 'fill-purple-600',
} as Record<NarrativeAlertLevel, string>;

const REGION_EDGE: Record<NarrativeAlertLevel, string> = {
  viral: 'stroke-red-900',
  early_surge: 'stroke-orange-900',
  trending: 'stroke-yellow-900',
  consolidated: 'stroke-purple-900',
} as Record<NarrativeAlertLevel, string>;

// Reversed: ALERT_REGIONS is in classification order, so painting back to front lets
// the carve-outs land on top of the boxes they were cut from.
const paintOrder = computed(() => [...ALERT_REGIONS].reverse());

/**
 * Label anchors sit in each region's *exclusive* corner — the part no other region
 * overlaps — so `viral` inside the `trending` box does not collide with it.
 */
const LABELS: {
  level: NarrativeAlertLevel | null;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  baseline: string;
}[] = [
  { level: 'early_surge' as NarrativeAlertLevel,  x: 0.035, y: 0.965, anchor: 'start', baseline: 'hanging' },
  { level: 'viral' as NarrativeAlertLevel,        x: 0.965, y: 0.965, anchor: 'end',   baseline: 'hanging' },
  { level: 'trending' as NarrativeAlertLevel,     x: 0.435, y: 0.455, anchor: 'start', baseline: 'auto' },
  { level: 'consolidated' as NarrativeAlertLevel, x: 0.965, y: 0.045, anchor: 'end',   baseline: 'auto' },
  { level: null,                                  x: 0.035, y: 0.045, anchor: 'start', baseline: 'auto' },
];

// Only outline a region when both coordinates are known: without a rate we cannot say
// which row of the plane the narrative is on, and a stored badge from an earlier run is
// not evidence about today.
const activeRegion = computed(() => {
  if (props.accelPct === null || !props.level) return null;
  return ALERT_REGIONS.find((region) => region.level === props.level) ?? null;
});

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
