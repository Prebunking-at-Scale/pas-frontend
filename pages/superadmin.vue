<script setup lang="ts">
import { faPlus, faBuilding, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Organization } from '~/types/api';
import CreateOrganizationDialog from '~/components/CreateOrganizationDialog.vue';
import OrganizationLanguageSelect from '~/components/OrganizationLanguageSelect.vue';

const { t } = useI18n();
const { apiFetch } = useApi();

// Define middleware
definePageMeta({
  middleware: 'superadmin'
});

// State
const organizations = ref<Organization[]>([]);
const organizationUsers = ref<Record<string, any[]>>({});
const expandedOrgs = ref<Set<string>>(new Set());
const loadingOrgs = ref(true);
const loadingUsers = ref<Record<string, boolean>>({});
const loadingAction = ref<string | null>(null);
const showCreateDialog = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
// The language picked for each organisation, before it is saved
const languageDrafts = ref<Record<string, string>>({});
const savingLanguage = ref<string | null>(null);
const languageFeedback = ref<{ orgId: string; ok: boolean; message: string } | null>(null);

// Fetch organizations
const fetchOrganizations = async () => {
  loadingOrgs.value = true;
  try {
    const response = await apiFetch('/api/auth/organisations');
    organizations.value = (response as any).data || [];
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    organizations.value = [];
  } finally {
    loadingOrgs.value = false;
  }
};

// Fetch users for a specific organization
const fetchOrganizationUsers = async (orgId: string) => {
  if (organizationUsers.value[orgId]) {
    return; // Already loaded
  }

  loadingUsers.value[orgId] = true;
  try {
    const response = await apiFetch('/api/auth/organisation/users', {
      query: { organisation_id: orgId }
    });
    organizationUsers.value[orgId] = (response as any).data || [];
  } catch (error) {
    console.error(`Failed to fetch users for organization ${orgId}:`, error);
    organizationUsers.value[orgId] = [];
  } finally {
    loadingUsers.value[orgId] = false;
  }
};

// Toggle organization expansion
const toggleOrganization = async (orgId: string) => {
  if (expandedOrgs.value.has(orgId)) {
    expandedOrgs.value.delete(orgId);
  } else {
    expandedOrgs.value.add(orgId);
    const org = organizations.value.find(o => o.id === orgId);
    if (org) {
      languageDrafts.value[orgId] = org.language;
    }
    await fetchOrganizationUsers(orgId);
  }
};

// Update an organisation's language. organisation_id makes core-api act on that
// organisation instead of the one the super admin is logged in to.
const updateLanguage = async (org: Organization) => {
  const language = languageDrafts.value[org.id];
  if (!language || language === org.language) {
    return;
  }

  savingLanguage.value = org.id;
  languageFeedback.value = null;
  try {
    const response = await apiFetch<{ data: Organization }>('/api/auth/organisation', {
      method: 'PATCH',
      query: { organisation_id: org.id },
      body: { language }
    });

    const updated = response.data;
    const index = organizations.value.findIndex(o => o.id === org.id);
    if (index !== -1) {
      organizations.value[index] = updated;
    }
    languageDrafts.value[org.id] = updated.language;
    languageFeedback.value = { orgId: org.id, ok: true, message: t('superadmin.languageUpdated') };
  } catch (error) {
    console.error(`Failed to update language for organization ${org.id}:`, error);
    const failure = error as { data?: { detail?: string }; message?: string };
    languageFeedback.value = {
      orgId: org.id,
      ok: false,
      message: failure.data?.detail || failure.message || t('superadmin.languageUpdateError')
    };
  } finally {
    savingLanguage.value = null;
  }
};

// Handle organization created
const handleOrganizationCreated = (org: Organization) => {
  organizations.value.push(org);
  showCreateDialog.value = false;
};

// Resend invitation to a user
const resendInvitation = async (user: any, orgId: string) => {
  try {
    loadingAction.value = user.id;

    await apiFetch('/api/auth/organisation/invite/resend', {
      method: 'POST',
      query: { organisation_id: orgId },
      body: {
        user_email: user.email,
        as_admin: user.is_admin
      }
    });

    successMessage.value = t('superadmin.invitationResent');
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error: any) {
    console.error('Failed to resend invitation:', error);
    errorMessage.value = error.data?.detail || error.message || t('superadmin.resendError');
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  } finally {
    loadingAction.value = null;
  }
};

// Fetch on mount
onMounted(() => {
  fetchOrganizations();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800">
            {{ successMessage }}
          </h3>
        </div>
      </div>
    </div>
    <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ errorMessage }}
          </h3>
        </div>
      </div>
    </div>
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
        <div v-if="loadingOrgs" class="text-center py-8">
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
            class="border rounded-lg overflow-hidden"
          >
            <!-- Organization Header -->
            <div
              class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="toggleOrganization(org.id)"
            >
              <div class="flex items-start gap-2">
                <font-awesome
                  :icon="expandedOrgs.has(org.id) ? faChevronDown : faChevronRight"
                  class="mt-1 text-gray-500"
                />
                <div class="flex-1">
                  <div class="flex items-baseline gap-2">
                    <h3 class="font-semibold text-lg">{{ org.display_name }}</h3>
                    <span v-if="org.short_name" class="text-sm text-gray-500">({{ org.short_name }})</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 mt-2">
                    <template v-if="org.language">
                      <span class="text-sm text-gray-600">{{ t('superadmin.language') }}:</span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ org.language }}
                      </span>
                    </template>
                    <template v-if="org.country_codes?.length">
                      <span class="text-sm text-gray-600">{{ t('superadmin.countries') }}:</span>
                      <span
                        v-for="country in org.country_codes"
                        :key="country"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {{ country }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Users List (Expanded) -->
            <div v-if="expandedOrgs.has(org.id)" class="border-t bg-gray-50">
              <form
                class="p-4 border-b flex flex-wrap items-end gap-3"
                @submit.prevent="updateLanguage(org)"
              >
                <div class="space-y-2 w-64">
                  <Label :for="`language-${org.id}`">{{ t('superadmin.language') }}</Label>
                  <OrganizationLanguageSelect
                    :id="`language-${org.id}`"
                    v-model="languageDrafts[org.id]"
                    :disabled="savingLanguage === org.id"
                  />
                </div>
                <Button
                  type="submit"
                  class="cursor-pointer"
                  :disabled="savingLanguage === org.id || languageDrafts[org.id] === org.language"
                >
                  {{ savingLanguage === org.id ? t('common.saving') : t('common.save') }}
                </Button>
                <p
                  v-if="languageFeedback?.orgId === org.id"
                  role="status"
                  :class="['text-sm py-2', languageFeedback.ok ? 'text-green-800' : 'text-red-800']"
                >
                  {{ languageFeedback.message }}
                </p>
              </form>
              <div v-if="loadingUsers[org.id]" class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
              <div v-else-if="organizationUsers[org.id]?.length > 0" class="p-4">
                <h4 class="font-medium mb-3">{{ t('superadmin.organizationUsers') }}</h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-white">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ t('superadmin.displayName') }}
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ t('superadmin.email') }}
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ t('superadmin.role') }}
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ t('superadmin.status') }}
                        </th>
                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ t('superadmin.actions') }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="user in organizationUsers[org.id]" :key="user.id">
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {{ user.display_name }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {{ user.email }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          <span v-if="user.is_super_admin" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {{ t('superadmin.superAdmin') }}
                          </span>
                          <span v-else-if="user.is_admin" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {{ t('superadmin.admin') }}
                          </span>
                          <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {{ t('superadmin.member') }}
                          </span>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          <span v-if="user.accepted" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {{ t('superadmin.active') }}
                          </span>
                          <span v-else-if="user.invited" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {{ t('superadmin.invited') }}
                          </span>
                          <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {{ t('superadmin.inactive') }}
                          </span>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-right">
                          <Button
                            v-if="user.invited && !user.accepted"
                            @click="resendInvitation(user, org.id)"
                            size="sm"
                            variant="outline"
                            class="cursor-pointer"
                            :disabled="loadingAction === user.id"
                          >
                            {{ t('superadmin.resendInvite') }}
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="p-4 text-center text-gray-500">
                {{ t('superadmin.noUsers') }}
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