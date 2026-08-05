<template>
  <div class="flex flex-col h-full">
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-4 flex-shrink-0">
      <button
        v-for="tab in (['absolute', 'normalised'] as const)"
        :key="tab"
        type="button"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer',
          activeTab === tab
            ? 'text-emerald-700 border-emerald-700'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        ]"
        @click="activeTab = tab"
      >
        {{ $t(`narratives.evolution.tab.${tab}`) }}
      </button>
    </div>

    <!-- Chart. Two instances rather than one with swapped options: the views differ
         in how many y-axes they have, and reusing the chart leaves the discarded
         scale behind. -->
    <div class="flex-1 min-h-0">
      <Line
        v-if="activeTab === 'absolute'"
        :data="chartData"
        :options="chartOptions"
        :plugins="[customPlugin]"
        class="!h-full"
      />
      <Line
        v-else
        :data="normalisedChartData"
        :options="normalisedChartOptions"
        class="!h-full"
      />
    </div>

    <!-- Explanation Text -->
    <p v-if="activeTab === 'absolute'" class="text-xs text-gray-500 mt-3 text-center flex-shrink-0">
      {{ $t('narratives.evolution.reachExplanation') }} <br />
      {{ $t('narratives.evolution.engagementExplanation') }}
    </p>
    <!-- The normalised view repeats the absolute view's description and adds a line,
         so the reader is told what the two variables ARE before being told they have
         been rescaled. The *Plain variants drop the "(left axis)" / "(right axis)"
         parentheticals: this view has one shared axis, so naming sides would describe
         a layout that is not on screen. -->
    <p v-else class="text-xs text-gray-500 mt-3 text-center flex-shrink-0">
      {{ $t('narratives.evolution.reachExplanationPlain') }} <br />
      {{ $t('narratives.evolution.engagementExplanationPlain') }} <br />
      {{ $t('narratives.evolution.normalisedNote') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { Video, NarrativeStatsDataPoint } from '~/types/api';
import {
  engagementRate,
  formatEngagementRate,
  engagementRateDecimals,
  engagementAxisBounds,
  type EngagementWeights
} from '~/utils/engagement';
import { alignedBounds, bestTickCount, symmetricBounds } from '~/utils/chartAxis';
import { zScores, formatZScore } from '~/utils/normalise';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  // New API: pre-computed time series data
  timeSeries?: NarrativeStatsDataPoint[];
  // Legacy: compute from videos array (for backward compatibility)
  videos?: Video[];
  locale?: string;
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'en'
});

const { $i18n } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();

// The weights the backend uses for the engagement axis of the Composite Virality Index.
const likesWeight = computed(() => runtimeConfig.public.viralityScoreLikesWeight as number);
const commentsWeight = computed(() => runtimeConfig.public.viralityScoreCommentsWeight as number);
const weights = computed<EngagementWeights>(() => ({
  likes: likesWeight.value,
  comments: commentsWeight.value
}));

const REACH_COLOR = 'rgb(59, 130, 246)'; // blue-500
const ENGAGEMENT_COLOR = 'rgb(239, 68, 68)'; // red-500

const activeTab = ref<'absolute' | 'normalised'>('absolute');

// Format date for display
const formatDate = (dateString: string | null | undefined, locale: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

/**
 * One point per date: reach is the cumulative view count, engagement is the weighted
 * interactions-per-view rate computed off the *same* cumulative totals — so the rate on
 * a given date describes the narrative as it stood that day, exactly as the backend's
 * engagement score describes it today.
 */
const series = computed(() => {
  const labels: string[] = [];
  const reachData: number[] = [];
  const engagementData: number[] = [];
  // Kept so the tooltip can say what the rate is made of.
  const likesData: number[] = [];
  const commentsData: number[] = [];

  const push = (dateLabel: string, views: number, likes: number, comments: number) => {
    labels.push(dateLabel);
    reachData.push(views);
    // Plotted as a percentage. engagementRate mirrors the backend and returns the
    // raw 0-1 ratio, so the ×100 belongs here, at the display edge, rather than
    // in the shared helper the tests pin to core-api's formula.
    engagementData.push(engagementRate(likes, comments, views, weights.value) * 100);
    likesData.push(likes);
    commentsData.push(comments);
  };

  // Use pre-computed time series data if available (new API)
  if (props.timeSeries && props.timeSeries.length > 0) {
    props.timeSeries.forEach(dataPoint => {
      push(
        formatDate(dataPoint.date, props.locale),
        dataPoint.cumulative_views,
        dataPoint.cumulative_likes,
        dataPoint.cumulative_comments
      );
    });
  }
  // Fallback: compute from videos array (legacy approach)
  else if (props.videos && props.videos.length > 0) {
    // Sort videos by date
    const sortedVideos = [...props.videos].sort((a, b) => {
      const dateA = new Date(a.uploaded_at || a.created_at || '').getTime();
      const dateB = new Date(b.uploaded_at || b.created_at || '').getTime();
      return dateA - dateB;
    });

    // Group videos by date and aggregate their values
    const videosByDate = new Map<string, { views: number; likes: number; comments: number; date: Date }>();

    sortedVideos.forEach(video => {
      const dateStr = video.uploaded_at || video.created_at || '';
      if (!dateStr) return;

      const date = new Date(dateStr);
      const dateKey = date.toISOString().split('T')[0]; // Get YYYY-MM-DD

      if (videosByDate.has(dateKey)) {
        const existing = videosByDate.get(dateKey)!;
        existing.views += video.views || 0;
        existing.likes += video.likes || 0;
        existing.comments += video.comments || 0;
      } else {
        videosByDate.set(dateKey, {
          views: video.views || 0,
          likes: video.likes || 0,
          comments: video.comments || 0,
          date: date
        });
      }
    });

    // Sort dates and calculate cumulative values
    const sortedDates = Array.from(videosByDate.entries()).sort((a, b) =>
      a[1].date.getTime() - b[1].date.getTime()
    );

    let cumulativeViews = 0;
    let cumulativeLikes = 0;
    let cumulativeComments = 0;

    sortedDates.forEach(([, data]) => {
      cumulativeViews += data.views;
      cumulativeLikes += data.likes;
      cumulativeComments += data.comments;

      push(
        formatDate(data.date.toISOString(), props.locale),
        cumulativeViews,
        cumulativeLikes,
        cumulativeComments
      );
    });
  }

  return { labels, reachData, engagementData, likesData, commentsData };
});

const chartData = computed(() => ({
  labels: series.value.labels,
  datasets: [
    {
      label: $i18n.t('narratives.evolution.reach'),
      data: series.value.reachData,
      borderColor: REACH_COLOR,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: false,
      yAxisID: 'y' // left axis
    },
    {
      label: $i18n.t('narratives.evolution.engagement'),
      data: series.value.engagementData,
      borderColor: ENGAGEMENT_COLOR,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: false,
      yAxisID: 'y1' // right axis — a rate, so it cannot share the reach axis
    }
  ]
}));

// Both scales get the SAME number of ticks, so tick i sits at the same height on
// each — that is what puts the right-hand percentage labels on the left-hand
// gridlines instead of between them. The count is chosen from the reach data
// rather than fixed, because a fixed count leaves whatever headroom the rounded
// step happens to cost, and reach is the axis with a hard zero to fit under.
const reachMax = computed(() => Math.max(...series.value.reachData, 0));

// 1e-2 rather than the default 1e-4: the series is in percentage points now, so
// the all-zero floor has to scale with it.
const engagementBounds = computed(() => engagementAxisBounds(series.value.engagementData, 1e-2));

// Both axes are weighed, not just reach — a count that suits reach can stretch the
// engagement line across twice the height it needs.
const tickCount = computed(() => bestTickCount([
  { min: 0, max: reachMax.value, zeroBased: true },
  ...(engagementBounds.value ? [engagementBounds.value] : []),
]));

const reachScale = computed(() => alignedBounds(
  0,
  reachMax.value,
  tickCount.value,
  true // reach is a count; its axis starts at zero
));

const engagementScale = computed(() => {
  const b = engagementBounds.value;
  if (!b) return null;
  return alignedBounds(b.min, b.max, tickCount.value);
});

// Abbreviate large view counts (1.5M rather than 1500000)
const formatReach = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K';
  }
  return value.toLocaleString();
};

// Custom plugin to draw colored Y-axis titles
const customPlugin = {
  id: 'customYAxisTitles',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const yScale = chart.scales.y;
    const y1Scale = chart.scales.y1;

    ctx.save();

    // Draw left Y-axis title (Reach) in blue
    ctx.translate(15, yScale.top + (yScale.bottom - yScale.top) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = REACH_COLOR;
    ctx.fillText($i18n.t('narratives.evolution.reach'), 0, -40); // Offset from axis
    ctx.restore();

    // Draw right Y-axis title (Engagement) in red
    ctx.save();
    ctx.translate(chart.width - 15, y1Scale.top + (y1Scale.bottom - y1Scale.top) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = ENGAGEMENT_COLOR;
    ctx.fillText($i18n.t('narratives.evolution.engagement'), 0, -40);

    ctx.restore();
  }
};

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || '';
          if (context.parsed.y === null || context.parsed.y === undefined) return label;

          // The engagement line is a percentage; the reach line is a count.
          if (context.dataset.yAxisID === 'y1') {
            return `${label}: ${formatEngagementRate(context.parsed.y, 2)}%`;
          }
          return `${label}: ${context.parsed.y.toLocaleString()}`;
        },
        // Spell out what the rate was computed from — a ratio on its own hides whether
        // it moved because interactions rose or because views did.
        afterBody: function(contexts: any[]) {
          const index = contexts[0]?.dataIndex;
          if (index === undefined) return [];
          return [
            $i18n.t('narratives.evolution.tooltipBreakdown', {
              likes: (series.value.likesData[index] ?? 0).toLocaleString(),
              comments: (series.value.commentsData[index] ?? 0).toLocaleString()
            })
          ];
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: $i18n.t('narratives.evolution.date')
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 15 // Show max 15 dates on X-axis to prevent overcrowding
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: false // We draw our own colored title
      },
      beginAtZero: true,
      min: reachScale.value.min,
      max: reachScale.value.max,
      ticks: {
        color: REACH_COLOR,
        count: tickCount.value,
        callback: (value: any) => formatReach(value)
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: false // We draw our own colored title
      },
      // Deliberately not zero-based (the rate lives in a narrow band), but padded to a
      // minimum width so a flat rate is drawn flat rather than as amplified float noise,
      // then widened again so its ticks land on round percentages.
      ...(engagementScale.value
        ? { min: engagementScale.value.min, max: engagementScale.value.max }
        : {}),
      grid: {
        drawOnChartArea: false // only want grid lines for primary axis
      },
      ticks: {
        color: ENGAGEMENT_COLOR,
        // Same count as the left axis: this is what aligns the labels with the grid.
        count: tickCount.value,
        // Precision follows the tick step: at a fixed decimal count a narrow band
        // prints the same label on every gridline. One decimal is the floor on a
        // percentage axis (5.1%), more only when the steps are finer than that.
        callback: (value: any, _index: number, ticks: any[]) => {
          const step = ticks && ticks.length > 1
            ? Math.abs(ticks[1].value - ticks[0].value)
            : 0;
          return `${formatEngagementRate(value, engagementRateDecimals(step, 1))}%`;
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}));

// --------------------------------------------------------------------------
// Normalised view: both series as z-scores, on one shared axis.
// --------------------------------------------------------------------------
const normalised = computed(() => ({
  reach: zScores(series.value.reachData),
  engagement: zScores(series.value.engagementData)
}));

// One axis for both lines, so the range has to cover whichever strays furthest.
const normalisedScale = computed(() => {
  const all = [...normalised.value.reach, ...normalised.value.engagement].filter(v => isFinite(v));
  return symmetricBounds(Math.max(...all.map(Math.abs), 1));
});

const normalisedChartData = computed(() => ({
  labels: series.value.labels,
  datasets: [
    {
      label: $i18n.t('narratives.evolution.reach'),
      data: normalised.value.reach,
      borderColor: REACH_COLOR,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: false
    },
    {
      label: $i18n.t('narratives.evolution.engagement'),
      data: normalised.value.engagement,
      borderColor: ENGAGEMENT_COLOR,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: false
    }
  ]
}));

const normalisedChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { usePointStyle: true, padding: 15 }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        // The z-score is the comparable number, but on its own it is unreadable —
        // "+1.42" says nothing about what was actually reached. The raw value rides
        // along in brackets.
        label: function(context: any) {
          const label = context.dataset.label || '';
          const z = context.parsed.y;
          if (z === null || z === undefined) return label;
          const index = context.dataIndex;
          const raw = context.datasetIndex === 0
            ? formatReach(series.value.reachData[index] ?? 0)
            : `${formatEngagementRate(series.value.engagementData[index] ?? 0, 2)}%`;
          return `${label}: ${formatZScore(z)} σ (${raw})`;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: { display: true, text: $i18n.t('narratives.evolution.date') },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 15
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: $i18n.t('narratives.evolution.standardDeviations')
      },
      min: normalisedScale.value.min,
      max: normalisedScale.value.max,
      ticks: {
        count: normalisedScale.value.count,
        callback: (value: any) => formatZScore(value, 1)
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}));
</script>
