<script setup lang="ts">
import { faPlus, faBuilding } from '@fortawesome/free-solid-svg-icons';
import type { Organization } from '~/types/api';
import CreateOrganizationDialog from '~/components/CreateOrganizationDialog.vue';

const { t } = useI18n();
const { apiFetch } = useApi();

// Define middleware
definePageMeta({
  middleware: 'superadmin'
});

// State
const organizations = ref<Organization[]>([]);
const loading = ref(true);
const showCreateDialog = ref(false);

// Fetch organizations
const fetchOrganizations = async () => {
  loading.value = true;
  try {
    // TODO: Replace with actual API endpoint when available
    // const response = await apiFetch('/api/auth/organisations');
    // organizations.value = response.data;
    
    // Placeholder data for now
    organizations.value = [];
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
  } finally {
    loading.value = false;
  }
};

// Handle organization created
const handleOrganizationCreated = (org: Organization) => {
  organizations.value.push(org);
  showCreateDialog.value = false;
};

// Fetch on mount
onMounted(() => {
  fetchOrganizations();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">{{ t('superadmin.title') }}</h2>
        <p class="text-gray-600 mt-1">{{ t('superadmin.description') }}</p>
      </div>
      <Button
        @click="showCreateDialog = true"
        class="flex items-center gap-2"
      >
        <font-awesome :icon="faPlus" />
        {{ t('superadmin.createOrganization') }}
      </Button>
    </div>

    <!-- Organizations List -->
    <Card>
      <CardHeader class=" px-4 py-3 sm:p-4">
          <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('superadmin.organizations') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        
        <div v-else-if="organizations.length === 0" class="text-center py-8 text-gray-500">
          <font-awesome :icon="faBuilding" class="text-4xl mb-2" />
          <p>{{ t('superadmin.noOrganizations') }}</p>
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="org in organizations"
            :key="org.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-lg">{{ org.display_name }}</h3>
                <div class="text-sm text-gray-600 space-y-1 mt-2">
                  <p v-if="org.short_name">{{ t('superadmin.shortName') }}: {{ org.short_name }}</p>
                  <p v-if="org.language">{{ t('superadmin.language') }}: {{ org.language }}</p>
                  <p v-if="org.country_codes?.length">
                    {{ t('superadmin.countries') }}: {{ org.country_codes.join(', ') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create Organization Dialog -->
    <CreateOrganizationDialog
      v-model:open="showCreateDialog"
      @created="handleOrganizationCreated"
    />
  </div>
</template>