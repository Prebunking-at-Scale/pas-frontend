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
      <!-- First time setup warning -->
      <div v-if="isFirstTimeSetup" class="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              {{ $t('profile.firstTimeSetupTitle') }}
            </h3>
            <p class="mt-2 text-sm text-yellow-700">
              {{ $t('profile.firstTimeSetupMessage') }}
            </p>
          </div>
        </div>
      </div>

      <Card class="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="px-4 py-3 sm:p-4">
          <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('profile.personalInfo') }}</CardTitle>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <form @submit.prevent="updateProfile" class="space-y-4">
            <!-- Success/Error Messages for Profile Update -->
            <div v-if="profileSuccess" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ profileSuccess }}
                  </h3>
                </div>
              </div>
            </div>
            <div v-if="profileError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ profileError }}
                  </h3>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="name">{{ $t('profile.name') }}</Label>
              <Input 
                id="name"
                v-model="user.display_name"
                type="text" 
              />
            </div>
            <div class="space-y-2">
              <Label for="email">{{ $t('profile.email') }}</Label>
              <Input 
                id="email"
                v-model="user.email"
                type="email" 
                disabled
              />
            </div>
            <div class="flex justify-end">
              <Button type="submit" :disabled="loading" class="cursor-pointer">
                {{ loading ? $t('common.saving') : $t('common.save') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card class="mt-6 bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class=" px-4 py-3 sm:p-4">
          <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('profile.changePassword') }}</CardTitle>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <form @submit.prevent="changePassword" class="space-y-4">
            <!-- Success/Error Messages for Password Change -->
            <div v-if="passwordSuccess" class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ passwordSuccess }}
                  </h3>
                </div>
              </div>
            </div>
            <div v-if="passwordError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ passwordError }}
                  </h3>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="newPassword">{{ $t('profile.newPassword') }}</Label>
              <Input 
                id="newPassword"
                v-model="passwordForm.new"
                type="password"
                minlength="12"
              />
              <p class="text-sm text-gray-500">
                {{ $t('profile.passwordTooShort') }}
              </p>
            </div>
            <div class="space-y-2">
              <Label for="confirmPassword">{{ $t('profile.confirmPassword') }}</Label>
              <Input 
                id="confirmPassword"
                v-model="passwordForm.confirm"
                type="password" 
              />
            </div>
            <div class="flex justify-end">
              <Button type="submit" class="cursor-pointer">
                {{ $t('profile.updatePassword') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Just in case we implement account deletion -->
      <Card class="mt-6 bg-white overflow-hidden shadow rounded-lg" v-if="false">
        <CardHeader class=" px-4 py-3 sm:p-4">
          <CardTitle class="text-lg leading-6 font-medium text-destructive">{{ $t('profile.dangerZone') }}</CardTitle>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <p class="text-sm text-muted-foreground mb-4">{{ $t('profile.deleteAccountWarning') }}</p>
          <Button
            class="cursor-pointer"
            @click="showDeleteConfirm = true"
            variant="destructive"
          >
            {{ $t('profile.deleteAccount') }}
          </Button>
        </CardContent>
      </Card>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card class="max-w-md w-full">
          <CardHeader>
            <CardTitle>{{ $t('profile.confirmDelete') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{{ $t('profile.deleteConfirmMessage') }}</p>
          </CardContent>
          <CardFooter class="flex justify-end gap-2">
            <Button 
              @click="showDeleteConfirm = false"
              variant="outline"
            >
              {{ $t('common.cancel') }}
            </Button>
            <Button 
              @click="deleteAccount"
              variant="destructive"
            >
              {{ $t('common.delete') }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth';
import type { User, IdentityResponse } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();

// State
const user = ref<User>({
  id: '',
  email: '',
  display_name: '',
  created_at: '',
  updated_at: ''
});

const identity = ref<IdentityResponse | null>(null);
const loading = ref(false);
const isFirstTimeSetup = ref(false);

// Separate error/success states for profile and password
const profileError = ref('');
const profileSuccess = ref('');
const passwordError = ref('');
const passwordSuccess = ref('');

const passwordForm = ref({
  new: '',
  confirm: ''
});

const showDeleteConfirm = ref(false);

// Load user data
onMounted(async () => {
  try {
    loading.value = true;
    
    const identityData = await authService.getIdentity();
    identity.value = identityData;
    user.value = identityData.user;

    if (typeof sessionStorage !== 'undefined' &&  sessionStorage.getItem('first_time_setup') === 'true') {
      // Redirect to password reset page for first time setup
      await navigateTo('/password-reset?firstTimeSetup=true');
      return;
    }
  } catch (error: any) {
    console.error('Failed to load user data:', error);
    profileError.value = error.data?.detail || error.message || $i18n.t('profile.loadError');
  } finally {
    loading.value = false;
  }
});

// Methods
const updateProfile = async () => {
  try {
    loading.value = true;
    profileError.value = '';
    profileSuccess.value = '';
    
    const updatedUser = await authService.updateUser({
      display_name: user.value.display_name
    });
    
    // Update local state with fresh data from server
    user.value = updatedUser;
    // Update cookie to keep it in sync (though we always fetch fresh on page load)
    authService.setUser(updatedUser);
    profileSuccess.value = $i18n.t('profile.profileUpdated');
  } catch (err: any) {
    profileError.value = err.data?.detail || err.message || $i18n.t('profile.updateError');
  } finally {
    loading.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = $i18n.t('profile.passwordMismatch');
    return;
  }
  
  if (passwordForm.value.new.length < 12) {
    passwordError.value = $i18n.t('profile.passwordTooShort');
    return;
  }
  
  try {
    loading.value = true;
    passwordError.value = '';
    passwordSuccess.value = '';
    
    await authService.changePassword(passwordForm.value.new);
    
    passwordSuccess.value = $i18n.t('profile.passwordChanged');
    passwordForm.value = {
      new: '',
      confirm: ''
    };
    
    // Clear first time setup flag after password is set
    if (isFirstTimeSetup.value) {
      isFirstTimeSetup.value = false;
    }
  } catch (err: any) {
    passwordError.value = err.data?.detail || err.message || $i18n.t('profile.passwordChangeError');
  } finally {
    loading.value = false;
  }
};

const deleteAccount = async () => {
  // For now, just logout
  // TODO: Implement actual account deletion endpoint when available
  authService.logout();
  router.push('/login');
};

</script>