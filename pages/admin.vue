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
      <!-- Organization Settings Card -->
      <Card class="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="bg-stone-200 px-4 py-3 sm:p-4">
          <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('admin.organizationSettings') }}</CardTitle>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <form @submit.prevent="updateOrganization" class="space-y-4">
            <!-- Success/Error Messages -->
            <div v-if="orgSuccess" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ orgSuccess }}
                  </h3>
                </div>
              </div>
            </div>
            <div v-if="orgError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ orgError }}
                  </h3>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="organizationName">{{ $t('admin.organizationName') }}</Label>
              <Input 
                id="organizationName"
                v-model="organization.display_name"
                type="text" 
                :disabled="loadingOrg"
              />
            </div>
            <div class="flex justify-end">
              <Button type="submit" :disabled="loadingOrg" class="cursor-pointer">
                {{ loadingOrg ? $t('common.saving') : $t('common.save') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Users Management Card -->
      <Card class="mt-6 bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="bg-stone-200 px-4 py-3 sm:p-4">
          <div class="flex justify-between items-center">
            <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('admin.organizationUsers') }}</CardTitle>
            <Button @click="showInviteModal = true" class="cursor-pointer">
              {{ $t('admin.createUser') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <!-- Loading state -->
          <div v-if="loadingUsers" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
          </div>

          <!-- Users table -->
          <div v-else-if="users.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('admin.displayName') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('admin.email') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('admin.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ user.display_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ user.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <Button
                        v-if="user.id !== currentUserId"
                        @click="removeUser(user.id)"
                        size="sm"
                        variant="destructive"
                        class="cursor-pointer"
                        :disabled="loadingAction === user.id"
                      >
                        {{ $t('admin.remove') }}
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8">
            <p class="text-gray-500">{{ $t('admin.noUsers') }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Invite User Modal -->
      <Dialog v-model:open="showInviteModal">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ $t('admin.inviteUser') }}</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="inviteUser" class="space-y-4">
            <div v-if="inviteError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ inviteError }}
                  </h3>
                </div>
              </div>
            </div>
            <div v-if="inviteSuccess" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ inviteSuccess }}
                  </h3>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="inviteEmail">{{ $t('admin.emailAddress') }}</Label>
              <Input 
                id="inviteEmail"
                v-model="inviteEmail"
                type="email" 
                required
                :disabled="loadingInvite"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="showInviteModal = false">
                {{ $t('common.cancel') }}
              </Button>
              <Button type="submit" :disabled="loadingInvite" class="cursor-pointer">
                {{ loadingInvite ? $t('common.sending') : $t('admin.sendInvitation') }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth';
import type { Organization, IdentityResponse } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin']
});

const { $i18n } = useNuxtApp();
const { apiFetch } = useApi();
const router = useRouter();

// State
const organization = ref<Organization>({
  id: '',
  display_name: '',
  country_codes: [],
  language: '',
  short_name: ''
});

const users = ref<Array<any>>([]);
const currentUserId = ref<string>('');
const loadingOrg = ref(false);
const loadingUsers = ref(false);
const loadingAction = ref<string | null>(null);
const loadingInvite = ref(false);

const orgError = ref('');
const orgSuccess = ref('');
const inviteError = ref('');
const inviteSuccess = ref('');

const showInviteModal = ref(false);
const inviteEmail = ref('');

// Check if user is admin and load data
onMounted(async () => {
  try {
    // Get identity data
    const { apiFetch } = useApi();
    const response = await apiFetch('/api/auth/identity', {
      method: 'GET'
    });
    const identity = (response as any).data;
    
    if (!identity.is_organisation_admin) {
      // Redirect non-admins away from this page
      await navigateTo('/');
      return;
    }
    
    currentUserId.value = identity.user.id;
    organization.value = identity.organisation;
    
    // Load organization users
    await loadUsers();
  } catch (error: any) {
    console.error('Failed to load admin data:', error);
    // Don't automatically redirect on error - let the user stay if they're already here
    // The middleware will handle redirects on navigation
  }
});

// Load organization users
const loadUsers = async () => {
  try {
    loadingUsers.value = true;
    const response = await apiFetch('/api/auth/organisation/users', {
      method: 'GET'
    });
    users.value = (response as any).data || [];
  } catch (error: any) {
    console.error('Failed to load users:', error);
  } finally {
    loadingUsers.value = false;
  }
};

// Update organization
const updateOrganization = async () => {
  try {
    loadingOrg.value = true;
    orgError.value = '';
    orgSuccess.value = '';
    
    const response = await apiFetch('/api/auth/organisation', {
      method: 'PATCH',
      body: {
        display_name: organization.value.display_name
      }
    });
    
    organization.value = (response as any).data;
    orgSuccess.value = $i18n.t('admin.organizationUpdated');
  } catch (err: any) {
    orgError.value = err.data?.detail || err.message || $i18n.t('admin.updateError');
  } finally {
    loadingOrg.value = false;
  }
};

// Remove user from organization
const removeUser = async (userId: string) => {
  if (!confirm($i18n.t('admin.confirmRemoveUser'))) {
    return;
  }
  
  try {
    loadingAction.value = userId;
    await apiFetch(`/api/auth/organisation/users/${userId}`, {
      method: 'DELETE'
    });
    
    // Reload users to reflect changes
    await loadUsers();
  } catch (error: any) {
    console.error('Failed to remove user:', error);
  } finally {
    loadingAction.value = null;
  }
};

// Invite new user
const inviteUser = async () => {
  try {
    loadingInvite.value = true;
    inviteError.value = '';
    inviteSuccess.value = '';
    
    await apiFetch('/api/auth/organisation/invite', {
      method: 'POST',
      body: {
        user_email: inviteEmail.value
      }
    });
    
    inviteSuccess.value = $i18n.t('admin.invitationSent');
    inviteEmail.value = '';
    
    // Close modal after success
    setTimeout(() => {
      showInviteModal.value = false;
      inviteSuccess.value = '';
    }, 2000);
  } catch (err: any) {
    inviteError.value = err.data?.detail || err.message || $i18n.t('admin.inviteError');
  } finally {
    loadingInvite.value = false;
  }
};
</script>