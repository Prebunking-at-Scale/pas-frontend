<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-vue-next'

const { t } = useI18n();

const props = withDefaults(defineProps<{
  rating: number | null
  canUpdate?: boolean
}>(), {
  canUpdate: true
})

const emit = defineEmits<{
  (e: 'rate', rating: number): void
}>()

const handleStarClick = (starRating: number) => {
  hoveredStar.value = starRating - 1
  emit('rate', starRating)
}

// Hover state management
const hoveredStar = ref<number | null>(null)

const setHoverStar = (starIndex: number | null) => {
  if (props.canUpdate) {
    hoveredStar.value = starIndex
  }
}

const ratingTooltipIndicators = [
  t('feedback.rating.oneStar'),
  t('feedback.rating.twoStars'),
  t('feedback.rating.threeStars'),
  t('feedback.rating.fourStars'),
  t('feedback.rating.fiveStars')
]

</script>

<template>
  <div class="flex justify-center gap-1" @mouseleave="setHoverStar(null)">
    <template v-for="starIndex in 5" :key="starIndex">
      <UTooltip
        :text="props.canUpdate ? ratingTooltipIndicators[starIndex - 1] : t('feedback.alreadyRated')"
        :ui="{ content: 'z-[100]' }"
      >
        <Button
          @click="handleStarClick(starIndex)"
          @mouseenter="setHoverStar(starIndex)"
          :disabled="!props.canUpdate && props.rating !== null"
          variant="outline"
          size="icon"
          class="h-8 w-8 transition-colors duration-200"
        >
          <Star 
            class="size-4 transition-colors duration-200" 
            :class="{
              'fill-current text-yellow-400': (props.rating !== null && starIndex <= props.rating) || (hoveredStar !== null && starIndex <= hoveredStar),
              'text-gray-400': (props.rating === null || starIndex > props.rating) && (hoveredStar === null || starIndex > hoveredStar),
              'text-yellow-200': hoveredStar !== null && starIndex <= hoveredStar && props.rating === null
            }"
          />
        </Button>
      </UTooltip>
    </template>
  </div>
</template>