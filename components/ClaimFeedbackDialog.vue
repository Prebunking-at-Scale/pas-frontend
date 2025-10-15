<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('common.sendFeedback') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('narratives.claimsRelatedFeedback') }}
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
          @like="handleLike" 
          @dislike="handleDislike" 
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

const handleLike = async () => {
  await dialogsStore.sendClaimFeedback(LIKE_VOTE)
  dialogsStore.closeClaimFeedbackDialog()
  toast.add({
    title: 'Thank you for your feedback!',
    color: 'success'
  })
}

const handleDislike = async () => {
  await dialogsStore.sendClaimFeedback(DISLIKE_VOTE)
  dialogsStore.closeClaimFeedbackDialog()
  toast.add({
    title: 'Thank you for your feedback!',
    color: 'success'
  })
}

</script>