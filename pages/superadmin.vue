<template>
  <ClientOnly>
    <template #fallback>
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
          <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
        </div>
      </div>
    </template>
    <div>
      <!-- Organizations List Card -->
      <Card class="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="bg-stone-200 px-4 py-3 sm:p-4">
          <div class="flex justify-between items-center">
            <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('superadmin.organizations') }}</CardTitle>
            <Button @click="showCreateOrgModal = true" class="cursor-pointer">
              {{ $t('superadmin.createOrganization') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <!-- Loading state -->
          <div v-if="loadingOrganizations" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
          </div>

          <!-- Organizations table -->
          <div v-else-if="organizations.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.organizationName') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.shortName') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.language') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.countryCodes') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.createdAt') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('superadmin.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="org in organizations" :key="org.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ org.display_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ org.short_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ org.language }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ org.country_codes.join(', ') }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(org.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <Button
                        @click="editOrganization(org)"
                        size="sm"
                        variant="outline"
                        class="cursor-pointer"
                      >
                        {{ $t('superadmin.edit') }}
                      </Button>
                      <Button
                        @click="deleteOrganization(org.id)"
                        size="sm"
                        variant="destructive"
                        class="cursor-pointer"
                        :disabled="loadingAction === org.id"
                      >
                        {{ $t('superadmin.delete') }}
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8">
            <p class="text-gray-500">{{ $t('superadmin.noOrganizations') }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Create Organization Modal (using existing component) -->
      <CreateOrganizationDialog 
        v-model:open="showCreateOrgModal"
        @created="onOrganizationCreated"
      />
      
      <!-- Edit Organization Modal -->
      <Dialog v-model:open="showEditOrgModal">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ $t('superadmin.editOrganization') }}</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="updateOrganization" class="space-y-4">
            <div v-if="orgError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ orgError }}
                  </h3>
                </div>
              </div>
            </div>
            <div v-if="orgSuccess" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ orgSuccess }}
                  </h3>
                </div>
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="orgDisplayName">{{ $t('superadmin.displayName') }}</Label>
              <Input 
                id="orgDisplayName"
                v-model="orgForm.display_name"
                type="text" 
                required
                :disabled="loadingSave"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="orgShortName">{{ $t('superadmin.shortName') }}</Label>
              <Input 
                id="orgShortName"
                v-model="orgForm.short_name"
                type="text" 
                required
                :disabled="loadingSave"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="orgLanguage">{{ $t('superadmin.language') }}</Label>
              <Input 
                id="orgLanguage"
                v-model="orgForm.language"
                type="text" 
                required
                placeholder="en"
                :disabled="loadingSave"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="orgCountryCodes">{{ $t('superadmin.countryCodes') }}</Label>
              <Input 
                id="orgCountryCodes"
                v-model="countryCodesInput"
                type="text" 
                placeholder="US, GB, ES"
                :disabled="loadingSave"
              />
              <p class="text-xs text-gray-500">{{ $t('superadmin.countryCodesHelp') }}</p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" @click="closeEditOrgModal">
                {{ $t('common.cancel') }}
              </Button>
              <Button type="submit" :disabled="loadingSave" class="cursor-pointer">
                {{ loadingSave ? $t('common.saving') : $t('common.save') }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Organization } from '~/types/api';
import CreateOrganizationDialog from '~/components/CreateOrganizationDialog.vue';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'superadmin']
});

const { $i18n } = useNuxtApp();
const { apiFetch } = useApi();

// State
const organizations = ref<Organization[]>([]);
const loadingOrganizations = ref(false);
const loadingAction = ref<string | null>(null);
const loadingSave = ref(false);

const showCreateOrgModal = ref(false);
const showEditOrgModal = ref(false);
const editingOrg = ref<Organization | null>(null);
const orgError = ref('');
const orgSuccess = ref('');

const orgForm = ref({
  display_name: '',
  short_name: '',
  language: '',
  country_codes: [] as string[]
});

const countryCodesInput = ref('');

// Load organizations
const loadOrganizations = async () => {
  try {
    loadingOrganizations.value = true;
    
    // Check if we have stored all organizations data from login (for superadmins)
    const storedOrgsData = sessionStorage.getItem('all_organizations');
    if (storedOrgsData) {
      const orgsMap = JSON.parse(storedOrgsData);
      // Convert the organizations object to an array
      organizations.value = Object.values(orgsMap).map((orgData: any) => orgData.organisation || orgData);
    } else {
      // If we don't have stored data, we need to re-authenticate to get all organizations
      // For now, just show the current organization
      const currentOrgResponse = await apiFetch('/api/auth/organisation', {
        method: 'GET'
      });
      const currentOrg = (currentOrgResponse as any).data;
      organizations.value = currentOrg ? [currentOrg] : [];
      
      // Note: The API doesn't provide a direct way to list all organizations
      // The only way to get all orgs is through the login endpoint
      // Consider adding a dedicated endpoint for superadmins to list all organizations
      console.warn('Full organizations list not available. Showing only current organization. Consider re-logging in to see all organizations.');
    }
  } catch (error: any) {
    console.error('Failed to load organizations:', error);
    organizations.value = [];
  } finally {
    loadingOrganizations.value = false;
  }
};

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

// Handle organization created
const onOrganizationCreated = async (org: Organization) => {
  // Reload organizations to show the new one
  await loadOrganizations();
};

// Edit organization
const editOrganization = (org: Organization) => {
  editingOrg.value = org;
  orgForm.value = {
    display_name: org.display_name,
    short_name: org.short_name,
    language: org.language,
    country_codes: org.country_codes
  };
  countryCodesInput.value = org.country_codes.join(', ');
  showEditOrgModal.value = true;
};

// Update organization
const updateOrganization = async () => {
  try {
    loadingSave.value = true;
    orgError.value = '';
    orgSuccess.value = '';
    
    // Parse country codes
    orgForm.value.country_codes = countryCodesInput.value
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);
    
    // Update existing organization
    const response = await apiFetch('/api/auth/organisation', {
      method: 'PATCH',
      query: { organisation_id: editingOrg.value!.id },
      body: orgForm.value
    });
    
    orgSuccess.value = $i18n.t('superadmin.organizationUpdated');
    
    // Reload organizations
    await loadOrganizations();
    
    // Close modal after success
    setTimeout(() => {
      closeEditOrgModal();
    }, 1500);
  } catch (err: any) {
    orgError.value = err.data?.detail || err.message || $i18n.t('superadmin.saveError');
  } finally {
    loadingSave.value = false;
  }
};

// Delete organization
const deleteOrganization = async (orgId: string) => {
  if (!confirm($i18n.t('superadmin.confirmDelete'))) {
    return;
  }
  
  try {
    loadingAction.value = orgId;
    
    // Note: The API might not have a delete endpoint yet
    // This is a placeholder for when it's available
    await apiFetch(`/api/auth/organisation/${orgId}`, {
      method: 'DELETE'
    });
    
    // Reload organizations
    await loadOrganizations();
  } catch (error: any) {
    console.error('Failed to delete organization:', error);
    // Show error message to user
    alert($i18n.t('superadmin.deleteError'));
  } finally {
    loadingAction.value = null;
  }
};

// Close edit modal and reset form
const closeEditOrgModal = () => {
  showEditOrgModal.value = false;
  editingOrg.value = null;
  orgForm.value = {
    display_name: '',
    short_name: '',
    language: '',
    country_codes: []
  };
  countryCodesInput.value = '';
  orgError.value = '';
  orgSuccess.value = '';
};

// Load data on mount
onMounted(async () => {
  await loadOrganizations();
});
</script>