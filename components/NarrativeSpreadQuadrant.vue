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
           which label; the shapes ARE the definition, so drawing them directly shows
           which area carries which label. `trending` is drawn with the `viral` corner
           carved out — see regionPath — so no two outlines overlap and the plot never
           asserts that an area belongs to a label that does not own it. -->
      <path
        v-for="region in SPREAD_REGIONS"
        :key="region.pattern"
        :d="regionPath(region)"
        class="fill-none stroke-gray-300"
        stroke-width="1"
      />

      <!-- Region names in muted ink, never in the series colour: the label carries the
           identity, so the plot never depends on colour alone to be read. The one the
           narrative occupies is darkened and bolded. -->
      <text
        v-for="label in LABELS"
        :key="label.pattern ?? 'unbadged'"
        :x="sx(label.x)"
        :y="sy(label.y)"
        :text-anchor="label.anchor"
        :dominant-baseline="label.baseline"
        :class="label.pattern === pattern ? 'fill-gray-900 font-semibold' : 'fill-gray-400'"
        font-size="10"
        stroke-width="2.5"
        paint-order="stroke"
        stroke-linejoin="round"
        class="select-none stroke-white"
      >{{ label.pattern ? $t(`narratives.spreadPatterns.${label.pattern}`) : $t('narratives.spreadPatterns.unbadged') }}</text>

      <!-- The narrative's own region, outlined at full strength. Colour appears exactly
           once in this chart, which is what keeps it legible: no translucent fills, so
           nothing to blend. Uses the same carved path as the grey outlines: highlighting
           `trending` as a full rectangle would light up the `viral` corner it does not
           own, which is precisely the case a reader is most likely to be checking. -->
      <path
        v-if="activeRegion"
        :d="regionPath(activeRegion)"
        class="fill-none"
        :class="REGION_STROKE[activeRegion.pattern]"
        stroke-width="2.5"
      />

      <!-- The narrative. With no acceleration there is no point to plot, only a known
           virality: a column says "somewhere on this line, height unknown" rather than
           dropping the marker to zero and implying flat. -->
      <template v-if="accelPct !== null">
        <circle
          :cx="sx(compositePct)"
          :cy="sy(accelPct)"
          r="7"
          class="stroke-white"
          :class="pattern ? REGION_FILL[pattern] : 'fill-gray-900'"
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
 * `early_surge` is capped on virality, so it means "small and climbing" rather than
 * "anything climbing". Read as two independent readings, both look like "high-ish on
 * something", which is exactly the confusion the plane resolves.
 */
import type { NarrativeSpreadPattern } from '~/types/api';
import { SPREAD_BOUNDS, SPREAD_REGIONS } from '~/utils/spreadPatterns';

interface Props {
  compositePct: number;
  /** Null when the narrative was not re-measured on this date — drawn as a column, not a dot. */
  accelPct: number | null;
  pattern: NarrativeSpreadPattern | null;
}
const props = defineProps<Props>();

const { $i18n } = useNuxtApp();

const BOUNDS = SPREAD_BOUNDS;

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
 * so is the strip between the `trending` and `consolidated` virality floors. Expressed in
 * terms of the bounds so it tracks a retune of the thresholds.
 */
const UNBADGED: { composite: [number, number]; accel: [number, number] }[] = [
  { composite: [0, BOUNDS.composite.lo], accel: [0, BOUNDS.accel.mid] },
  { composite: [BOUNDS.composite.lo, BOUNDS.composite.mid], accel: [0, BOUNDS.accel.lo] },
];
const fmt = (v: number) => v.toFixed(1);

/**
 * A region's outline, with any region it `excludes` carved out of it.
 *
 * `trending` is stated as a rectangle that contains the whole `viral` corner; it only
 * loses that corner because `viral` is tested first. Drawn as a plain rectangle the plot
 * asserted the corner was trending, so the two outlines crossed and the reader had to
 * know the evaluation order to resolve which label the overlap belonged to. Drawing the
 * carve-out means the outlines never cross and every region owns exactly the area it is
 * responsible for.
 *
 * The excluded region always shares this one's upper bounds on both axes — it is carved
 * from a corner, not punched out of the middle — so the result is an L traced in six
 * points, never a shape with a hole.
 */
function regionPath(region: typeof SPREAD_REGIONS[number]): string {
  const [c0, c1] = region.composite;
  const [a0, a1] = region.accel;
  const excluded = region.excludes
    ? SPREAD_REGIONS.find((r) => r.pattern === region.excludes)
    : undefined;

  if (!excluded) {
    return `M${sx(c0)} ${sy(a0)}H${sx(c1)}V${sy(a1)}H${sx(c0)}Z`;
  }

  const [e0] = excluded.composite;
  const [f0] = excluded.accel;
  return [
    `M${sx(c0)} ${sy(a0)}`, // bottom-left
    `H${sx(c1)}`, // along the floor to the right edge
    `V${sy(f0)}`, // up the right edge, stopping at the excluded region's floor
    `H${sx(e0)}`, // left, under the excluded corner
    `V${sy(a1)}`, // up its left edge to the ceiling
    `H${sx(c0)}`, // back along the ceiling
    'Z',
  ].join('');
}

const REGION_STROKE: Record<NarrativeSpreadPattern, string> = {
  viral: 'stroke-red-600',
  early_surge: 'stroke-orange-600',
  trending: 'stroke-yellow-600',
  consolidated: 'stroke-purple-600',
} as Record<NarrativeSpreadPattern, string>;

const REGION_FILL: Record<NarrativeSpreadPattern, string> = {
  viral: 'fill-red-600',
  early_surge: 'fill-orange-600',
  trending: 'fill-yellow-600',
  consolidated: 'fill-purple-600',
} as Record<NarrativeSpreadPattern, string>;

/**
 * Label anchors sit in each region's *exclusive* corner — the part no other region
 * overlaps — so `viral` inside the `trending` box does not collide with it.
 */
const LABELS: {
  pattern: NarrativeSpreadPattern | null;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  baseline: string;
}[] = [
  { pattern: 'early_surge' as NarrativeSpreadPattern,  x: 0.035, y: 0.965, anchor: 'start', baseline: 'hanging' },
  { pattern: 'viral' as NarrativeSpreadPattern,        x: 0.965, y: 0.965, anchor: 'end',   baseline: 'hanging' },
  { pattern: 'trending' as NarrativeSpreadPattern,     x: 0.435, y: 0.455, anchor: 'start', baseline: 'auto' },
  { pattern: 'consolidated' as NarrativeSpreadPattern, x: 0.965, y: 0.045, anchor: 'end',   baseline: 'auto' },
  { pattern: null,                                  x: 0.035, y: 0.045, anchor: 'start', baseline: 'auto' },
];

// Only outline a region when both coordinates are known: without a rate we cannot say
// which row of the plane the narrative is on, and a stored badge from an earlier run is
// not evidence about today.
const activeRegion = computed(() => {
  if (props.accelPct === null || !props.pattern) return null;
  return SPREAD_REGIONS.find((region) => region.pattern === props.pattern) ?? null;
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
