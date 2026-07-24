<template>
  <figure class="w-full">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full max-w-xs mx-auto"
      role="img"
      :aria-label="ariaLabel"
    >
      <!-- The unbadged corner, in neutral ink. The four regions do not tile the plane
           and this is the gap: small AND flat earns no label. Worth showing, because an
           unbadged narrative is a result, not a missing one. -->
      <rect
        :x="sx(0)"
        :y="sy(BOUNDS.accel.lo)"
        :width="sx(BOUNDS.composite.lo) - sx(0)"
        :height="sy(0) - sy(BOUNDS.accel.lo)"
        class="fill-gray-100"
      />

      <!-- Threshold lines. Recessive: they are scaffolding for reading the position,
           not the subject. -->
      <g class="stroke-gray-200" stroke-width="1">
        <line v-for="c in TICKS" :key="`v${c}`" :x1="sx(c)" :y1="sy(1)" :x2="sx(c)" :y2="sy(0)" />
        <line v-for="a in TICKS" :key="`h${a}`" :x1="sx(0)" :y1="sy(a)" :x2="sx(1)" :y2="sy(a)" />
      </g>

      <!-- Plot frame -->
      <rect
        :x="sx(0)"
        :y="sy(1)"
        :width="sx(1) - sx(0)"
        :height="sy(0) - sy(1)"
        class="fill-none stroke-slate-300"
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
      >{{ label.level ? $t(`narratives.alertLevels.${label.level}`) : $t('narratives.alertLevels.unbadged') }}</text>

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

const TICKS = [BOUNDS.composite.lo, BOUNDS.composite.mid, BOUNDS.composite.hi];
// 0.50 is a real boundary but sits 10 points from 0.40; labelling both crowds the axis,
// so the line is drawn and only the outer two are numbered.
const AXIS_TICKS = [BOUNDS.composite.lo, BOUNDS.composite.hi];
const fmt = (v: number) => v.toFixed(1);

const REGION_STROKE: Record<NarrativeAlertLevel, string> = {
  viral: 'stroke-red-600',
  early_surge: 'stroke-orange-600',
  trending: 'stroke-yellow-600',
  consolidated: 'stroke-purple-600',
} as Record<NarrativeAlertLevel, string>;

const REGION_FILL: Record<NarrativeAlertLevel, string> = {
  viral: 'fill-red-600',
  early_surge: 'fill-orange-600',
  trending: 'fill-yellow-600',
  consolidated: 'fill-purple-600',
} as Record<NarrativeAlertLevel, string>;

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
