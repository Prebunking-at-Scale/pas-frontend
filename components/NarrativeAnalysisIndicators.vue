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
        <div v-if="level" class="shrink-0">
          <SpreadLevelBadge :level="level" class="text-base px-3 py-1" />
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
            <span class="text-2xl font-semibold tabular-nums text-gray-900">
              {{ formatPercentile(compositePct) }}
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
          <div class="mt-2 text-xs" :class="accelPct === null ? 'text-amber-700' : 'text-gray-500'">
            {{ accelContextLabel }}
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
                 `early_surge` is capped on spread rather than being "anything climbing". -->
            <NarrativeSpreadQuadrant
              :composite-pct="compositePct"
              :accel-pct="accelPct"
              :level="level"
            />

            <!-- The region definitions, derived from the same constants the plot uses. -->
            <div>
              <p class="font-medium text-gray-700 mb-1">{{ $t('narratives.indicators.thresholds') }}</p>
              <table class="w-full text-[11px]">
                <tbody>
                  <tr v-for="region in ALERT_REGIONS" :key="region.level" class="border-b border-gray-100 last:border-0">
                    <td class="py-1 pr-2">
                      <SpreadLevelBadge :level="region.level" />
                    </td>
                    <td class="py-1 text-gray-600 tabular-nums">{{ regionCondition(region) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- How much of the narrative was actually re-measured. A rate computed from
               four of forty videos deserves less confidence than one from all forty. -->
          <p v-if="coverage" class="text-gray-500">
            {{ $t('narratives.indicators.coverage', coverage) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import { apiService } from '~/services/api';
import type { NarrativeSpreadLevel, NarrativeAnalysisIndicatorsResponse, RawNarrativeSpreadLevel } from '~/types/api';
import SpreadLevelBadge from '~/components/SpreadLevelBadge.vue';
import NarrativeSpreadQuadrant from '~/components/NarrativeSpreadQuadrant.vue';
import { ALERT_REGIONS, normalizeSpreadLevel } from '~/utils/spreadLevels';

interface Props {
  narrativeId: string;
  spreadLevel?: RawNarrativeSpreadLevel | string | null;
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
 * The narrative's actual view growth per day, as a fraction of the baseline it grew
 * from — `change_views`, the largest of the three components acceleration blends.
 *
 * This is the only part of the rate that is a plain growth figure. The other two are a
 * change in how many videos we have linked and a change in engagement ratio, neither of
 * which is "how fast is this spreading", so neither belongs in a headline that reads as
 * a percentage. The consequence is that a narrative whose rank came from gaining videos
 * shows a small headline beside a high rank; the rank on the line below is what the
 * badge was read from, and the two are answering different questions.
 *
 * Null for a narrative not re-measured on this date, and also for rows written before
 * the redesign, which carry no components — hence the fallback to the rank.
 */
const accelGrowth = computed<number | null>(() => {
  const value = current.value?.acceleration_rate?.metadata?.change_views;
  return typeof value === 'number' ? value : null;
});

const accelHeadline = computed(() => {
  if (accelPct.value === null) return '—';
  if (accelGrowth.value === null) return formatPercentile(accelPct.value);
  return formatGrowth(accelGrowth.value);
});

const level = computed<NarrativeSpreadLevel | null>(() => normalizeSpreadLevel(props.spreadLevel));

// ── Plain-language context ────────────────────────────────────────────────
const verdict = computed(() => {
  if (level.value) return $i18n.t(`narratives.indicators.verdict.${level.value}`);
  if (accelPct.value === null) return $i18n.t('narratives.indicators.verdict.unmeasured');
  return $i18n.t('narratives.indicators.verdict.unbadged');
});

const compositeContextLabel = computed(() => {
  const v = compositePct.value;
  if (v >= 0.95) return $i18n.t('narratives.indicators.composite.context.top5');
  if (v >= 0.85) return $i18n.t('narratives.indicators.composite.context.top15');
  if (v >= 0.70) return $i18n.t('narratives.indicators.composite.context.top30');
  if (v >= 0.55) return $i18n.t('narratives.indicators.composite.context.top45');
  if (v >= 0.30) return $i18n.t('narratives.indicators.composite.context.middle');
  return $i18n.t('narratives.indicators.composite.context.low');
});

const accelContextLabel = computed(() => {
  const v = accelPct.value;
  if (v === null) return $i18n.t('narratives.indicators.acceleration.notMeasured');
  const context
    = v >= 0.80 ? $i18n.t('narratives.indicators.acceleration.context.fastest')
    : v >= 0.50 ? $i18n.t('narratives.indicators.acceleration.context.faster')
    : v >= 0.40 ? $i18n.t('narratives.indicators.acceleration.context.middle')
    : $i18n.t('narratives.indicators.acceleration.context.slower');
  // The rank is no longer the headline, but it is what the classifier read, so a reader
  // asking why a badge landed still needs to see it.
  return $i18n.t('narratives.indicators.acceleration.rankContext', {
    rank: formatPercentile(v),
    context,
  });
});

// ── Technical details ─────────────────────────────────────────────────────
const coverage = computed(() => {
  const metadata = current.value?.acceleration_rate?.metadata;
  if (!metadata?.refreshed_videos) return null;
  return {
    videos: metadata.refreshed_videos,
    days: (metadata.mean_gap_days ?? 1).toFixed(1),
  };
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
 * above use — a reader should not have to learn that "composite" and "Spread" are the
 * same axis, and the internal name is not the one on screen.
 */
function regionCondition(region: typeof ALERT_REGIONS[number]): string {
  const spread = $i18n.t('narratives.indicators.composite.label');
  const acceleration = $i18n.t('narratives.indicators.acceleration.label');
  const parts: string[] = [];
  if (region.composite[0] > 0) parts.push(`${spread} ≥ ${region.composite[0].toFixed(2)}`);
  if (region.composite[1] < 1) parts.push(`${spread} ≤ ${region.composite[1].toFixed(2)}`);
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
