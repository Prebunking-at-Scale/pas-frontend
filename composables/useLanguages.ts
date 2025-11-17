import { mapLanguageCodes, getLanguageName, getLanguageInfo } from '~/utils/languageMapping';

interface LanguageOption {
  value: string;
  label: string;
  isFromAPI?: boolean;
}

interface UseLanguagesOptions {
  /**
   * Locale for displaying names (auto-detected from browser if not specified)
   * @default 'auto'
   */
  locale?: 'en' | 'es' | 'fr' | 'de' | 'auto';
  
  /**
   * Include "All languages" option
   * @default true
   */
  includeAllOption?: boolean;
  
  /**
   * Fallback languages if no API data available
   * @default ['en', 'es', 'fr', 'de']
   */
  fallbackLanguages?: string[];
  
  /**
   * Filter only valid languages (that exist in mapping)
   * @default true
   */
  filterValidOnly?: boolean;
}

export const useLanguages = (options: UseLanguagesOptions = {}) => {
  const {
    includeAllOption = true,
    fallbackLanguages = ['en', 'es', 'fr', 'de'],
    filterValidOnly = true
  } = options;

  const { $i18n } = useNuxtApp();
  const appStore = useAppDataStore();

  const locale = $i18n.locale.value

  /**
   * Available language codes from API or fallback
   */
  const availableLanguageCodes = computed(() => {
    // Try to get from store first
    if (appStore.isAuthenticated && appStore.availableLanguages.length > 0) {
      return appStore.availableLanguages;
    }
    
    // Use fallback if no API data
    return fallbackLanguages;
  });

  /**
   * Formatted language list for UI
   */
  const languages = computed((): LanguageOption[] => {
    let codes = availableLanguageCodes.value;
    
    // Filter valid codes if enabled
    if (filterValidOnly) {
      codes = codes.filter(code => {
        const info = getLanguageInfo(code);
        return info !== null;
      });
    }
    
    // Map codes to UI objects
    const mappedLanguages = mapLanguageCodes(codes, locale).map(lang => ({
      value: lang.value,
      label: lang.label,
      isFromAPI: appStore.isAuthenticated && appStore.availableLanguages.length > 0
    }));
    
    // Add "All" option if enabled
    if (includeAllOption) {
      return [
        {
          value: 'all',
          label: $i18n.t('filters.allLanguages') || 'All languages',
          isFromAPI: false
        },
        ...mappedLanguages
      ];
    }
    
    return mappedLanguages;
  });

  /**
   * Get the display name for a specific language code
   */
  const getLanguageLabel = (code: string): string => {
    if (code === 'all') {
      return $i18n.t('filters.allLanguages') || 'All languages';
    }

    return getLanguageName(code, locale, code.toUpperCase());
  };

  /**
   * Check if a language code is available
   */
  const isLanguageAvailable = (code: string): boolean => {
    if (code === 'all') return true;
    return availableLanguageCodes.value.includes(code);
  };

  /**
   * Loading state for languages
   */
  const isLoading = computed(() => {
    return appStore.isLoading && !appStore.isInitialized;
  });

  /**
   * Indicates if there's real API data or just fallback
   */
  const hasApiData = computed(() => {
    return appStore.isAuthenticated && appStore.availableLanguages.length > 0;
  });

  /**
   * Force refresh languages from API
   */
  const refreshLanguages = async (): Promise<void> => {
    if (appStore.isAuthenticated) {
      await appStore.refreshAppData();
    }
  };

  return {
    // Main data
    languages: readonly(languages),
    availableLanguageCodes: readonly(availableLanguageCodes),
    
    // Utility methods
    getLanguageLabel,
    isLanguageAvailable,
    refreshLanguages,
    
    // State
    isLoading: readonly(isLoading),
    hasApiData: readonly(hasApiData),
  };
};