<script setup lang="ts">
import { toRefs } from 'vue';
import type { CreateOrganisationRequest, OrganisationInviteRequest, Organization } from '~/types/api';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'created': [organization: Organization];
}>();

const { open } = toRefs(props);
const { t } = useI18n();
const { apiFetch } = useApi();

// Form state
const step = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);

// Step 1: Organization details
const orgForm = ref<CreateOrganisationRequest>({
  display_name: '',
  short_name: '',
  language: 'en',
  country_codes: []
});

// Step 2: Admin invitation
const inviteForm = ref<OrganisationInviteRequest>({
  user_email: '',
  as_admin: true
});

// Country codes input
const countryCodesInput = ref('');

// Language search
const languageSearch = ref('');
const showLanguageDropdown = ref(false);

// Valid ISO 3-letter country codes (partial list of common ones - can be expanded)
const validCountryCodes = new Set([
  'AFG', 'ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT', 'AZE',
  'BHS', 'BHR', 'BGD', 'BRB', 'BLR', 'BEL', 'BLZ', 'BEN', 'BTN', 'BOL', 'BIH',
  'BWA', 'BRA', 'BRN', 'BGR', 'BFA', 'BDI', 'KHM', 'CMR', 'CAN', 'CPV', 'CAF',
  'TCD', 'CHL', 'CHN', 'COL', 'COM', 'COG', 'CRI', 'CIV', 'HRV', 'CUB', 'CYP',
  'CZE', 'DNK', 'DJI', 'DMA', 'DOM', 'ECU', 'EGY', 'SLV', 'GNQ', 'ERI', 'EST',
  'ETH', 'FJI', 'FIN', 'FRA', 'GAB', 'GMB', 'GEO', 'DEU', 'GHA', 'GRC', 'GRD',
  'GTM', 'GIN', 'GNB', 'GUY', 'HTI', 'HND', 'HUN', 'ISL', 'IND', 'IDN', 'IRN',
  'IRQ', 'IRL', 'ISR', 'ITA', 'JAM', 'JPN', 'JOR', 'KAZ', 'KEN', 'KIR', 'PRK',
  'KOR', 'KWT', 'KGZ', 'LAO', 'LVA', 'LBN', 'LSO', 'LBR', 'LBY', 'LIE', 'LTU',
  'LUX', 'MKD', 'MDG', 'MWI', 'MYS', 'MDV', 'MLI', 'MLT', 'MHL', 'MRT', 'MUS',
  'MEX', 'FSM', 'MDA', 'MCO', 'MNG', 'MNE', 'MAR', 'MOZ', 'MMR', 'NAM', 'NRU',
  'NPL', 'NLD', 'NZL', 'NIC', 'NER', 'NGA', 'NOR', 'OMN', 'PAK', 'PLW', 'PSE',
  'PAN', 'PNG', 'PRY', 'PER', 'PHL', 'POL', 'PRT', 'QAT', 'ROU', 'RUS', 'RWA',
  'KNA', 'LCA', 'VCT', 'WSM', 'SMR', 'STP', 'SAU', 'SEN', 'SRB', 'SYC', 'SLE',
  'SGP', 'SVK', 'SVN', 'SLB', 'SOM', 'ZAF', 'SSD', 'ESP', 'LKA', 'SDN', 'SUR',
  'SWZ', 'SWE', 'CHE', 'SYR', 'TWN', 'TJK', 'TZA', 'THA', 'TLS', 'TGO', 'TON',
  'TTO', 'TUN', 'TUR', 'TKM', 'TUV', 'UGA', 'UKR', 'ARE', 'GBR', 'USA', 'URY',
  'UZB', 'VUT', 'VAT', 'VEN', 'VNM', 'YEM', 'ZMB', 'ZWE'
]);

// Filtered languages based on search
const filteredLanguages = computed(() => {
  if (!languageSearch.value) return languageOptions;
  const search = languageSearch.value.toLowerCase();
  return languageOptions.filter(lang => 
    lang.label.toLowerCase().includes(search) || 
    lang.value.toLowerCase().includes(search)
  );
});

// Selected language label
const selectedLanguageLabel = computed(() => {
  const selected = languageOptions.find(lang => lang.value === orgForm.value.language);
  return selected ? selected.label : '';
});

// Language options - European languages + Turkish
const languageOptions = [
  { value: 'bg', label: 'Български (Bulgarian)' },
  { value: 'hr', label: 'Hrvatski (Croatian)' },
  { value: 'cs', label: 'Čeština (Czech)' },
  { value: 'da', label: 'Dansk (Danish)' },
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'en', label: 'English' },
  { value: 'et', label: 'Eesti (Estonian)' },
  { value: 'fi', label: 'Suomi (Finnish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'el', label: 'Ελληνικά (Greek)' },
  { value: 'hu', label: 'Magyar (Hungarian)' },
  { value: 'ga', label: 'Gaeilge (Irish)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'lv', label: 'Latviešu (Latvian)' },
  { value: 'lt', label: 'Lietuvių (Lithuanian)' },
  { value: 'mt', label: 'Malti (Maltese)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'ro', label: 'Română (Romanian)' },
  { value: 'sk', label: 'Slovenčina (Slovak)' },
  { value: 'sl', label: 'Slovenščina (Slovenian)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'tr', label: 'Türkçe (Turkish)' }
];

// Watch for dialog close
watch(open, (newValue) => {
  if (!newValue) {
    // Reset form when dialog closes
    step.value = 1;
    error.value = null;
    orgForm.value = {
      display_name: '',
      short_name: '',
      language: 'en',
      country_codes: []
    };
    inviteForm.value = {
      user_email: '',
      as_admin: true
    };
    countryCodesInput.value = '';
    languageSearch.value = '';
    showLanguageDropdown.value = false;
  }
});

// Parse country codes from input
const parseCountryCodes = () => {
  if (!countryCodesInput.value) return [];
  return countryCodesInput.value
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length === 3);
};

// Validate step 1
const validateStep1 = () => {
  if (!orgForm.value.display_name) {
    error.value = t('superadmin.errors.displayNameRequired');
    return false;
  }
  
  // Validate short name if provided
  if (orgForm.value.short_name) {
    const shortNamePattern = /^[a-z0-9\-]+$/;
    if (!shortNamePattern.test(orgForm.value.short_name)) {
      error.value = t('superadmin.errors.invalidShortName');
      return false;
    }
  }
  
  // Parse and validate country codes
  const countryCodes = parseCountryCodes();
  if (countryCodes.length > 0) {
    const invalidCodes = countryCodes.filter(code => !validCountryCodes.has(code));
    if (invalidCodes.length > 0) {
      error.value = t('superadmin.errors.invalidCountryCodes', { codes: invalidCodes.join(', ') });
      return false;
    }
  }
  
  orgForm.value.country_codes = countryCodes;
  return true;
};

// Validate step 2
const validateStep2 = () => {
  if (!inviteForm.value.user_email) {
    error.value = t('superadmin.errors.emailRequired');
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(inviteForm.value.user_email)) {
    error.value = t('superadmin.errors.invalidEmail');
    return false;
  }
  return true;
};

// Go to next step
const nextStep = () => {
  error.value = null;
  if (step.value === 1 && validateStep1()) {
    step.value = 2;
  }
};

// Go to previous step
const prevStep = () => {
  error.value = null;
  if (step.value === 2) {
    step.value = 1;
  }
};

// Submit the form
const submit = async () => {
  error.value = null;
  
  if (!validateStep2()) {
    return;
  }

  loading.value = true;
  
  try {
    // Step 1: Create organization
    const orgResponse = await apiFetch('/api/auth/organisation', {
      method: 'POST',
      body: orgForm.value
    });
    
    const organization = (orgResponse as any).data || orgResponse;
    
    // Step 2: Invite admin to the newly created organization
    await apiFetch('/api/auth/organisation/invite', {
      method: 'POST',
      body: inviteForm.value,
      query: {
        organisation_id: organization.id
      }
    });
    
    // Success - emit event and close dialog
    emit('created', organization);
    emit('update:open', false);
  } catch (err: any) {
    console.error('Error creating organization:', err);
    error.value = err.data?.message || t('superadmin.errors.createFailed');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {{ t('superadmin.createOrganization') }}
        </DialogTitle>
        <DialogDescription>
          {{ step === 1 ? t('superadmin.step1Description') : t('superadmin.step2Description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Step indicator -->
      <div class="flex items-center justify-center space-x-2 my-4">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold',
            step >= 1 ? 'bg-emerald-600' : 'bg-gray-300'
          ]"
        >
          1
        </div>
        <div :class="['flex-1 h-1', step >= 2 ? 'bg-emerald-600' : 'bg-gray-300']" />
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold',
            step >= 2 ? 'bg-emerald-600' : 'bg-gray-300'
          ]"
        >
          2
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <!-- Step 1: Organization Details -->
      <div v-if="step === 1" class="space-y-4">
        <div class="space-y-2">
          <Label for="display_name">{{ t('superadmin.fields.displayName') }} *</Label>
          <Input
            id="display_name"
            v-model="orgForm.display_name"
            :placeholder="t('superadmin.placeholders.displayName')"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="short_name">{{ t('superadmin.fields.shortName') }}</Label>
          <Input
            id="short_name"
            v-model="orgForm.short_name"
            :placeholder="t('superadmin.placeholders.shortName')"
            @input="(e) => orgForm.short_name = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '')"
          />
          <p class="text-xs text-gray-500">{{ t('superadmin.hints.shortName') }}</p>
        </div>

        <div class="space-y-2">
          <Label for="language">{{ t('superadmin.fields.language') }}</Label>
          <div class="relative">
            <Input
              id="language"
              v-model="languageSearch"
              :placeholder="selectedLanguageLabel || t('superadmin.placeholders.searchLanguage')"
              @focus="showLanguageDropdown = true"
              @blur="setTimeout(() => showLanguageDropdown = false, 200)"
            />
            <div
              v-if="showLanguageDropdown"
              class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              <button
                v-for="option in filteredLanguages"
                :key="option.value"
                type="button"
                @mousedown.prevent="() => { orgForm.language = option.value; languageSearch = option.label; showLanguageDropdown = false; }"
                :class="[
                  'w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors',
                  orgForm.language === option.value ? 'bg-emerald-50 text-emerald-700' : ''
                ]"
              >
                {{ option.label }}
              </button>
              <p v-if="filteredLanguages.length === 0" class="px-3 py-2 text-gray-500 text-sm">
                {{ t('superadmin.noLanguageFound') }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="country_codes">{{ t('superadmin.fields.countryCodes') }}</Label>
          <Input
            id="country_codes"
            v-model="countryCodesInput"
            :placeholder="t('superadmin.placeholders.countryCodes')"
          />
          <p class="text-xs text-gray-500">
            {{ t('superadmin.hints.countryCodes') }}
            <a href="https://www.iban.com/country-codes" target="_blank" class="text-blue-600 hover:underline">
              {{ t('superadmin.viewCountryCodes') }}
            </a>
          </p>
        </div>
      </div>

      <!-- Step 2: Admin Invitation -->
      <div v-if="step === 2" class="space-y-4">
        <div class="space-y-2">
          <Label for="admin_email">{{ t('superadmin.fields.adminEmail') }} *</Label>
          <Input
            id="admin_email"
            v-model="inviteForm.user_email"
            type="email"
            :placeholder="t('superadmin.placeholders.adminEmail')"
            required
          />
        </div>

        <div class="rounded-lg bg-blue-50 p-4">
          <p class="text-sm text-blue-800">
            {{ t('superadmin.hints.adminInvite') }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          v-if="step === 2"
          variant="outline"
          @click="prevStep"
          :disabled="loading"
        >
          {{ t('common.back') }}
        </Button>
        <Button
          v-if="step === 1"
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="loading"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button
          v-if="step === 1"
          @click="nextStep"
          :disabled="loading"
        >
          {{ t('common.next') }}
        </Button>
        <Button
          v-if="step === 2"
          @click="submit"
          :disabled="loading"
        >
          <span v-if="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          {{ loading ? t('common.creating') : t('common.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>