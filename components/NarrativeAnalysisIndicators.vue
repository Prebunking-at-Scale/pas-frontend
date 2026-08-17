<template>
  <div class="shadow rounded-lg p-6 bg-white">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="h-8 w-40 bg-gray-200 rounded" />
      <div class="h-4 w-3/4 bg-gray-200 rounded" />
      <div class="h-12 bg-gray-200 rounded" />
      <div class="h-12 bg-gray-200 rounded" />
    </div>

    <!-- Empty state: no composite at all, i.e. the narrative has never been measured. -->
    <div v-else-if="!current" class="text-sm text-gray-500 italic">
      {{ $t('narratives.indicators.empty') }}
    </div>

    <div v-else class="space-y-6">
      <!-- 1) VERDICT. A narrative with no badge still shows its measurements: it was
              scored and simply fell in the unbadged region, or it was not re-measured
              today. Both are worth saying out loud. -->
      <div class="flex items-start gap-4 flex-wrap">
        <div v-if="pattern" class="shrink-0">
          <SpreadPatternBadge :pattern="pattern" class="text-base px-3 py-1" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-gray-900 font-medium leading-snug">
            {{ verdict }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ $t('narratives.indicators.asOf', { when: relativeDate }) }}
          </p>
        </div>
      </div>

      <!-- 2) THE TWO AXES. Kept on the surface: the numbers are the answer, and the
              quadrant behind the toggle is the explanation of how they combine. -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Composite — a level, carried forward, known for every measured narrative -->
        <div>
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-sm font-medium text-gray-700">
              {{ $t('narratives.indicators.composite.label') }}
            </span>
            <!-- Read as acceleration reads: the narrative's own size in the headline,
                 its position among the others on the line below. A percentile alone
                 answers "larger than whom", which reads as a magnitude when it is not
                 one — 88% is not 88 of anything. -->
            <span class="flex items-baseline gap-1">
              <span class="text-2xl font-semibold tabular-nums text-gray-900">
                {{ viralityHeadline }}
              </span>
              <span v-if="reachViews !== null" class="text-xs text-gray-500">
                {{ $t('narratives.indicators.composite.unit') }}
              </span>
            </span>
          </div>
          <div class="h-2 bg-gray-100 rounded overflow-hidden">
            <div class="h-full bg-gray-700 transition-all" :style="{ width: `${compositePct * 100}%` }" />
          </div>
          <div class="mt-2 text-xs text-gray-500">
            {{ compositeContextLabel }}
          </div>
        </div>

        <!-- Acceleration — a rate, and only for narratives visited that day -->
        <div>
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-sm font-medium text-gray-700">
              {{ $t('narratives.indicators.acceleration.label') }}
            </span>
            <!-- The headline is the narrative's actual daily view growth, not its rank.
                 A rank answers "faster than whom", which reads as a magnitude when it is
                 not one: five views above an otherwise flat cohort ranks around the
                 quarter mark while having grown 0.005%. The rank is what earns the badge,
                 so it moves to the line below rather than disappearing. -->
            <span class="flex items-baseline gap-1">
              <span
                class="text-2xl font-semibold tabular-nums"
                :class="accelPct === null ? 'text-gray-300' : 'text-gray-900'"
              >
                {{ accelHeadline }}
              </span>
              <span v-if="accelGrowth !== null" class="text-xs text-gray-500">
                {{ $t('narratives.indicators.acceleration.perDay') }}
              </span>
            </span>
          </div>
          <div class="h-2 bg-gray-100 rounded overflow-hidden">
            <div
              v-if="accelPct !== null"
              class="h-full bg-gray-700 transition-all"
              :style="{ width: `${accelPct * 100}%` }"
            />
          </div>
          <div class="mt-2 text-xs" :class="accelPct === null || unobserved ? 'text-amber-700' : 'text-gray-500'">
            {{ accelContextLabel }}
          </div>
          <!-- What was actually observed. Sits with the number it qualifies rather than
               in the collapsed panel: a rate measured over 2 of 63 videos and one
               measured over all 63 read identically without it. -->
          <div v-if="evidenceLabel" class="mt-1 text-xs text-gray-400">
            {{ evidenceLabel }}
          </div>
        </div>
      </div>

      <!-- 3) Technical details, collapsed by default -->
      <div class="border-t border-gray-100 pt-4">
        <button
          type="button"
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
          @click="detailsOpen = !detailsOpen"
        >
          <ChevronRight class="h-3 w-3 transition-transform" :class="detailsOpen ? 'rotate-90' : ''" />
          {{ $t('narratives.indicators.technicalDetails') }}
        </button>

        <div v-if="detailsOpen" class="mt-4 space-y-4 text-xs text-gray-600">
          <!-- The plot and the definitions it draws, side by side: the table names the
               boundaries and the plot shows where they fall, so reading one against the
               other should not cost a scroll. -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <!-- Where the narrative sits on the percentile plane. This is what the two
                 bars above cannot show: `viral` is a conjunction of both axes, and
                 `early_surge` is capped on virality rather than being "anything climbing". -->
            <NarrativeSpreadQuadrant
              :composite-pct="compositePct"
              :accel-pct="accelPct"
              :pattern="pattern"
            />

            <!-- The region definitions, derived from the same constants the plot uses. -->
            <div>
              <p class="font-medium text-gray-700 mb-1">{{ $t('narratives.indicators.thresholds') }}</p>
              <table class="w-full text-[11px]">
                <tbody>
                  <tr v-for="region in SPREAD_REGIONS" :key="region.pattern" class="border-b border-gray-100 last:border-0">
                    <td class="py-1 pr-2">
                      <SpreadPatternBadge :pattern="region.pattern" />
                    </td>
                    <td class="py-1 text-gray-600 tabular-nums">{{ regionCondition(region) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import { apiService } from '~/services/api';
import type { NarrativeSpreadPattern, NarrativeAnalysisIndicatorsResponse, RawNarrativeSpreadPattern } from '~/types/api';
import SpreadPatternBadge from '~/components/SpreadPatternBadge.vue';
import NarrativeSpreadQuadrant from '~/components/NarrativeSpreadQuadrant.vue';
import { SPREAD_REGIONS, normalizeSpreadPattern } from '~/utils/spreadPatterns';
import { formatNumber } from '~/utils/narrativeStats';

interface Props {
  narrativeId: string;
  spreadPattern?: RawNarrativeSpreadPattern | string | null;
}
const props = defineProps<Props>();

const { $i18n } = useNuxtApp();

const loading = ref(true);
const current = ref<NarrativeAnalysisIndicatorsResponse | null>(null);
const detailsOpen = ref(false);

/**
 * Both axes are read from `metadata.percentile`, which is the rank the classifier uses.
 * `indicator_value` is a weighted blend of two ranks and is not itself a rank, so it
 * cannot carry a positional claim like "top 5%".
 */
const compositePct = computed(() => current.value?.composite_virality.metadata?.percentile ?? 0);

/**
 * The narrative's own size on the virality axis: `reach_score`, its summed view count
 * and the largest of the two terms composite blends.
 *
 * Reach is shown rather than the blend for the same reason acceleration headlines
 * `change_views` rather than its rank — it is the only component that is a plain
 * magnitude. Engagement is a per-view ratio and deliberately size-neutral, so it cannot
 * headline an axis that asks how far something has spread. The consequence is the same
 * one acceleration lives with: a narrative ranked high on engagement shows a modest
 * headline beside a high rank, and the rank on the line below is what the badge read.
 *
 * Null for rows written before the backend recorded the raw scores — hence the fallback
 * to the percentile.
 */
const reachViews = computed<number | null>(() => {
  const value = current.value?.composite_virality.metadata?.reach_score;
  return typeof value === 'number' ? value : null;
});

const viralityHeadline = computed(() => {
  if (reachViews.value === null) return formatPercentile(compositePct.value);
  return formatNumber(reachViews.value);
});

/**
 * Null means the narrative was not visited on this date, so its rate is uncomputable —
 * NOT that it was flat. Composite ranks every narrative measured at least once (~22k),
 * acceleration only the ~2k re-measured that day, so this is the common case and must
 * never be rendered as a zero.
 */
const accelPct = computed<number | null>(() => {
  const accel = current.value?.acceleration_rate;
  if (!accel) return null;
  return accel.metadata?.percentile ?? null;
});

/**
 * The narrative's own view growth per day: the day's movement over the whole of what
 * we knew yesterday, which is the same quantity the evolution chart draws. It is the
 * larger of the two components the rate blends, engagement being the other.
 *
 * Null for a narrative not re-measured on this date, and also for rows written before
 * the redesign, which carry no components — hence the fallback to the rank.
 */
const accelGrowth = computed<number | null>(() => {
  const value = current.value?.acceleration_rate?.metadata?.change_views;
  return typeof value === 'number' ? value : null;
});

/**
 * What was actually observed about this narrative on this date: videos re-fetched, and
 * videos newly linked that arrived carrying their views. Either moves the rate.
 *
 * Null for rows that predate these fields, where the question cannot be answered — and
 * an unanswerable question must not be rendered as a "no".
 */
const evidence = computed(() => {
  const metadata = current.value?.acceleration_rate?.metadata;
  if (!metadata || typeof metadata.refreshed_videos !== 'number') return null;
  return {
    refreshed: metadata.refreshed_videos,
    newVideos: metadata.new_videos ?? 0,
    total: metadata.prev_videos ?? null,
  };
});

/**
 * In the cohort, but with two identical states behind it: nothing re-fetched and nothing
 * new. Its `change_views` is a hard zero for want of an observation, not because the
 * narrative stopped growing, and the panel must not print that zero as a growth figure.
 * This is the C1 rule the backend applies when it decides whether a badge is earned.
 */
const unobserved = computed(() =>
  evidence.value !== null && evidence.value.refreshed === 0 && evidence.value.newVideos === 0,
);

const accelHeadline = computed(() => {
  if (accelPct.value === null) return '—';
  if (unobserved.value) return '—';
  if (accelGrowth.value === null) return formatPercentile(accelPct.value);
  return formatGrowth(accelGrowth.value);
});

const pattern = computed<NarrativeSpreadPattern | null>(() => normalizeSpreadPattern(props.spreadPattern));

// ── Plain-language context ────────────────────────────────────────────────
const verdict = computed(() => {
  if (pattern.value) return $i18n.t(`narratives.indicators.verdict.${pattern.value}`);
  if (accelPct.value === null) return $i18n.t('narratives.indicators.verdict.unmeasured');
  return $i18n.t('narratives.indicators.verdict.unbadged');
});

/**
 * The rank, and nothing that restates it.
 *
 * This line used to gloss the percentile into a band — "rank 88% — top 15% across all
 * narratives" — which is one fact told twice, and the vaguer telling was the one in
 * words: 88% *is* the top 12%, rounded up to a band boundary. All that the number
 * cannot say on its own is which cohort it ranks within, and that is worth keeping,
 * because it is precisely what differs from acceleration's line: composite ranks every
 * narrative ever measured, acceleration only those measured that day. Both lines now
 * name their cohort in the same shape, so the difference reads off the words themselves.
 */
const compositeContextLabel = computed(() =>
  $i18n.t('narratives.indicators.composite.rankContext', {
    rank: formatPercentile(compositePct.value),
  }),
);

/**
 * The same line as composite's, over acceleration's narrower cohort.
 *
 * This used to gloss the rank into a band in words — "rank 62% — among the fastest-moving
 * measured today" — the same one-fact-told-twice the composite line dropped. What the
 * number cannot say for itself is the cohort, and here the cohort is the whole point:
 * acceleration ranks only the narratives re-measured on this date, never all of them.
 */
const accelContextLabel = computed(() => {
  const v = accelPct.value;
  if (v === null) return $i18n.t('narratives.indicators.acceleration.notMeasured');
  if (unobserved.value) return $i18n.t('narratives.indicators.acceleration.notObserved');
  // The rank is no longer the headline, but it is what the classifier read, so a reader
  // asking why a badge landed still needs to see it.
  return $i18n.t('narratives.indicators.acceleration.rankContext', {
    rank: formatPercentile(v),
  });
});

/**
 * How much of the narrative the day's number saw, on the line under the number itself
 * rather than folded into the collapsed panel — it is what tells a reader how much
 * weight to give everything above it, and the cases needing it most are the ones where
 * the old line hid itself (it required a re-fetch, so a narrative that grew purely by
 * gaining videos showed nothing at all). Counts only: the share of yesterday's views
 * they cover is a second, harder number, and two of them on one line reads as noise.
 *
 * Both halves are named because either can be the whole rate: a re-fetch measures views
 * we already had, an arrival brings views we did not.
 */
const evidenceLabel = computed(() => {
  const e = evidence.value;
  if (e === null || accelPct.value === null || unobserved.value) return null;
  const parts: string[] = [];
  if (e.refreshed > 0) {
    parts.push($i18n.t('narratives.indicators.acceleration.evidenceRefreshed', {
      refreshed: e.refreshed,
      total: e.total ?? e.refreshed,
    }));
  }
  if (e.newVideos > 0) {
    parts.push($i18n.t('narratives.indicators.acceleration.evidenceNew', { count: e.newVideos }));
  }
  return parts.join(' · ');
});

function formatPercentile(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

/**
 * A daily growth fraction as a percentage, with enough precision that a near-flat
 * narrative reads as near-flat rather than rounding to a confident "0.0%". Below
 * 0.001% there is nothing honest left to show, so say that instead of a number.
 */
function formatGrowth(v: number): string {
  const magnitude = Math.abs(v) * 100;
  if (magnitude === 0) return '0%';
  const sign = v > 0 ? '+' : '−';
  if (magnitude < 0.001) return `${sign}<0.001%`;
  const decimals = magnitude >= 10 ? 0 : magnitude >= 1 ? 1 : magnitude >= 0.1 ? 2 : 3;
  return `${sign}${magnitude.toFixed(decimals)}%`;
}

/**
 * The region's definition in words. The axes are named with the same labels the bars
 * above use — a reader should not have to learn that "composite" and "Virality" are the
 * same axis, and the internal name is not the one on screen.
 */
function regionCondition(region: typeof SPREAD_REGIONS[number]): string {
  const virality = $i18n.t('narratives.indicators.composite.label');
  const acceleration = $i18n.t('narratives.indicators.acceleration.label');
  const parts: string[] = [];
  if (region.composite[0] > 0) parts.push(`${virality} ≥ ${region.composite[0].toFixed(2)}`);
  if (region.composite[1] < 1) parts.push(`${virality} ≤ ${region.composite[1].toFixed(2)}`);
  if (region.accel[0] > 0) parts.push(`${acceleration} ≥ ${region.accel[0].toFixed(2)}`);
  if (region.accel[1] < 1) parts.push(`${acceleration} ≤ ${region.accel[1].toFixed(2)}`);
  return parts.join('  ∧  ');
}

// ── Relative date display ─────────────────────────────────────────────────
const relativeDate = computed(() => {
  if (!current.value?.date) return '';
  const d = new Date(current.value.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return $i18n.t('narratives.indicators.today');
  if (diff === 1) return $i18n.t('narratives.indicators.yesterday');
  return $i18n.t('narratives.indicators.daysAgo', { n: diff });
});

// ── Data loading ──────────────────────────────────────────────────────────
async function load() {
  loading.value = true;
  try {
    // Latest indicators for this narrative (the endpoint returns the most recent
    // available entry, regardless of whether today's recalc has run). Composite is
    // required; acceleration comes back null for narratives not visited that day.
    current.value = await apiService.getNarrativeAnalysisIndicators(props.narrativeId);
  } catch (e) {
    console.error('Failed to load indicators:', e);
    current.value = null;
  } finally {
    loading.value = false;
  }
}

watch(() => props.narrativeId, load);
onMounted(load);
</script>
