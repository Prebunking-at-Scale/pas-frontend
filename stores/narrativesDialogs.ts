import { defineStore } from 'pinia';
import { apiService } from '~/services/api';
import type { Claim, Narrative } from '~/types/api';

interface ClaimFeedbackDialogState {
  isOpen: boolean;
  selectedClaim: Claim | null;
  selectedNarrative: Narrative | null;
  claimFeedbackScore: number | null; // 1 or 0, null for no feedback provided yet
  claimFeedbackComment: string | null; // Optional comment from the user
  loading: boolean;
}

interface NarrativeFeedbackDialogState {
  isOpen: boolean;
  selectedNarrative: Narrative | null;
  narrativeFeedbackRating: number | null; // 1-5 stars, null for no feedback provided yet
  narrativeFeedbackComment: string | null; // Optional comment from the user
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
      claimFeedbackComment: '',
    } as ClaimFeedbackDialogState,
    narrativeFeedbackDialog: {
      isOpen: false,
      selectedNarrative: null,
      loading: false,
      narrativeFeedbackRating: null,
      narrativeFeedbackComment: '',
    } as NarrativeFeedbackDialogState,
  }),

  actions: {
    async openClaimFeedbackDialog(claim: Claim, narrative: Narrative) {
      this.claimFeedbackDialog.isOpen = true;
      this.claimFeedbackDialog.loading = true;
      this.claimFeedbackDialog.selectedClaim = claim;
      this.claimFeedbackDialog.selectedNarrative = narrative;
      const feedbackResponse = await apiService.getClaimFeedback(claim.id, narrative.id);
      this.claimFeedbackDialog.claimFeedbackScore = feedbackResponse ? feedbackResponse.feedback_score : null;
      this.claimFeedbackDialog.claimFeedbackComment = feedbackResponse ? feedbackResponse.feedback_text : '';
      this.claimFeedbackDialog.loading = false;
    },
    closeClaimFeedbackDialog() {
      this.claimFeedbackDialog.isOpen = false;
      this.claimFeedbackDialog.selectedClaim = null;
      this.claimFeedbackDialog.selectedNarrative = null;
      this.claimFeedbackDialog.claimFeedbackScore = null;
      this.claimFeedbackDialog.claimFeedbackComment = '';
    },
    async sendClaimFeedback(score: number, comment: string) {
      this.claimFeedbackDialog.claimFeedbackScore = score;
      this.claimFeedbackDialog.claimFeedbackComment = comment;
      return await apiService.sendClaimFeedback(this.claimFeedbackDialog.selectedClaim!.id, this.claimFeedbackDialog.selectedNarrative!.id, score, comment).catch((error) => {
        console.error('Error sending claim feedback:', error);
        return null;
      });
    },
    async openNarrativeFeedbackDialog(narrative: Narrative) {
      this.narrativeFeedbackDialog.isOpen = true;
      this.narrativeFeedbackDialog.loading = true;
      this.narrativeFeedbackDialog.selectedNarrative = narrative;
      const feedbackResponse = await apiService.getNarrativeFeedback(narrative.id);
      // Convert score (0-1) to rating (1-5)
      const MAX_NUMBER_OF_STARS = 5;
      this.narrativeFeedbackDialog.narrativeFeedbackRating = feedbackResponse ? Math.round(feedbackResponse.feedback_score * MAX_NUMBER_OF_STARS) : null;
      this.narrativeFeedbackDialog.narrativeFeedbackComment = feedbackResponse?.feedback_text || '';
      this.narrativeFeedbackDialog.loading = false;
    },
    closeNarrativeFeedbackDialog() {
      this.narrativeFeedbackDialog.isOpen = false;
      this.narrativeFeedbackDialog.selectedNarrative = null;
      this.narrativeFeedbackDialog.narrativeFeedbackRating = null;
      this.narrativeFeedbackDialog.narrativeFeedbackComment = '';
    },
    async sendNarrativeFeedback(score: number, comment: string) {
      const MAX_NUMBER_OF_STARS = 5;
      const rating = Math.round(score * MAX_NUMBER_OF_STARS);
      this.narrativeFeedbackDialog.narrativeFeedbackRating = rating;
      this.narrativeFeedbackDialog.narrativeFeedbackComment = comment;
      return await apiService.sendNarrativeFeedback(this.narrativeFeedbackDialog.selectedNarrative!.id, score, comment).catch((error) => {
        console.error('Error sending narrative feedback:', error);
        return null;
      });
    },
  },

  getters: {
    isClaimFeedbackDialogOpen: (state) => state.claimFeedbackDialog.isOpen,
    isClaimFeedbackLoading: (state) => state.claimFeedbackDialog.loading,
    isNarrativeFeedbackDialogOpen: (state) => state.narrativeFeedbackDialog.isOpen,
    isNarrativeFeedbackLoading: (state) => state.narrativeFeedbackDialog.loading,
  },
});
