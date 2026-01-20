import languages from '@cospired/i18n-iso-languages';
import en from '@cospired/i18n-iso-languages/langs/en.json';
import es from '@cospired/i18n-iso-languages/langs/es.json';
import fr from '@cospired/i18n-iso-languages/langs/fr.json';
import de from '@cospired/i18n-iso-languages/langs/de.json';

// Initialize the library with the languages we need
languages.registerLocale(en);
languages.registerLocale(es);
languages.registerLocale(fr);
languages.registerLocale(de);

/**
 * Supported interface locales for displaying language names
 */
type SupportedLocale = 'en' | 'es' | 'fr' | 'de';

/**
 * Language option for UI components
 */
export interface LanguageOption {
  value: string;
  label: string;
}

/**
 * Language information with names in all supported locales
 */
export interface LanguageInfo {
  code: string;
  name: {
    en: string;
    es: string;
    fr: string;
    de: string;
  };
}

/**
 * Get language name in a specific locale
 * @param code - ISO 639-1 language code
 * @param locale - Target locale for the name
 * @param fallback - Fallback name if not found
 * @returns Language name in the specified locale
 */
export function getLanguageName(
  code: string, 
  locale: SupportedLocale = 'en', 
  fallback?: string
): string {
  // Handle special cases
  if (code === 'all') {
    const allLabels = {
      en: 'All languages',
      es: 'Todos los idiomas',
      fr: 'Toutes les langues',
      de: 'Alle Sprachen'
    };
    return allLabels[locale];
  }

  // Get name from library
  const name = languages.getName(code, locale);
  
  if (name) {
    return name;
  }

  // Try English as fallback
  if (locale !== 'en') {
    const englishName = languages.getName(code, 'en');
    if (englishName) {
      return englishName;
    }
  }

  // Return fallback or code
  return fallback || code.toUpperCase();
}

/**
 * Get complete language information with names in all supported locales
 * @param code - ISO 639-1 language code
 * @returns Language info object or null if not found
 */
export function getLanguageInfo(code: string): LanguageInfo | null {
  // Check if language exists
  const englishName = languages.getName(code, 'en');
  if (!englishName) {
    return null;
  }

  return {
    code,
    name: {
      en: languages.getName(code, 'en') || code.toUpperCase(),
      es: languages.getName(code, 'es') || languages.getName(code, 'en') || code.toUpperCase(),
      fr: languages.getName(code, 'fr') || languages.getName(code, 'en') || code.toUpperCase(),
      de: languages.getName(code, 'de') || languages.getName(code, 'en') || code.toUpperCase(),
    }
  };
}

/**
 * Map language codes to UI options
 * @param codes - Array of ISO language codes
 * @param locale - Target locale for labels
 * @returns Array of language options for UI
 */
export function mapLanguageCodes(
  codes: string[], 
  locale: SupportedLocale = 'en'
): LanguageOption[] {
  return codes
    .map(code => ({
      value: code,
      label: getLanguageName(code, locale)
    }))
    .filter(option => option.label !== option.value.toUpperCase()) // Filter out unknown languages
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Check if a language code is valid
 * @param code - ISO 639-1 language code
 * @returns true if the language code is valid
 */
export function isValidLanguageCode(code: string): boolean {
  return languages.getName(code, 'en') !== undefined;
}

/**
 * Get all supported language codes
 * @returns Array of all ISO 639-1 language codes supported by the library
 */
export function getAllLanguageCodes(): string[] {
  const alpha2Codes = languages.getAlpha2Codes();
  return Object.keys(alpha2Codes);
}