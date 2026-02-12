<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="text-center">
          {{ $t('feedback.send') }}
        </DialogTitle>
      </DialogHeader>
      <div>
        <!-- Loading State -->
        <div v-if="dialogsStore.isNarrativeFeedbackLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else class="flex flex-col gap-y-3 text-center text-sm text-muted-foreground">
          {{ $t('narratives.feedback.narrativeGenerationQuestion') }}
          <!-- Feedback Component -->
          <FiveStarsFeedback 
            :rating="receivedRating" 
            :can-update="canEditFeedback" 
            @rate="handleRating" 
          />
          <Textarea 
            v-model="comment" 
            rows="3" 
            :placeholder="$t('feedback.addComment')" 
            :disabled="!canEditFeedback" 
          />
          <Button 
            :disabled="!canEditFeedback || receivedRating === null || isSubmitting" 
            class="w-full" 
            @click="handleSubmit"
          >
            {{ canEditFeedback ? $t('feedback.send') : $t('feedback.alreadyRated') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useNarrativeDialogsStore } from '~/stores/narrativesDialogs'
import FiveStarsFeedback from './FiveStarsFeedback.vue'

const { t } = useI18n();
const toast = useToast()
const dialogsStore = useNarrativeDialogsStore()

const MAX_NUMBER_OF_STARS = 5

const receivedRating = ref<number | null>(dialogsStore.narrativeFeedbackDialog.narrativeFeedbackRating)
const comment = ref<string>(dialogsStore.narrativeFeedbackDialog.narrativeFeedbackComment || '')
const isSubmitting = ref(false)

// Sync values from the store when the dialog opens or the feedback changes
watch(
  () => dialogsStore.narrativeFeedbackDialog,
  (newFeedback) => {
    receivedRating.value = newFeedback.narrativeFeedbackRating
    comment.value = newFeedback.narrativeFeedbackComment || ''
  },
  { deep: true }
)

const dialogOpen = computed({
  get: () => dialogsStore.isNarrativeFeedbackDialogOpen,
  set: (value) => {
    if (!value) {
      dialogsStore.closeNarrativeFeedbackDialog()
    }
  }
})

const canEditFeedback = computed(() => dialogsStore.narrativeFeedbackDialog.narrativeFeedbackRating === null)

const handleRating = (rating: number) => {
  receivedRating.value = rating
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    if (receivedRating.value === null) {
      return
    }

    const infoToast = toast.add({
      title: t('feedback.sending'),
      color: 'info',
      progress: false,
    })

    // Convert rating (1-5) to score (0-1)
    const score = receivedRating.value / MAX_NUMBER_OF_STARS
    const response = await dialogsStore.sendNarrativeFeedback(score, comment.value)
    
    dialogsStore.closeNarrativeFeedbackDialog()
    
    if (!response) {
      toast.update(infoToast.id, {
        title: t('feedback.error'),
        color: 'error',
        progress: true,
      })
      return
    }
    
    toast.update(infoToast.id, {
      title: t('feedback.success'),
      color: 'success',
      progress: true,
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
