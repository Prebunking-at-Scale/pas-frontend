/**
 * Composable for preserving list state (pagination, filters) when navigating to detail views
 * and restoring it when navigating back with browser back button
 */

interface ListState {
  currentPage: number;
  filters: Record<string, any>;
  appliedFilters: Record<string, any>;
}

export const useListStatePreservation = (listKey: string) => {
  const STORAGE_KEY = `${listKey}-list-state`;

  /**
   * Save current list state to sessionStorage
   */
  const saveListState = (state: ListState) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save list state for ${listKey}:`, error);
    }
  };

  /**
   * Restore list state from sessionStorage
   * Returns null if no state exists or if restoration fails
   */
  const restoreListState = (): ListState | null => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (!savedState) {
        return null;
      }
      return JSON.parse(savedState) as ListState;
    } catch (error) {
      console.warn(`Failed to restore list state for ${listKey}:`, error);
      return null;
    }
  };

  /**
   * Clear saved list state from sessionStorage
   */
  const clearListState = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn(`Failed to clear list state for ${listKey}:`, error);
    }
  };

  /**
   * Check if there is saved state available
   */
  const hasSavedState = (): boolean => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  };

  return {
    saveListState,
    restoreListState,
    clearListState,
    hasSavedState
  };
};
