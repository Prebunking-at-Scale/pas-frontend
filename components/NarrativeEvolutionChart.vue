<template>
  <div class="flex flex-col h-full">
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-4">
      <button
        @click="activeTab = 'absolute'"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
          activeTab === 'absolute'
            ? 'text-emerald-700 border-emerald-700'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        ]"
      >
        Absolute Numbers
      </button>
      <button
        @click="activeTab = 'normalised'"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
          activeTab === 'normalised'
            ? 'text-emerald-700 border-emerald-700'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        ]"
      >
        Normalised
      </button>
    </div>

    <!-- Chart -->
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
      This chart shows the cumulative evolution of the narrative over time. <br />
      <span class="font-bold text-blue-500">Views</span> use the left axis,
      while <span class="font-bold text-red-500">Likes</span> and <span class="font-bold text-black">Comments</span> share the right axis.
    </p>
    <p v-else class="text-xs text-gray-500 mt-3 text-center flex-shrink-0">
      All metrics are scaled from 0% to 100% of their maximum value. <br />
      Lines that rise together indicate correlated engagement, while diverging lines show independent growth patterns.
      This helps identify if likes and comments grow proportionally with views.
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
import type { Video } from '~/types/api';

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
  videos: Video[];
  locale?: string;
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'en'
});

// Active tab state
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

// Calculate cumulative data
const chartData = computed(() => {
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

  const labels: string[] = [];
  const viewsData: number[] = [];
  const likesData: number[] = [];
  const commentsData: number[] = [];

  sortedDates.forEach(([, data]) => {
    // Add to cumulative totals
    cumulativeViews += data.views;
    cumulativeLikes += data.likes;
    cumulativeComments += data.comments;

    // Create label
    const dateLabel = formatDate(data.date.toISOString(), props.locale);
    labels.push(dateLabel);

    // Store cumulative data
    viewsData.push(cumulativeViews);
    likesData.push(cumulativeLikes);
    commentsData.push(cumulativeComments);
  });

  return {
    labels,
    datasets: [
      {
        label: 'Views',
        data: viewsData,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y' // left axis
      },
      {
        label: 'Likes',
        data: likesData,
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1' // right axis (shared with comments)
      },
      {
        label: 'Comments',
        data: commentsData,
        borderColor: 'rgb(0, 0, 0)', // black
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1' // right axis (shared with likes)
      }
    ]
  };
});

// Calculate normalised data for trend comparison
const normalisedChartData = computed(() => {
  // Get the same data as the absolute chart
  const absoluteData = chartData.value;
  const viewsData = absoluteData.datasets[0].data;
  const likesData = absoluteData.datasets[1].data;
  const commentsData = absoluteData.datasets[2].data;

  // Find max values for normalisation
  const maxViews = Math.max(...viewsData, 1);
  const maxLikes = Math.max(...likesData, 1);
  const maxComments = Math.max(...commentsData, 1);

  // Normalise data to 0-100%
  const normalisedViewsData = viewsData.map(v => (v / maxViews) * 100);
  const normalisedLikesData = likesData.map(l => (l / maxLikes) * 100);
  const normalisedCommentsData = commentsData.map(c => (c / maxComments) * 100);

  return {
    labels: absoluteData.labels,
    datasets: [
      {
        label: `Views (max: ${maxViews.toLocaleString()})`,
        data: normalisedViewsData,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: false,
        originalMax: maxViews
      },
      {
        label: `Likes (max: ${maxLikes.toLocaleString()})`,
        data: normalisedLikesData,
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false,
        originalMax: maxLikes
      },
      {
        label: `Comments (max: ${maxComments.toLocaleString()})`,
        data: normalisedCommentsData,
        borderColor: 'rgb(0, 0, 0)', // black
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        tension: 0.4,
        fill: false,
        originalMax: maxComments
      }
    ]
  };
});

// Custom plugin to draw colored Y-axis titles
const customPlugin = {
  id: 'customYAxisTitles',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const yScale = chart.scales.y;
    const y1Scale = chart.scales.y1;

    ctx.save();

    // Draw left Y-axis title (Views) in blue
    ctx.translate(15, yScale.top + (yScale.bottom - yScale.top) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgb(59, 130, 246)';
    ctx.fillText('Views', 0, -40);  // Offset from axis
    ctx.restore();

    // Draw right Y-axis title (Likes & Comments)
    ctx.save();
    ctx.translate(chart.width - 15, y1Scale.top + (y1Scale.bottom - y1Scale.top) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px sans-serif';

    // Draw "Likes" in red
    ctx.fillStyle = 'rgb(239, 68, 68)';
    ctx.fillText('Likes', -20, -40);

    // Draw "&" in gray
    ctx.fillStyle = 'rgb(156, 163, 175)';
    ctx.fillText('&', 0, -40);

    // Draw "Comments" in black
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillText('Comments', 35, -40);

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
        padding: 15,
        generateLabels: function(chart: any) {
          const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);

          labels.forEach((label) => {
            if (label.text.includes('Views')) {
              label.fillStyle = 'rgb(59, 130, 246)';
              label.strokeStyle = 'rgb(59, 130, 246)';
            } else if (label.text.includes('Likes')) {
              label.fillStyle = 'rgb(239, 68, 68)';
              label.strokeStyle = 'rgb(239, 68, 68)';
            } else if (label.text.includes('Comments')) {
              label.fillStyle = 'rgb(0, 0, 0)';
              label.strokeStyle = 'rgb(0, 0, 0)';
            }
          });

          return labels;
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toLocaleString();
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date'
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
      ticks: {
        color: 'rgb(59, 130, 246)', // blue for views
        callback: function(value: any) {
          // Format large numbers (e.g., 1.5M instead of 1500000)
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K';
          }
          return value.toLocaleString();
        }
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: false // We draw our own colored title
      },
      beginAtZero: true,
      grid: {
        drawOnChartArea: false // only want grid lines for primary axis
      },
      ticks: {
        color: 'rgb(107, 114, 128)', // gray for shared axis
        callback: function(value: any) {
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K';
          }
          return value.toLocaleString();
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

// Chart options for normalised view
const normalisedChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        generateLabels: function(chart: any) {
          const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);

          labels.forEach((label) => {
            if (label.text.includes('Views')) {
              label.fillStyle = 'rgb(59, 130, 246)';
              label.strokeStyle = 'rgb(59, 130, 246)';
            } else if (label.text.includes('Likes')) {
              label.fillStyle = 'rgb(239, 68, 68)';
              label.strokeStyle = 'rgb(239, 68, 68)';
            } else if (label.text.includes('Comments')) {
              label.fillStyle = 'rgb(0, 0, 0)';
              label.strokeStyle = 'rgb(0, 0, 0)';
            }
          });

          return labels;
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: function(context: any) {
          const dataset = context.dataset;
          const percentage = context.parsed.y?.toFixed(1) || '0';
          const label = dataset.label || '';

          // Extract metric name and max value
          const matches = label.match(/^(\w+)\s*\(max:\s*([\d,]+)\)/);
          if (matches && dataset.originalMax) {
            const metric = matches[1];
            const actualValue = Math.round((context.parsed.y / 100) * dataset.originalMax);
            return `${metric}: ${actualValue.toLocaleString()} (${percentage}%)`;
          }

          return `${label}: ${percentage}%`;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date'
      },
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
        text: 'Percentage of Maximum (%)'
      },
      beginAtZero: true,
      max: 105, // Add 5% padding to prevent clipping
      ticks: {
        callback: function(value: any) {
          return value + '%';
        },
        stepSize: 20 // Keep nice round numbers (0, 20, 40, 60, 80, 100)
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