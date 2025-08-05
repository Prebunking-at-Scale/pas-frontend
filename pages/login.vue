<template>
  <div class="max-w-md w-full space-y-8 mx-auto">
      <div class="flex justify-center flex-col">
        <div class="flex justify-center">
          <img src="/assets/images/prebunking-logo.png" class="w-48">
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('login.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('login.subtitle') }}
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <input type="hidden" name="remember" value="true">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">{{ $t('login.email') }}</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              :placeholder="$t('login.email')"
            >
          </div>
          <div>
            <label for="password" class="sr-only">{{ $t('login.password') }}</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              minlength="12"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              :placeholder="$t('login.password')"
            >
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div>
          <Button
          type="submit"
          class="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50"
          :disabled="loading"
          >
            {{ loading ? $t('login.loggingIn') : $t('login.signIn') }}
          </Button>
        </div>

         <!-- Forgot Password Link -->
         <div class="flex items-center justify-between">
          <div class="text-sm w-full">
            <a href="#" @click.prevent="showForgotPassword = true" class="font-medium text-green-600 hover:text-green-500">
              {{ $t('login.forgotPassword') }}
            </a>
          </div>
        </div>

      </form>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPassword" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card class="max-w-md w-full">
        <CardHeader class="pt-8">
          <CardTitle>{{ $t('login.forgotPasswordTitle') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">{{ $t('login.forgotPasswordDescription') }}</p>
          
          <div v-if="forgotPasswordSuccess" class="rounded-md bg-green-50 p-4 mb-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  {{ $t('login.forgotPasswordSuccess') }}
                </h3>
              </div>
            </div>
          </div>
          
          <div v-if="forgotPasswordError" class="rounded-md bg-red-50 p-4 mb-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ forgotPasswordError }}
                </h3>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="handleForgotPassword" class="space-y-4">
            <div class="space-y-2">
              <Label for="forgotEmail">{{ $t('login.email') }}</Label>
              <Input 
                id="forgotEmail"
                v-model="forgotPasswordEmail"
                type="email"
                required
                :placeholder="$t('login.email')"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter class="flex justify-end gap-2">
          <Button 
            @click="closeForgotPassword"
            variant="outline"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button 
            @click="handleForgotPassword"
            :disabled="forgotPasswordLoading || !forgotPasswordEmail"
          >
            {{ forgotPasswordLoading ? $t('login.sendingResetLink') : $t('login.sendResetLink') }}
          </Button>
        </CardFooter>
      </Card>
    </div>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

definePageMeta({
  layout: 'auth'
});

const { $i18n } = useNuxtApp();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// Forgot password state
const showForgotPassword = ref(false);
const forgotPasswordEmail = ref('');
const forgotPasswordLoading = ref(false);
const forgotPasswordError = ref('');
const forgotPasswordSuccess = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await authService.login(email.value, password.value);

    // Store user information
    authService.setUser(response.data.user);

    // Handle the actual API response structure with 'organisations' field
    const orgs = response.data.organisations;
    if (orgs && Object.keys(orgs).length > 0) {
      // Get the first organization
      const orgId = Object.keys(orgs)[0];
      const orgData = orgs[orgId];
      
      authService.setToken(orgData.token);
      authService.setOrganization(orgData.organisation.id);
      
      // Redirect to dashboard
      await navigateTo('/dashboard');
    } else {
      error.value = $i18n.t('login.noOrganizations');
    }
  } catch (err: any) {
    // Handle specific error cases
    if (err.status === 401 || err.statusCode === 401) {
      error.value = $i18n.t('login.invalidCredentials');
    } else if (err.status === 403 || err.statusCode === 403) {
      error.value = $i18n.t('login.accountDisabled');
    } else if (err.status === 429 || err.statusCode === 429) {
      error.value = $i18n.t('login.tooManyAttempts');
    } else if (err.status === 500 || err.statusCode === 500) {
      error.value = $i18n.t('login.serverError');
    } else if (err.data?.detail) {
      // Use API-provided error message if available
      error.value = err.data.detail;
    } else if (err.message?.includes('fetch')) {
      error.value = $i18n.t('login.networkError');
    } else {
      error.value = $i18n.t('login.genericError');
    }
  } finally {
    loading.value = false;
  }
};

// Forgot password handlers
const handleForgotPassword = async () => {
  try {
    forgotPasswordLoading.value = true;
    forgotPasswordError.value = '';
    forgotPasswordSuccess.value = false;
    
    await authService.requestPasswordReset(forgotPasswordEmail.value);
    forgotPasswordSuccess.value = true;
    
    // Close modal after 3 seconds
    setTimeout(() => {
      closeForgotPassword();
    }, 3000);
  } catch (err: any) {
    forgotPasswordError.value = err.data?.detail || err.message || $i18n.t('login.forgotPasswordError');
  } finally {
    forgotPasswordLoading.value = false;
  }
};

const closeForgotPassword = () => {
  showForgotPassword.value = false;
  forgotPasswordEmail.value = '';
  forgotPasswordError.value = '';
  forgotPasswordSuccess.value = false;
};

</script>
