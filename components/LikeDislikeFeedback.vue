<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  vote: "like" | "dislike" | null
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

// Hover state management
const hoveredButton = ref<"like" | "dislike" | null>(null)

const setHoverButton = (buttonType: "like" | "dislike" | null) => {
  // Allow hover only when buttons are enabled
  const isEnabled = props.canUpdate || props.vote === null;
  if (isEnabled) {
    hoveredButton.value = buttonType
  }
}

</script>

<template>
  <div class="flex justify-center" @mouseleave="setHoverButton(null)">
    <UTooltip :text="vote === null ? t('common.yes') : t('feedback.alreadyRated')">
      <Button 
        @click="handleLike" 
        @mouseenter="setHoverButton('like')"
        :disabled="props.disabled || (!props.canUpdate && props.vote !== null)" 
        variant="ghost"
        size="icon"
        class="transition-colors duration-200"
      >
        <ThumbsUp 
          class="size-4 transition-colors duration-200" 
          :class="{
            'text-emerald-600 fill-emerald-600': props.vote === 'like',
            'text-emerald-500 hover:text-emerald-600': hoveredButton === 'like' && !props.vote,
            'text-gray-500 hover:text-gray-600': hoveredButton !== 'like' && !props.vote && props.vote !== 'like'
          }"
        />
      </Button>
    </UTooltip>
    <UTooltip :text="vote === null ? t('common.no') : t('feedback.alreadyRated')">
      <Button 
        @click="handleDislike" 
        @mouseenter="setHoverButton('dislike')"
        :disabled="props.disabled || (!props.canUpdate && props.vote !== null)"
        variant="ghost"
        size="icon"
        class="ml-4 transition-colors duration-200"
      >
        <ThumbsDown 
          class="size-4 transition-colors duration-200" 
          :class="{
            'text-red-600 fill-red-600': props.vote === 'dislike',
            'text-red-500 hover:text-red-600': hoveredButton === 'dislike' && !props.vote,
            'text-gray-500 hover:text-gray-600': hoveredButton !== 'dislike' && !props.vote && props.vote !== 'dislike'
          }"
        />
      </Button>
    </UTooltip>
  </div>
</template>