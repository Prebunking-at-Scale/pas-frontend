import { defineStore } from 'pinia';
import type { Claim, Narrative } from '~/types/api';

interface UnlinkDialogState {
  isOpen: boolean;
  selectedClaim: Claim | null;
  onConfirm: (() => Promise<void>) | null;
}

interface AlertDialogState {
  isOpen: boolean;
}

interface TitleDialogState {
  isOpen: boolean;
}

interface MergeDialogState {
  isOpen: boolean;
  actualNarrative: Narrative | null;
  selectedNarrative: { id: string; title: string } | null;
}

export const useNarrativeDialogsStore = defineStore('narrativeDialogs', {
  state: () => ({
    unlinkDialog: {
      isOpen: false,
      selectedClaim: null,
      onConfirm: null,
    } as UnlinkDialogState,
    alertDialog: {
      isOpen: false,
    } as AlertDialogState,
    titleDialog: {
      isOpen: false,
    } as TitleDialogState,
    mergeDialog: {
      isOpen: false,
      actualNarrative: null,
    } as MergeDialogState,
  }),

  actions: {
    // Unlink Dialog Actions
    openUnlinkDialog(claim: Claim, onConfirm: () => Promise<void>) {
      this.unlinkDialog.selectedClaim = claim;
      this.unlinkDialog.onConfirm = onConfirm;
      this.unlinkDialog.isOpen = true;
    },

    closeUnlinkDialog() {
      this.unlinkDialog.isOpen = false;
      // Clear state after a small delay to avoid UI flicker
      setTimeout(() => {
        this.unlinkDialog.selectedClaim = null;
        this.unlinkDialog.onConfirm = null;
      }, 300);
    },

    async confirmUnlink() {
      if (this.unlinkDialog.onConfirm) {
        try {
          await this.unlinkDialog.onConfirm();
          this.closeUnlinkDialog();
        } catch (error) {
          // Error handling is done in the onConfirm callback
          console.error('Error during unlink confirmation:', error);
        }
      }
    },

    // Alert Dialog Actions (for future implementation)
    openAlertDialog() {
      this.alertDialog.isOpen = true;
    },

    closeAlertDialog() {
      this.alertDialog.isOpen = false;
    },

    // Title Dialog Actions (for future implementation)
    openTitleDialog() {
      this.titleDialog.isOpen = true;
    },

    closeTitleDialog() {
      this.titleDialog.isOpen = false;
    },
    // Merge Dialog Actions
    openMergeDialog(narrative: Narrative) {
      this.mergeDialog.actualNarrative = narrative;
      this.mergeDialog.isOpen = true;
    },
    closeMergeDialog() {
      this.mergeDialog.isOpen = false;
      // Clear state after a small delay to avoid UI flicker
      setTimeout(() => {
        this.mergeDialog.actualNarrative = null;
      }, 300);
    }
  },

  getters: {
    isUnlinkDialogOpen: (state) => state.unlinkDialog.isOpen,
    selectedClaimForUnlink: (state) => state.unlinkDialog.selectedClaim,
    isAlertDialogOpen: (state) => state.alertDialog.isOpen,
    isTitleDialogOpen: (state) => state.titleDialog.isOpen,
    isMergeDialogOpen: (state) => state.mergeDialog.isOpen,
  },
});