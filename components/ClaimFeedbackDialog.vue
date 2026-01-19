<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('feedback.send') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('narratives.feedback.claimRelatedQuestion') }}
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <!-- Loading State -->
        <div v-if="dialogsStore.isClaimFeedbackLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <!-- Feedback Component -->
        <LikeDislikeFeedback 
          v-else
          @like="() => handleVote(LIKE_VOTE)" 
          @dislike="() => handleVote(DISLIKE_VOTE)" 
          :vote="dialogsStore.claimFeedbackDialog.claimFeedbackScore" 
          :can-update="false" 
        />
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useNarrativeDialogsStore } from '~/stores/narrativesDialogs'
import LikeDislikeFeedback from './LikeDislikeFeedback.vue'

const { t } = useI18n();
const toast = useToast()

const dialogsStore = useNarrativeDialogsStore()
const dialogOpen = computed({
  get: () => dialogsStore.isClaimFeedbackDialogOpen,
  set: (value) => {
    if (!value) {
      dialogsStore.closeClaimFeedbackDialog()
    }
  }
})

const LIKE_VOTE = 1
const DISLIKE_VOTE = 0

const handleVote = async (vote: number) => {
  const infoToast = toast.add({
    title: t('feedback.sending'),
    color: 'info',
    progress: false,
  })

  const response = await dialogsStore.sendClaimFeedback(vote)
  dialogsStore.closeClaimFeedbackDialog()
  if (!response) {
    toast.update( infoToast.id, {
      title: t('feedback.error'),
      color: 'error',
      progress: true,
    })
    return
  }
  toast.update( infoToast.id, {
    title: t('feedback.success'),
    color: 'success',
    progress: true,
  })
}

</script>