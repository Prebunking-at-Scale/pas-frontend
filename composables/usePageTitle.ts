// DEPRECATED: Use usePageHeader instead
// This composable is kept for backward compatibility
export const usePageTitle = () => {
  const { setPageTitle, clearPageHeader } = usePageHeader();
  
  return {
    pageTitle: computed(() => null), // Always null since we're using the new system
    setPageTitle,
    clearPageTitle: clearPageHeader
  };
};