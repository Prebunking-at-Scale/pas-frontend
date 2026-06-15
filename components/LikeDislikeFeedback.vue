<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const LIKE_VOTE = 1
const DISLIKE_VOTE = 0

const props = withDefaults(defineProps<{
  vote: number | null
  disabled?: boolean
  canUpdate?: boolean
}>(), {
  canUpdate: true
})

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'dislike'): void
}>()

const handleLike = () => {
  emit('like')
}

const handleDislike = () => {
  emit('dislike')
}

const hoveredButton = ref<number | null>(null)

const setHoverButton = (buttonType: number | null) => {
  const isEnabled = props.canUpdate || props.vote === null;
  if (isEnabled) {
    hoveredButton.value = buttonType
  }
}
</script>

<template>
  <div class="flex justify-center" @mouseleave="setHoverButton(null)">
    <UTooltip :text="props.vote === null ? t('common.yes') : t('feedback.alreadyRated')">
      <Button
        @click="handleLike"
        @mouseenter="setHoverButton(LIKE_VOTE)"
        :disabled="props.disabled || (!props.canUpdate && props.vote !== null)"
        variant="ghost"
        size="icon"
        class="transition-colors duration-200"
      >
        <ThumbsUp
          class="size-4 transition-colors duration-200"
          :class="{
            'text-emerald-600 fill-emerald-600': props.vote === LIKE_VOTE,
            'text-emerald-500 hover:text-emerald-600': hoveredButton === LIKE_VOTE && props.vote === null,
            'text-gray-500 hover:text-gray-600': hoveredButton !== LIKE_VOTE && props.vote !== LIKE_VOTE
          }"
        />
      </Button>
    </UTooltip>
    <UTooltip :text="props.vote === null ? t('common.no') : t('feedback.alreadyRated')">
      <Button
        @click="handleDislike"
        @mouseenter="setHoverButton(DISLIKE_VOTE)"
        :disabled="props.disabled || (!props.canUpdate && props.vote !== null)"
        variant="ghost"
        size="icon"
        class="ml-4 transition-colors duration-200"
      >
        <ThumbsDown
          class="size-4 transition-colors duration-200"
          :class="{
            'text-red-600 fill-red-600': props.vote === DISLIKE_VOTE,
            'text-red-500 hover:text-red-600': hoveredButton === DISLIKE_VOTE && props.vote === null,
            'text-gray-500 hover:text-gray-600': hoveredButton !== DISLIKE_VOTE && props.vote !== DISLIKE_VOTE
          }"
        />
      </Button>
    </UTooltip>
  </div>
</template>
