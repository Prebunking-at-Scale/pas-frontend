import type { Component } from 'vue';

// Type for header content - can be a string or a Vue component
export interface PageHeaderContent {
  title?: string;
  customComponent?: Component;
  customHtml?: string;
}

// Composable for managing page headers across the application
export const usePageHeader = () => {
  // Create a global state for the page header
  const headerContent = useState<PageHeaderContent | null>('pageHeader', () => null);

  // Function to set the page header with various options
  const setPageHeader = (content: PageHeaderContent) => {
    headerContent.value = content;
  };

  // Function to clear the page header
  const clearPageHeader = () => {
    headerContent.value = null;
  };

  // Convenience function to set just the title
  const setPageTitle = (title: string) => {
    headerContent.value = { title };
  };

  return {
    headerContent: readonly(headerContent),
    setPageHeader,
    clearPageHeader,
    setPageTitle
  };
};