<script setup lang="ts">
import { ref } from 'vue';
import { authService } from '~/services/auth';
import { Button } from "~/components/ui/button";
import { Spinner } from '~/components/ui/spinner';

const { $i18n } = useNuxtApp();

const email = ref('');
const loading = ref(false);
const loadingValidation = ref(true);
const error = ref('');
const successMessage = ref('');
const organizations = ref<Record<string, any>>({});
const showOrganizationSelection = ref(false);
const loginResponse = ref<any>(null);

definePageMeta({
  layout: 'auth'
});

// Handle magic link token on page load
onMounted(async () => {
  const route = useRoute();
  if (route.query.token) {
    await handleMagicLinkValidation(route.query.token as string);
  } else {
    loadingValidation.value = false;
  }
});

const handleMagicLinkValidation = async (token: string) => {
  loadingValidation.value = true;
  error.value = '';
  
  try {
    const response = await authService.validateMagicLink(token);
    loginResponse.value = response;
    
    // Store user information
    authService.setUser(response.data.user);

    const orgs = response.data.organisations;
    if (orgs && Object.keys(orgs).length > 0) {
      if (Object.keys(orgs).length === 1) {
        // Single organization - auto-select
        const orgId = Object.keys(orgs)[0];
        const orgData = orgs[orgId];
        authService.selectOrganization(orgId, orgData, loginResponse.value?.data?.first_time_setup);
        await navigateTo('/dashboard');
      } else {
        // Multiple organizations - show selection (would need to implement this UI)
        organizations.value = orgs;
        showOrganizationSelection.value = true;
      }
    } else {
      error.value = $i18n.t('login.noOrganizations');
    }
  } catch (err: any) {
    console.error('Magic link validation failed:', err);
    if (err.status === 401 || err.statusCode === 401) {
      error.value = $i18n.t('magicLogin.invalidToken');
    } else if (err.status === 404 || err.statusCode === 404) {
      error.value = $i18n.t('magicLogin.expiredToken');
    } else {
      error.value = $i18n.t('magicLogin.error');
    }
  } finally {
    loadingValidation.value = false;
  }
};

const handleRequestMagicLink = async () => {
  loading.value = true;
  error.value = '';
  try {
    const success = await authService.requestMagicLink(email.value);
    if (success) {
      successMessage.value = $i18n.t('magicLogin.magicLinkSent');
    } else {
      error.value = $i18n.t('magicLogin.error');
    }
  } catch (err) {
    error.value = $i18n.t('magicLogin.error');
  } finally {
    loading.value = false;
  }
};

const goToLogin = async () => {
  await navigateTo('/login');
};

const onResetLogin = async () => {
  await navigateTo('/login');
};

const onError = (errMsg: string) => {
  error.value = errMsg;
};

const onSelectOrganization = async (orgId: string, orgData: any) => {
  try {
    authService.selectOrganization(orgId, orgData, loginResponse.value?.data?.first_time_setup);
    await navigateTo('/dashboard');
  } catch (err: any) {
    error.value = $i18n.t('login.genericError');
  }
};

</script>

<template>
  <div class="max-w-md w-full space-y-8 mx-auto">
    <div v-if="loadingValidation" class="flex justify-center">
      <Spinner />
    </div>
    <div v-else-if="!showOrganizationSelection">
      <div class="flex justify-center flex-col">
        <div class="flex justify-center">
          <img src="/assets/images/prebunking-logo.png" class="w-48">
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('magicLogin.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('magicLogin.subtitle') }}
        </p>
      </div>
      <!--Email form-->
      <form class="mt-8 space-y-6" @submit.prevent="handleRequestMagicLink">
        <div class="mb-4">
          <div>
            <label for="email-address" class="sr-only">{{ $t('login.email') }}</label>
            <input id="email-address" v-model="email" name="email" type="email" autocomplete="email" required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              :placeholder="$t('login.email')">
          </div>
        </div>
        
        <!--Feedback Messages-->
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>
        <div v-else-if="successMessage" class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                {{ successMessage }}
              </h3>
            </div>
          </div>
        </div>
        
        <div class="w-full flex items-center justify-between">
          <Button type="submit" class="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50"
            :disabled="loading">
            {{ loading ? $t('magicLogin.sendingLink') : $t('magicLogin.sendLink') }}
          </Button>
        </div>
      </form>
      <hr class="my-2 w-full border-t border-gray-300"/>
      <!-- Magic Link Login Button -->
      <div class="flex flex-col space-y-2 items-center justify-center">
        <Button
          variant="outline"
          class="w-full border-green-600 text-green-600 hover:bg-green-50"
          @click="goToLogin"
        >
          {{ $t('common.back') }}
        </Button>
      </div>
    </div>
    <!-- Organization Selection -->
    <OrganizationSelection
      v-else
      :organizations="organizations"
      @resetLogin="onResetLogin"
      @error="onError"
      :selectOrganization="onSelectOrganization"
      :first-time-setup="loginResponse?.data?.first_time_setup"
    />
  </div>
</template>
