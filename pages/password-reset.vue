<template>
  <div class="max-w-md w-full space-y-8 mx-auto">
    <div class="flex justify-center flex-col">
      <div class="flex justify-center">
        <img src="/assets/images/prebunking-logo.png" class="w-48">
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ isFirstTimeSetup ? $t('passwordChange.firstTimeTitle') : $t('passwordChange.title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ isFirstTimeSetup ? $t('passwordChange.firstTimeSubtitle') : $t('passwordChange.subtitle') }}
      </p>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="rounded-md bg-green-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800">
            {{ $t('passwordChange.success') }}
          </h3>
          <p class="mt-1 text-sm text-green-700">
            {{ $t('passwordChange.redirecting') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ error }}
          </h3>
        </div>
      </div>
    </div>

    <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handlePasswordChange">
      <div class="space-y-4">
        <!-- Current Password (only for authenticated users changing password) -->
        <div v-if="!isFirstTimeSetup && !isPasswordReset" class="space-y-2">
          <Label for="currentPassword">{{ $t('passwordChange.currentPassword') }}</Label>
          <Input 
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            required
          />
        </div>

        <!-- New Password -->
        <div class="space-y-2">
          <Label for="newPassword">{{ $t('passwordChange.newPassword') }}</Label>
          <Input 
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            minlength="12"
            @input="checkPasswordStrength"
          />
          <!-- Password Requirements -->
          <div class="mt-2 space-y-1">
            <p class="text-sm" :class="passwordLength >= 12 ? 'text-green-600' : 'text-gray-500'">
              <span v-if="passwordLength >= 12">✓</span> {{ $t('passwordChange.requirementLength') }}
            </p>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <Label for="confirmPassword">{{ $t('passwordChange.confirmPassword') }}</Label>
          <Input 
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="12"
          />
          <p v-if="confirmPassword && newPassword !== confirmPassword" class="text-sm text-red-600">
            {{ $t('passwordChange.passwordMismatch') }}
          </p>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          class="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50"
          :disabled="loading || !isPasswordValid || newPassword !== confirmPassword"
        >
          {{ loading ? $t('passwordChange.updating') : $t('passwordChange.updatePassword') }}
        </Button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth';
import { Button } from "~/components/ui/button";
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

definePageMeta({
  layout: 'auth',
  middleware: (to) => {
    const token = to.query.token;
    const firstTimeSetup = to.query.firstTimeSetup;
    
    // Allow access if:
    // 1. User has a password reset token
    // 2. User is authenticated and doing first time setup
    if (!token && !authService.getToken()) {
      return navigateTo('/login');
    }
  }
});

const { $i18n } = useNuxtApp();
const route = useRoute();
const router = useRouter();

// State
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);

// Password strength indicators
const passwordLength = ref(0);

// Determine the mode
const isPasswordReset = computed(() => !!route.query.token);
const isFirstTimeSetup = computed(() => route.query.firstTimeSetup === 'true');

const isPasswordValid = computed(() => 
  passwordLength.value >= 12
);

// Check password strength
const checkPasswordStrength = () => {
  const pwd = newPassword.value;
  passwordLength.value = pwd.length;
};

const handlePasswordChange = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = $i18n.t('passwordChange.passwordMismatch');
    return;
  }

  if (!isPasswordValid.value) {
    error.value = $i18n.t('passwordChange.passwordRequirements');
    return;
  }

  try {
    loading.value = true;
    error.value = '';

    if (isPasswordReset.value) {
      // Password reset with token
      await authService.resetPassword(route.query.token as string, newPassword.value);
    } else {
      // Regular password change
      await authService.changePassword(newPassword.value);
    }

    success.value = true;
    
    // Clear first time setup flag if it was set
    if (isFirstTimeSetup.value) {
      sessionStorage.removeItem('first_time_setup');
    }

    // Redirect after success
    setTimeout(() => {
      if (isPasswordReset.value) {
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    }, 2000);

  } catch (err: any) {
    console.error('Password change error:', err);
    if (err.status === 401) {
      error.value = $i18n.t('passwordChange.incorrectCurrentPassword');
    } else if (err.status === 400) {
      error.value = err.data?.detail || $i18n.t('passwordChange.invalidToken');
    } else {
      error.value = err.data?.detail || err.message || $i18n.t('passwordChange.error');
    }
  } finally {
    loading.value = false;
  }
};
</script>