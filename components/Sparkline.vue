<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    :width="W"
    :height="H"
    class="overflow-visible"
    :class="strokeClass"
    role="img"
    :aria-label="title"
  >
    <title v-if="title">{{ title }}</title>
    <!-- Gap-aware polyline: each contiguous run of non-null values becomes its
         own polyline so missing days show as gaps instead of an interpolated
         straight line. -->
    <polyline
      v-for="(segment, i) in segments"
      :key="i"
      :points="segment"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Last data point marker -->
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="2"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  values: (number | null)[];
  strokeClass?: string;
  title?: string;
}
const props = defineProps<Props>();

const W = 64;
const H = 20;
const PAD = 2;

// Normalised (x, y) for each point — null entries stay null so we can break
// the line into segments and show gaps.
const points = computed<({ x: number; y: number } | null)[]>(() => {
  const xs = props.values;
  if (xs.length === 0) return [];
  const present = xs.filter((v): v is number => v !== null);
  if (present.length === 0) return xs.map(() => null);
  const min = Math.min(...present);
  const max = Math.max(...present);
  const span = max - min || 1;
  const stepX = xs.length > 1 ? (W - PAD * 2) / (xs.length - 1) : 0;
  return xs.map((v, i) => {
    if (v === null) return null;
    const x = PAD + i * stepX;
    // Higher value → smaller y (top of SVG)
    const y = PAD + (1 - (v - min) / span) * (H - PAD * 2);
    return { x, y };
  });
});

// Group contiguous non-null points into separate polyline segments.
const segments = computed<string[]>(() => {
  const out: string[] = [];
  let current: string[] = [];
  for (const p of points.value) {
    if (p === null) {
      if (current.length >= 2) out.push(current.join(' '));
      current = [];
    } else {
      current.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
  }
  if (current.length >= 2) out.push(current.join(' '));
  return out;
});

const lastPoint = computed(() => {
  for (let i = points.value.length - 1; i >= 0; i--) {
    if (points.value[i]) return points.value[i];
  }
  return null;
});
</script>
