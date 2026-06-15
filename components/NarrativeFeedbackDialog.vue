<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="text-center">
          {{ $t('feedback.send') }}
        </DialogTitle>
      </DialogHeader>
      <div>
        <div v-if="dialogsStore.isNarrativeFeedbackLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else class="flex flex-col gap-y-3 text-center text-sm text-muted-foreground">
          {{ $t('narratives.feedback.narrativeGenerationQuestion') }}
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
import { useNarrativeDialogsStore } from '~/stores/narrativeDialogs'
import FiveStarsFeedback from './FiveStarsFeedback.vue'

const { t } = useI18n();
const toast = useToast()
const dialogsStore = useNarrativeDialogsStore()

const receivedRating = ref<number | null>(dialogsStore.narrativeFeedbackDialog.narrativeFeedbackRating)
const comment = ref<string>(dialogsStore.narrativeFeedbackDialog.narrativeFeedbackComment || '')
const isSubmitting = ref(false)

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
  if (receivedRating.value === null) return

  try {
    isSubmitting.value = true
    const infoToast = toast.add({
      title: t('feedback.sending'),
      color: 'info',
      progress: false,
    })

    const response = await dialogsStore.sendNarrativeFeedback(receivedRating.value, comment.value)
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
