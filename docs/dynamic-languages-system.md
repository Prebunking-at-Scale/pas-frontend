# Dynamic Languages System

The dynamic languages system allows automatically rendering language lists based on codes returned by your backend API, without the need to hardcode available languages.

## 🚀 Features

- ✅ **Automatic mapping**: Converts ISO codes (es, en, pt) to full names
- ✅ **Multilingual support**: Names in English, Spanish and native
- ✅ **API integration**: Uses real backend data when available
- ✅ **Intelligent fallback**: Default list when no API data
- ✅ **Optional flags**: Country emojis for better UX
- ✅ **Authentication**: Only loads data when user is authenticated
- ✅ **Cache**: Uses the 4-hour cache system
- ✅ **Scalable**: Supports any number of languages

## 📁 System Files

### `utils/languageMapping.ts`
Complete mapping of ISO 639-1 codes to language names:
- **90+ languages** supported
- **Names in 3 formats**: English, Spanish, native  
- **Optional flags**: Country emojis
- **Utility functions**: Search, filtering, validation

### `composables/useLanguages.ts`
Composable that integrates mapping with the data system:
- **Store integration**: Uses data from `appStore.availableLanguages`
- **Automatic fallback**: Default list if no API data
- **Reactivity**: Updates automatically when data changes
- **Flexible configuration**: Multiple customization options

### `components/filters/LanguageFilter.vue`
Updated component that uses the dynamic system:
- **Select/checkbox modes**: Both UI types supported
- **Loading states**: Visual indicators
- **Debug info**: Data source information in development
- **Manual update**: Button to refresh data

## 🎯 Casos de Uso

### 1. **Basic Usage (Select)**
```vue
&lt;template&gt;
  &lt;LanguageFilter 
    v-model="selectedLanguage" 
    type="select"
    label="Content language"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
const selectedLanguage = ref('all')
&lt;/script&gt;
```

### 2. **Multiple Selection (Checkboxes)**
```vue
&lt;template&gt;
  &lt;LanguageFilter 
    v-model="selectedLanguages" 
    type="checkbox"
    label="Filter by languages"
    :include-flags="true"
    :show-refresh-button="true"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
const selectedLanguages = ref([])
&lt;/script&gt;
```

### 3. **With Advanced Configuration**
```vue
&lt;template&gt;
  &lt;LanguageFilter 
    v-model="languages" 
    type="checkbox"
    :include-flags="true"
    :show-source-indicator="true"
    :show-debug-info="true"
    :show-refresh-button="true"
    locale="native"
  /&gt;
&lt;/template&gt;
```

### 4. **Direct Composable Usage**
```vue
&lt;template&gt;
  &lt;div&gt;
    &lt;h3&gt;Available Languages:&lt;/h3&gt;
    &lt;div v-if="isLoading"&gt;Loading...&lt;/div&gt;
    &lt;ul v-else&gt;
      &lt;li v-for="lang in languages" :key="lang.value"&gt;
        {{ lang.flag }} {{ lang.label }}
        &lt;span v-if="lang.isFromAPI" class="text-green-600"&gt;(API)&lt;/span&gt;
      &lt;/li&gt;
    &lt;/ul&gt;
    
    &lt;div class="mt-4"&gt;
      &lt;p&gt;Source: {{ hasApiData ? 'Backend API' : 'Fallback List' }}&lt;/p&gt;
      &lt;button v-if="hasApiData" @click="refreshLanguages"&gt;
        Update
      &lt;/button&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const {
  languages,
  isLoading,
  hasApiData,
  refreshLanguages,
  getLanguageLabel
} = useLanguages({
  locale: 'es',
  includeFlags: true,
  includeAllOption: false
})

// Get name of a specific language
const spanishName = getLanguageLabel('es') // "Español"
const englishName = getLanguageLabel('en') // "English"
&lt;/script&gt;
```

## ⚙️ Backend Configuration

### Expected Endpoint
Your API should return language codes in the `languages` array:

```json
{
  "languages": ["es", "en", "fr", "de", "pt", "it"],
  "timestamp": "2025-10-06T10:30:00Z"
}
```

### Códigos Soportados
El sistema reconoce automáticamente códigos ISO 639-1:
- **Básicos**: `es`, `en`, `fr`, `de`, `pt`, `it`, `ru`, `zh`, `ja`, `ko`
- **Con región**: `en-us`, `en-gb`, `es-mx`, `pt-br`, `fr-ca`
- **90+ idiomas** en total

### Códigos No Reconocidos
Si tu API devuelve un código no mapeado:
```javascript
// Backend returns: ["xyz", "abc"]
// System will show: "XYZ", "ABC" (automatic fallback)
```

## 🔧 API Reference

### `useLanguages(options?)`

#### Options:
```typescript
interface UseLanguagesOptions {
  locale?: 'en' | 'es' | 'native'        // Default: 'es'
  includeFlags?: boolean                  // Default: false
  includeAllOption?: boolean              // Default: true
  fallbackLanguages?: string[]           // Default: ['en', 'es', 'fr', 'de']
  filterValidOnly?: boolean               // Default: true
}
```

#### Returns:
```typescript
{
  // Main data
  languages: Ref<LanguageOption[]>,
  availableLanguageCodes: Ref<string[]>,
  
  // Utility methods
  getLanguageLabel: (code: string) => string,
  isLanguageAvailable: (code: string) => boolean,
  searchLanguages: (query: string) => LanguageOption[],
  refreshLanguages: () => Promise<void>,
  
  // State
  isLoading: Ref<boolean>,
  hasApiData: Ref<boolean>,
  debugInfo: Ref<DebugInfo>
}
```

### `LanguageFilter` Props

```typescript
interface Props {
  modelValue?: string | string[]
  type?: 'select' | 'checkbox'           // Default: 'select'
  label?: string
  placeholder?: string
  includeFlags?: boolean                 // Default: false
  showSourceIndicator?: boolean          // Default: false
  showDebugInfo?: boolean               // Default: false (auto en dev)
  showRefreshButton?: boolean           // Default: false
  locale?: 'en' | 'es' | 'native'      // Default: 'es'
}
```

### Utility Functions

```typescript
// Direct mapping
import { getLanguageName, mapLanguageCodes } from '~/utils/languageMapping'

// Get language name
const name = getLanguageName('es', 'en') // "Spanish"
const nativeName = getLanguageName('es', 'native') // "Español"

// Map code list
const options = mapLanguageCodes(['es', 'en', 'fr'], 'es', true)
// Result: [
//   { value: 'en', label: 'English', flag: '🇺🇸' },
//   { value: 'es', label: 'Spanish', flag: '🇪🇸' },
//   { value: 'fr', label: 'French', flag: '🇫🇷' }
// ]
```

## 🔄 Authentication System Integration

### Data Flow:
1. **Unauthenticated user** → Uses fallback list
2. **User authenticates** → Loads API data automatically  
3. **Data available** → Maps codes to full names
4. **4-hour cache** → Avoids repeated requests

### Development Debug:
```vue
<!-- Automatically activates in development mode -->
<LanguageFilter :show-debug-info="true" />

<!-- Shows information like: -->
<!-- Source: API (5 languages) -->
<!-- 💡 Sign in to see real server languages -->
```

## 🌟 Solution Advantages

### **1. Scalability**
- ✅ **No limits**: Supports any number of backend languages
- ✅ **Automatic**: No need to update code when languages are added
- ✅ **Future-proof**: New ISO codes are mapped automatically

### **2. Improved UX**
- ✅ **Readable names**: "Spanish" instead of "es"
- ✅ **Visual flags**: 🇪🇸 🇺🇸 🇫🇷 for quick recognition
- ✅ **Loading states**: Appropriate visual indicators
- ✅ **Smart fallback**: Always works, even without API

### **3. Perfect Integration**
- ✅ **Auth system**: Only loads when authenticated
- ✅ **Smart cache**: 4-hour validity
- ✅ **Reactivity**: Updates automatically
- ✅ **TypeScript**: Fully typed

## 🚀 Ejemplos de Implementación

### 1. **Filtro de Videos por Idioma**
```vue
&lt;template&gt;
  &lt;div class="video-filters"&gt;
    &lt;LanguageFilter 
      v-model="filters.language"
      type="select"
      label="Filtrar por idioma"
      :include-flags="true"
    /&gt;
    
    &lt;VideoList :filters="filters" /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const filters = reactive({
  language: 'all'
})

watch(() => filters.language, (newLang) => {
  console.log('Filter changed to:', newLang)
  // Video list will update automatically
})
&lt;/script&gt;
```

### 2. **Selector Múltiple para Admin**
```vue
&lt;template&gt;
  &lt;div class="admin-panel"&gt;
    <h2>Available Languages on Platform</h2>
    
    <LanguageFilter 
      v-model="platformLanguages"
      type="checkbox"
      label="Select active languages"
      :include-flags="true"
      :show-refresh-button="true"
      :show-source-indicator="true"
    /&gt;
    
    <button @click="savePlatformSettings">
      Save Configuration
    </button>
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const platformLanguages = ref(['es', 'en'])

const savePlatformSettings = async () => {
  await $fetch('/api/admin/languages', {
    method: 'POST',
    body: { languages: platformLanguages.value }
  })
}
&lt;/script&gt;
```

### 3. **Dashboard con Información de Idiomas**
```vue
&lt;template&gt;
  &lt;div class="dashboard"&gt;
    &lt;div class="language-stats"&gt;
      <h3>Language Statistics</h3>
      
      &lt;div v-for="lang in languageStats" :key="lang.code" 
           class="stat-item"&gt;
        &lt;span class="flag"&gt;{{ lang.flag }}&lt;/span&gt;
        &lt;span class="name"&gt;{{ lang.name }}&lt;/span&gt;
        <span class="count">{{ lang.videoCount }} videos</span>
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const { getLanguageLabel } = useLanguages({ includeFlags: true })

const videoStats = await $fetch('/api/stats/videos-by-language')

const languageStats = computed(() => {
  return videoStats.map(stat => ({
    code: stat.language,
    name: getLanguageLabel(stat.language),
    flag: getLanguageInfo(stat.language)?.flag,
    videoCount: stat.count
  }))
})
&lt;/script&gt;
```

The system is ready! 🎉

Your `LanguageFilter` component now:
- ✅ **Automatically adapts** to any language code returned by your API
- ✅ **Shows readable names** instead of codes (es → Spanish)
- ✅ **Works without authentication** using fallback list
- ✅ **Updates automatically** when there's new API data
- ✅ **Includes visual indicators** for status and data source