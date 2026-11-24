import type { LanguageOption } from '~/utils/languageMapping';
import { getLanguageName } from '~/utils/languageMapping';

/**
 * Languages an organisation can be set to, in order of their English name: the
 * EU languages plus the other languages PAS organisations publish in.
 */
export const organizationLanguageOptions: LanguageOption[] = [
  { value: 'sq', label: 'Shqip (Albanian)' },
  { value: 'hy', label: 'Հայերեն (Armenian)' },
  { value: 'bs', label: 'Bosanski (Bosnian)' },
  { value: 'bg', label: 'Български (Bulgarian)' },
  { value: 'ca', label: 'Català (Catalan)' },
  { value: 'hr', label: 'Hrvatski (Croatian)' },
  { value: 'cs', label: 'Čeština (Czech)' },
  { value: 'da', label: 'Dansk (Danish)' },
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'en', label: 'English' },
  { value: 'et', label: 'Eesti (Estonian)' },
  { value: 'fi', label: 'Suomi (Finnish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'ka', label: 'ქართული (Georgian)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'el', label: 'Ελληνικά (Greek)' },
  { value: 'hu', label: 'Magyar (Hungarian)' },
  { value: 'ga', label: 'Gaeilge (Irish)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'lv', label: 'Latviešu (Latvian)' },
  { value: 'lt', label: 'Lietuvių (Lithuanian)' },
  { value: 'mk', label: 'Македонски (Macedonian)' },
  { value: 'mt', label: 'Malti (Maltese)' },
  { value: 'no', label: 'Norsk (Norwegian)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'ro', label: 'Română (Romanian)' },
  { value: 'ru', label: 'Русский (Russian)' },
  { value: 'sr', label: 'Srpski (Serbian)' },
  { value: 'sk', label: 'Slovenčina (Slovak)' },
  { value: 'sl', label: 'Slovenščina (Slovenian)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'tr', label: 'Türkçe (Turkish)' }
];

/**
 * The options to offer for an organisation that holds, or has held, `codes`.
 *
 * core-api accepts any two-letter code, so an organisation can already hold one
 * that is not in the list. Those are added so the select shows the current
 * value and saving the form does not change it.
 */
export function organizationLanguageOptionsFor(...codes: Array<string | null | undefined>): LanguageOption[] {
  const options = [...organizationLanguageOptions];

  for (const code of codes) {
    if (code && !options.some(option => option.value === code)) {
      options.push({ value: code, label: getLanguageName(code, 'en') });
    }
  }

  return options;
}
