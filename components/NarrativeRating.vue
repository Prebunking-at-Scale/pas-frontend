<script setup lang="ts">
// Compact, read-only rating indicator: a star emoji + the average score on a
// 0-5 scale. Shown the same way on narrative cards and the narrative detail
// page. Falls back to "–" when the narrative has no ratings yet.
const MAX_STARS = 5;

const props = withDefaults(defineProps<{
  averageScore?: number | null; // 0-1 average, or null/undefined when none
  scoreCount?: number;          // number of ratings
  showCount?: boolean;          // render the review count next to the score
}>(), {
  averageScore: null,
  scoreCount: 0,
  showCount: false,
});

const { t } = useI18n();

const hasRating = computed(
  () => props.averageScore !== null && props.averageScore !== undefined && props.scoreCount > 0,
);

const display = computed(() =>
  hasRating.value ? (props.averageScore! * MAX_STARS).toFixed(1) : '–',
);

const tooltip = computed(() =>
  hasRating.value
    ? t('narratives.feedback.reviewCount', props.scoreCount)
    : t('narratives.feedback.noReviews'),
);
</script>

<template>
  <UTooltip :text="tooltip">
    <span class="flex items-center gap-1 text-xs text-gray-500">
      ⭐ {{ display }}
      <template v-if="showCount && hasRating">
        · {{ t('narratives.feedback.reviewCount', scoreCount) }}
      </template>
    </span>
  </UTooltip>
</template>
