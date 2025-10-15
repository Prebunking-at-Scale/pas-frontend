import { defineStore } from 'pinia';
import { apiService } from '~/services/api';
import type { Claim, Narrative } from '~/types/api';

interface ClaimFeedbackDialogState {
  isOpen: boolean;
  selectedClaim: Claim | null;
  selectedNarrative: Narrative | null;
  claimFeedbackScore: 'like' | 'dislike' | null; // 'like' for 1, 'dislike' for 0, null for no feedback
  loading: boolean;
}

export const useNarrativeDialogsStore = defineStore('narrativeDialogs', {
  state: () => ({
    claimFeedbackDialog: {
      isOpen: false,
      selectedClaim: null,
      selectedNarrative: null,
      loading: false,
      claimFeedbackScore: null,
    } as ClaimFeedbackDialogState,
  }),

  actions: {
    async openClaimFeedbackDialog(claim: Claim, narrative: Narrative) {
      this.claimFeedbackDialog.isOpen = true;
      this.claimFeedbackDialog.loading = true;
      this.claimFeedbackDialog.selectedClaim = claim;
      this.claimFeedbackDialog.selectedNarrative = narrative;
      const feedbackResponse = await apiService.getClaimFeedback(claim.id, narrative.id);
      this.claimFeedbackDialog.claimFeedbackScore = feedbackResponse ? (feedbackResponse.feedback_score === 1 ? 'like' : 'dislike') : null;
      this.claimFeedbackDialog.loading = false;
    },
    closeClaimFeedbackDialog() {
      this.claimFeedbackDialog.isOpen = false;
      this.claimFeedbackDialog.selectedClaim = null;
      this.claimFeedbackDialog.selectedNarrative = null;
    },
    async sendClaimFeedback(score: number) {
      this.claimFeedbackDialog.claimFeedbackScore = score === 1 ? 'like' : 'dislike';
      return await apiService.sendClaimFeedback(this.claimFeedbackDialog.selectedClaim!.id, this.claimFeedbackDialog.selectedNarrative!.id, score).catch((error) => {
        console.error('Error sending claim feedback:', error);
        return null;
      });
    },
  },

  getters: {
    isClaimFeedbackDialogOpen: (state) => state.claimFeedbackDialog.isOpen,
    isClaimFeedbackLoading: (state) => state.claimFeedbackDialog.loading,
  },
});
