<template>
  <figure class="w-full">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full max-w-xs mx-auto"
      role="img"
      :aria-label="ariaLabel"
    >
      <!-- The unbadged region, in neutral ink. It is an L, not a square: a narrative
           below the `early_surge` floor but left of the `trending` floor is unbadged,
           and so is one left of the `consolidated` floor but below `trending`. Drawing
           it as a corner square understated it by a visible slice of the plane. -->
      <rect
        v-for="(box, i) in UNBADGED"
        :key="`u${i}`"
        :x="sx(box.composite[0])"
        :y="sy(box.accel[1])"
        :width="sx(box.composite[1]) - sx(box.composite[0])"
        :height="sy(box.accel[0]) - sy(box.accel[1])"
        class="fill-gray-100"
      />

      <!-- Plot frame -->
      <rect
        :x="sx(0)"
        :y="sy(1)"
        :width="sx(1) - sx(0)"
        :height="sy(0) - sy(1)"
        class="fill-none stroke-slate-300"
        stroke-width="1"
      />

      <!-- One outline per region, rather than a grid line per threshold. A grid draws
           six full-span lines and leaves the reader to reassemble which crossings bound
           which label; the boxes ARE the definition, so drawing them directly shows
           that the regions are rectangles that overlap — `viral` sits inside the
           `trending` box it is carved out of — which a grid actively hides. -->
      <rect
        v-for="region in ALERT_REGIONS"
        :key="region.level"
        :x="sx(region.composite[0])"
        :y="sy(region.accel[1])"
        :width="sx(region.composite[1]) - sx(region.composite[0])"
        :height="sy(region.accel[0]) - sy(region.accel[1])"
        class="fill-none stroke-gray-300"
        stroke-width="1"
      />

      <!-- Region names in muted ink, never in the series colour: the label carries the
           identity, so the plot never depends on colour alone to be read. The one the
           narrative occupies is darkened and bolded. -->
      <text
        v-for="label in LABELS"
        :key="label.level ?? 'unbadged'"
        :x="sx(label.x)"
        :y="sy(label.y)"
        :text-anchor="label.anchor"
        :dominant-baseline="label.baseline"
        :class="label.level === level ? 'fill-gray-900 font-semibold' : 'fill-gray-400'"
        font-size="10"
        stroke-width="2.5"
        paint-order="stroke"
        stroke-linejoin="round"
        class="select-none stroke-white"
      >{{ label.level ? $t(`narratives.spreadLevels.${label.level}`) : $t('narratives.spreadLevels.unbadged') }}</text>

      <!-- The narrative's own region, outlined at full strength. Colour appears exactly
           once in this chart, which is what keeps it legible: no translucent fills, so
           no muddy blend where `viral` overlaps `trending`. -->
      <rect
        v-if="activeRegion"
        :x="sx(activeRegion.composite[0])"
        :y="sy(activeRegion.accel[1])"
        :width="sx(activeRegion.composite[1]) - sx(activeRegion.composite[0])"
        :height="sy(activeRegion.accel[0]) - sy(activeRegion.accel[1])"
        class="fill-none"
        :class="REGION_STROKE[activeRegion.level]"
        stroke-width="2.5"
      />

      <!-- The narrative. With no acceleration there is no point to plot, only a known
           spread: a column says "somewhere on this line, height unknown" rather than
           dropping the marker to zero and implying flat. -->
      <template v-if="accelPct !== null">
        <circle
          :cx="sx(compositePct)"
          :cy="sy(accelPct)"
          r="7"
          class="stroke-white"
          :class="level ? REGION_FILL[level] : 'fill-gray-900'"
          stroke-width="2.5"
        >
          <title>{{ ariaLabel }}</title>
        </circle>
      </template>
      <line
        v-else
        :x1="sx(compositePct)"
        :y1="sy(1)"
        :x2="sx(compositePct)"
        :y2="sy(0)"
        class="stroke-gray-900"
        stroke-width="2"
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

      <!-- Axis names, sitting on their own axis. Naming them here rather than in a
           caption keeps the label attached to the thing it names, so a reader never has
           to work out which of two captions belongs to which direction. -->
      <text
        :x="sx(0.5)"
        :y="H - 5"
        text-anchor="middle"
        class="fill-gray-500 select-none"
        font-size="10"
      >{{ $t('narratives.indicators.quadrant.xAxis') }}</text>
      <text
        :x="-(PAD.top + PLOT / 2)"
        y="11"
        transform="rotate(-90)"
        text-anchor="middle"
        class="fill-gray-500 select-none"
        font-size="10"
      >{{ $t('narratives.indicators.quadrant.yAxis') }}</text>
    </svg>
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
import type { NarrativeSpreadLevel } from '~/types/api';
import { ALERT_BOUNDS, ALERT_REGIONS } from '~/utils/spreadLevels';

interface Props {
  compositePct: number;
  /** Null when the narrative was not re-measured on this date — drawn as a column, not a dot. */
  accelPct: number | null;
  level: NarrativeSpreadLevel | null;
}
const props = defineProps<Props>();

const { $i18n } = useNuxtApp();

const BOUNDS = ALERT_BOUNDS;

// Plot box plus margins: each side carries its tick numbers and then its axis name,
// which is why left and bottom are deeper than top and right.
const PLOT = 200;
const PAD = { left: 40, top: 8, right: 8, bottom: 32 };
const W = PAD.left + PLOT + PAD.right;
const H = PAD.top + PLOT + PAD.bottom;

// Percentile space is [0,1]; SVG y grows downward, so the acceleration axis is flipped.
const sx = (v: number) => PAD.left + v * PLOT;
const sy = (v: number) => PAD.top + (1 - v) * PLOT;

// 0.50 is a real boundary but sits 10 points from 0.40; numbering both crowds the axis,
// so only the outer two are labelled — the region outlines show where 0.50 falls.
const AXIS_TICKS = [BOUNDS.composite.lo, BOUNDS.composite.hi];

/**
 * The unbadged region, as two rectangles.
 *
 * It is an L rather than a corner square, and the difference is not cosmetic: the strip
 * between the `trending` acceleration floor and the `early_surge` floor is unbadged, and
 * so is the strip between the `trending` and `consolidated` spread floors. Expressed in
 * terms of the bounds so it tracks a retune of the thresholds.
 */
const UNBADGED: { composite: [number, number]; accel: [number, number] }[] = [
  { composite: [0, BOUNDS.composite.lo], accel: [0, BOUNDS.accel.mid] },
  { composite: [BOUNDS.composite.lo, BOUNDS.composite.mid], accel: [0, BOUNDS.accel.lo] },
];
const fmt = (v: number) => v.toFixed(1);

const REGION_STROKE: Record<NarrativeSpreadLevel, string> = {
  viral: 'stroke-red-600',
  early_surge: 'stroke-orange-600',
  trending: 'stroke-yellow-600',
  consolidated: 'stroke-purple-600',
} as Record<NarrativeSpreadLevel, string>;

const REGION_FILL: Record<NarrativeSpreadLevel, string> = {
  viral: 'fill-red-600',
  early_surge: 'fill-orange-600',
  trending: 'fill-yellow-600',
  consolidated: 'fill-purple-600',
} as Record<NarrativeSpreadLevel, string>;

/**
 * Label anchors sit in each region's *exclusive* corner — the part no other region
 * overlaps — so `viral` inside the `trending` box does not collide with it.
 */
const LABELS: {
  level: NarrativeSpreadLevel | null;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  baseline: string;
}[] = [
  { level: 'early_surge' as NarrativeSpreadLevel,  x: 0.035, y: 0.965, anchor: 'start', baseline: 'hanging' },
  { level: 'viral' as NarrativeSpreadLevel,        x: 0.965, y: 0.965, anchor: 'end',   baseline: 'hanging' },
  { level: 'trending' as NarrativeSpreadLevel,     x: 0.435, y: 0.455, anchor: 'start', baseline: 'auto' },
  { level: 'consolidated' as NarrativeSpreadLevel, x: 0.965, y: 0.045, anchor: 'end',   baseline: 'auto' },
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
