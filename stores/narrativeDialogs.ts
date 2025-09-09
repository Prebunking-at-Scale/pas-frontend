import { defineStore } from 'pinia';
import { apiService } from '~/services/api';
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

interface DeleteDialogState {
  isOpen: boolean;
  narrativeToDelete: Narrative | null;
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
    deleteDialog: {
      isOpen: false,
      narrativeToDelete: null,
    } as DeleteDialogState,
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
    },

    // Delete Dialog Actions
    openDeleteDialog(narrative: Narrative) {
      this.deleteDialog.narrativeToDelete = narrative;
      this.deleteDialog.isOpen = true;
    },

    closeDeleteDialog() {
      this.deleteDialog.isOpen = false;
      // Clear state after a small delay to avoid UI flicker
      setTimeout(() => {
        this.deleteDialog.narrativeToDelete = null;
      }, 300);
    },

    async confirmDelete() {
      const { $i18n } = useNuxtApp();
      const toast = useToast();

      if (!this.deleteDialog.narrativeToDelete) {
        console.error('No narrative selected for deletion.');
        return;
      }

      try {
        await apiService.deleteNarrative(this.deleteDialog.narrativeToDelete.id);
        toast.add({
          color: 'success',
          title: $i18n.t('common.success'),
          description: $i18n.t('narratives.delete_success'),
        })
        this.closeDeleteDialog();
        navigateTo('/narratives');
      } catch (error: any) {
        console.error('Error during delete confirmation:', error);
        toast.add({
          title: $i18n.t('common.error'),
          description: error.message || $i18n.t('common.error_occurred'),
          color: 'error'
        })
      }
    },
  },

  getters: {
    isUnlinkDialogOpen: (state) => state.unlinkDialog.isOpen,
    selectedClaimForUnlink: (state) => state.unlinkDialog.selectedClaim,
    isAlertDialogOpen: (state) => state.alertDialog.isOpen,
    isTitleDialogOpen: (state) => state.titleDialog.isOpen,
    isMergeDialogOpen: (state) => state.mergeDialog.isOpen,
    isDeleteDialogOpen: (state) => state.deleteDialog.isOpen,
  },
});