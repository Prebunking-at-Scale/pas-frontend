<template>
  <div class="shadow rounded-lg p-6 bg-white">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="h-8 w-40 bg-gray-200 rounded" />
      <div class="h-4 w-3/4 bg-gray-200 rounded" />
      <div class="h-12 bg-gray-200 rounded" />
      <div class="h-12 bg-gray-200 rounded" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!current" class="text-sm text-gray-500 italic">
      {{ $t('narratives.indicators.empty') }}
    </div>

    <div v-else class="space-y-6">
      <!-- 1) VERDICT -->
      <div class="flex items-start gap-4 flex-wrap">
        <div class="shrink-0">
          <AlertLevelBadge :level="levelKey" class="text-base px-3 py-1" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-gray-900 font-medium leading-snug">
            {{ $t(`narratives.indicators.verdict.${levelKey}`) }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ $t('narratives.indicators.asOf', { when: relativeDate }) }}
          </p>
        </div>
      </div>

      <!-- 2) TWO INDICATORS, each with bar + 7-day sparkline + plain-language context -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Composite virality (bounded 0..1) -->
        <div>
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-sm font-medium text-gray-700">
              {{ $t('narratives.indicators.composite.label') }}
            </span>
            <span class="text-2xl font-semibold tabular-nums" :class="magnitudeColor(compositeValue)">
              {{ compositeValue.toFixed(2) }}
            </span>
          </div>
          <div class="h-2 bg-gray-100 rounded overflow-hidden">
            <div
              class="h-full transition-all"
              :class="magnitudeBg(compositeValue)"
              :style="{ width: `${Math.min(compositeValue, 1) * 100}%` }"
            />
          </div>
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{{ compositeContextLabel }}</span>
            <Sparkline
              v-if="compositeHistory.filter(v => v !== null).length >= 2"
              :values="compositeHistory"
              :stroke-class="magnitudeColor(compositeValue)"
              :title="$t('narratives.indicators.lastDays', { n: HISTORY_DAYS })"
            />
          </div>
        </div>

        <!-- Acceleration (unbounded, baseline 0) -->
        <div>
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-sm font-medium text-gray-700">
              {{ $t('narratives.indicators.acceleration.label') }}
            </span>
            <span class="text-2xl font-semibold tabular-nums" :class="accelColor(accelerationValue)">
              {{ accelerationValue >= 0 ? '+' : '' }}{{ accelerationValue.toFixed(2) }}
            </span>
          </div>
          <div class="relative h-2 bg-gray-100 rounded overflow-hidden">
            <!-- Baseline marker at 0 -->
            <div class="absolute top-0 bottom-0 w-px bg-gray-400" :style="{ left: `${ACCEL_ZERO_POS}%` }" />
            <div
              class="absolute top-0 h-full transition-all"
              :class="accelBg(accelerationValue)"
              :style="accelBarStyle"
            />
          </div>
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{{ accelContextLabel }}</span>
            <Sparkline
              v-if="accelerationHistory.filter(v => v !== null).length >= 2"
              :values="accelerationHistory"
              :stroke-class="accelColor(accelerationValue)"
              :title="$t('narratives.indicators.lastDays', { n: HISTORY_DAYS })"
            />
          </div>
        </div>
      </div>

      <!-- 3) WHY THIS LEVEL + path to next -->
      <div class="border-t border-gray-100 pt-4 text-sm">
        <p class="font-medium text-gray-700 mb-2">
          {{ $t('narratives.indicators.why', { level: $t(`narratives.alertLevels.${levelKey}`) }) }}
        </p>
        <ul class="space-y-1 text-gray-600">
          <li v-for="(c, i) in conditions" :key="i" class="flex items-start gap-2">
            <span class="mt-0.5" :class="c.met ? 'text-green-600' : 'text-gray-400'">
              {{ c.met ? '✓' : '·' }}
            </span>
            <span>{{ c.text }}</span>
          </li>
        </ul>
        <p v-if="pathToNext" class="mt-3 text-xs text-gray-500 italic">
          {{ pathToNext }}
        </p>
      </div>

      <!-- 4) Technical details, collapsed by default -->
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
          <!-- Composite breakdown -->
          <div>
            <p class="font-medium text-gray-700 mb-1">
              {{ $t('narratives.indicators.composite.label') }}
              <span class="font-normal text-gray-500">— {{ $t('narratives.indicators.composite.howCalculated') }}</span>
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div v-for="part in compositeParts" :key="part.key" class="bg-gray-50 rounded p-2">
                <div class="text-gray-500">{{ $t(`narratives.indicators.composite.${part.key}`) }}</div>
                <div class="text-sm font-semibold text-gray-900">{{ part.value.toFixed(2) }}</div>
                <div class="text-[10px] text-gray-400">× {{ part.weight.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- Acceleration breakdown -->
          <div>
            <p class="font-medium text-gray-700 mb-1">
              {{ $t('narratives.indicators.acceleration.label') }}
              <span class="font-normal text-gray-500">— {{ $t('narratives.indicators.acceleration.howCalculated') }}</span>
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div v-for="part in accelerationParts" :key="part.key" class="bg-gray-50 rounded p-2">
                <div class="text-gray-500">{{ $t(`narratives.indicators.acceleration.${part.key}`) }}</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ part.value >= 0 ? '+' : '' }}{{ formatPercent(part.value) }}
                </div>
                <div class="text-[10px] text-gray-400">× {{ part.weight.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- All thresholds reference table -->
          <div>
            <p class="font-medium text-gray-700 mb-1">{{ $t('narratives.indicators.thresholds') }}</p>
            <table class="w-full text-[11px]">
              <tbody>
                <tr v-for="t in THRESHOLDS" :key="t.level" class="border-b border-gray-100 last:border-0">
                  <td class="py-1 pr-2">
                    <AlertLevelBadge :level="t.level" />
                  </td>
                  <td class="py-1 text-gray-600">{{ t.condition }}</td>
                </tr>
              </tbody>
            </table>
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
import { NarrativeAlertLevel, type NarrativeAnalysisIndicatorsResponse } from '~/types/api';
import AlertLevelBadge from '~/components/AlertLevelBadge.vue';
import Sparkline from '~/components/Sparkline.vue';

interface Props {
  narrativeId: string;
  alertLevel?: NarrativeAlertLevel | null;
}
const props = defineProps<Props>();

const { $i18n } = useNuxtApp();

const HISTORY_DAYS = 7;
// Acceleration is unbounded but we render it on a [-cap, +cap] visual scale.
// The backend caps each change_* at 5 (ACCELERATION_CHANGE_CAP), so weighted
// acceleration_rate can't reach 5 either. 3.0 covers the realistic range for
// "viral" without making the bar look empty for normal values.
const ACCEL_VISUAL_CAP = 3.0;
const ACCEL_ZERO_POS = 0; // baseline at the LEFT edge — accel >= 0 in practice

const loading = ref(true);
const current = ref<NarrativeAnalysisIndicatorsResponse | null>(null);
// History aligned by day: HISTORY_DAYS entries, oldest → newest, null for
// days without data (rendered as gaps in the sparkline).
const history = ref<(NarrativeAnalysisIndicatorsResponse | null)[]>([]);
const detailsOpen = ref(false);

const compositeValue = computed(() => current.value?.composite_virality.indicator_value ?? 0);
const accelerationValue = computed(() => current.value?.acceleration_rate.indicator_value ?? 0);

const levelKey = computed<NarrativeAlertLevel>(() => props.alertLevel ?? NarrativeAlertLevel.NONE);

// ── History series ────────────────────────────────────────────────────────
// HISTORY_DAYS values from oldest → newest, with nulls for missing days.
const compositeHistory = computed(() =>
  history.value.map((r) => r?.composite_virality.indicator_value ?? null),
);
const accelerationHistory = computed(() =>
  history.value.map((r) => r?.acceleration_rate.indicator_value ?? null),
);

// ── Visual styling helpers ────────────────────────────────────────────────
function magnitudeColor(v: number): string {
  if (v >= 0.85) return 'text-red-600';
  if (v >= 0.70) return 'text-orange-600';
  if (v >= 0.55) return 'text-yellow-600';
  return 'text-gray-700';
}
function magnitudeBg(v: number): string {
  if (v >= 0.85) return 'bg-red-500';
  if (v >= 0.70) return 'bg-orange-500';
  if (v >= 0.55) return 'bg-yellow-500';
  return 'bg-gray-400';
}
function accelColor(v: number): string {
  if (v >= 2.0) return 'text-red-600';
  if (v >= 1.5) return 'text-orange-600';
  if (v >= 1.0) return 'text-yellow-600';
  if (v >= 0.5) return 'text-gray-700';
  return 'text-gray-500';
}
function accelBg(v: number): string {
  if (v >= 2.0) return 'bg-red-500';
  if (v >= 1.5) return 'bg-orange-500';
  if (v >= 1.0) return 'bg-yellow-500';
  return 'bg-gray-400';
}

const accelBarStyle = computed(() => {
  const v = accelerationValue.value;
  const pct = Math.min(Math.abs(v) / ACCEL_VISUAL_CAP, 1) * 100;
  // All practical values are >= 0, so the bar grows rightward from 0.
  return { left: `${ACCEL_ZERO_POS}%`, width: `${pct}%` };
});

// ── Plain-language context labels ─────────────────────────────────────────
const compositeContextLabel = computed(() => {
  const v = compositeValue.value;
  // Percentile-based: composite is itself a percentile composite so it already
  // ranks the narrative against the whole population for the day.
  if (v >= 0.95) return $i18n.t('narratives.indicators.composite.context.top5');
  if (v >= 0.85) return $i18n.t('narratives.indicators.composite.context.top15');
  if (v >= 0.70) return $i18n.t('narratives.indicators.composite.context.top30');
  if (v >= 0.55) return $i18n.t('narratives.indicators.composite.context.top45');
  if (v >= 0.30) return $i18n.t('narratives.indicators.composite.context.middle');
  return $i18n.t('narratives.indicators.composite.context.low');
});

const accelContextLabel = computed(() => {
  const v = accelerationValue.value;
  if (v >= 2.0) return $i18n.t('narratives.indicators.acceleration.context.explosive');
  if (v >= 1.5) return $i18n.t('narratives.indicators.acceleration.context.fast');
  if (v >= 1.0) return $i18n.t('narratives.indicators.acceleration.context.notable');
  if (v >= 0.5) return $i18n.t('narratives.indicators.acceleration.context.modest');
  return $i18n.t('narratives.indicators.acceleration.context.flat');
});

// ── Why this level + path to next ─────────────────────────────────────────
// Mirrors the threshold logic in backend/core/narratives/service.py
// (update_narrative_alert_levels). Keep in sync.
const conditions = computed<{ met: boolean; text: string }[]>(() => {
  const c = compositeValue.value;
  const a = accelerationValue.value;
  switch (levelKey.value) {
    case NarrativeAlertLevel.VIRAL:
      return [
        { met: c > 0.85, text: $i18n.t('narratives.indicators.cond.compositeAbove', { v: 0.85, actual: c.toFixed(2) }) },
        { met: a > 1.0, text: $i18n.t('narratives.indicators.cond.accelAbove', { v: 1.0, actual: a.toFixed(2) }) },
      ];
    case NarrativeAlertLevel.ALERT:
      return [
        { met: c > 0.70, text: $i18n.t('narratives.indicators.cond.compositeAbove', { v: 0.70, actual: c.toFixed(2) }) },
        { met: a > 1.5, text: $i18n.t('narratives.indicators.cond.accelAbove', { v: 1.5, actual: a.toFixed(2) }) },
      ];
    case NarrativeAlertLevel.EARLY_SURGE:
      return [
        { met: c < 0.65, text: $i18n.t('narratives.indicators.cond.compositeBelow', { v: 0.65, actual: c.toFixed(2) }) },
        { met: a > 2.0, text: $i18n.t('narratives.indicators.cond.accelAbove', { v: 2.0, actual: a.toFixed(2) }) },
      ];
    case NarrativeAlertLevel.WATCH:
      // Two paths to WATCH: standard (composite > 0.55 AND accel > 1.2),
      // or plateaued-popular (composite > 0.85 alone). Show whichever path matched.
      if (c > 0.85) {
        return [
          { met: true, text: $i18n.t('narratives.indicators.cond.plateauedPopular', { actual: c.toFixed(2) }) },
        ];
      }
      return [
        { met: c > 0.55, text: $i18n.t('narratives.indicators.cond.compositeAbove', { v: 0.55, actual: c.toFixed(2) }) },
        { met: a > 1.2, text: $i18n.t('narratives.indicators.cond.accelAbove', { v: 1.2, actual: a.toFixed(2) }) },
      ];
    case NarrativeAlertLevel.NONE:
    default:
      return [{ met: false, text: $i18n.t('narratives.indicators.cond.noneReason') }];
  }
});

const pathToNext = computed<string | null>(() => {
  const c = compositeValue.value;
  const a = accelerationValue.value;
  switch (levelKey.value) {
    case NarrativeAlertLevel.VIRAL:
      return null; // max level
    case NarrativeAlertLevel.ALERT:
      return $i18n.t('narratives.indicators.toReach.viral', {
        composite: Math.max(0, 0.85 - c).toFixed(2),
        accel: Math.max(0, 1.0 - a).toFixed(2),
      });
    case NarrativeAlertLevel.WATCH:
      return $i18n.t('narratives.indicators.toReach.alert', {
        composite: Math.max(0, 0.70 - c).toFixed(2),
        accel: Math.max(0, 1.5 - a).toFixed(2),
      });
    case NarrativeAlertLevel.EARLY_SURGE:
      return $i18n.t('narratives.indicators.toReach.alert', {
        composite: Math.max(0, 0.70 - c).toFixed(2),
        accel: Math.max(0, 1.5 - a).toFixed(2),
      });
    case NarrativeAlertLevel.NONE:
    default:
      return $i18n.t('narratives.indicators.toReach.watch', {
        composite: Math.max(0, 0.55 - c).toFixed(2),
        accel: Math.max(0, 1.2 - a).toFixed(2),
      });
  }
});

// ── Technical details ─────────────────────────────────────────────────────
const compositeParts = computed(() => {
  const m = current.value?.composite_virality.metadata;
  return [
    { key: 'engagement', value: m?.engagement_percentile ?? 0, weight: m?.engagement_weight ?? 0 },
    { key: 'reach',      value: m?.reach_percentile ?? 0,      weight: m?.reach_weight ?? 0 },
    { key: 'velocity',   value: m?.velocity_percentile ?? 0,   weight: m?.velocity_weight ?? 0 },
  ];
});

const accelerationParts = computed(() => {
  const m = current.value?.acceleration_rate.metadata;
  return [
    { key: 'engagement', value: m?.change_engagement ?? 0,   weight: m?.engagement_weight ?? 0 },
    { key: 'videoVolume', value: m?.change_video_count ?? 0, weight: m?.video_volume_weight ?? 0 },
    { key: 'views',      value: m?.change_views ?? 0,        weight: m?.views_weight ?? 0 },
  ];
});

const THRESHOLDS = [
  { level: NarrativeAlertLevel.VIRAL,       condition: 'composite > 0.85  ∧  acceleration > 1.0' },
  { level: NarrativeAlertLevel.ALERT,       condition: 'composite > 0.70  ∧  acceleration > 1.5' },
  { level: NarrativeAlertLevel.EARLY_SURGE, condition: 'composite < 0.65  ∧  acceleration > 2.0' },
  { level: NarrativeAlertLevel.WATCH,       condition: '(composite > 0.55  ∧  accel > 1.2)  ∨  composite > 0.85' },
  { level: NarrativeAlertLevel.NONE,        condition: '—' },
];

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

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

// ── Data loading ──────────────────────────────────────────────────────────
async function load() {
  loading.value = true;
  try {
    // Single bulk fetch — backend returns up to HISTORY_DAYS entries (only
    // those that exist). We then align them by calendar date into a fixed-
    // length array so the sparkline has consistent x-spacing with gaps.
    const series = await apiService.getNarrativeAnalysisIndicatorsHistory(
      props.narrativeId,
      HISTORY_DAYS,
    );
    const byDate = new Map(series.map((s) => [s.date, s]));
    const aligned: (NarrativeAnalysisIndicatorsResponse | null)[] = [];
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      aligned.push(byDate.get(d.toISOString().slice(0, 10)) ?? null);
    }
    history.value = aligned;
    // Prefer the most recent entry the backend actually returned, regardless
    // of whether today's recalc has run yet.
    current.value = series[series.length - 1] ?? null;
  } catch (e) {
    console.error('Failed to load indicators history:', e);
    current.value = null;
    history.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => props.narrativeId, load);
onMounted(load);
</script>
