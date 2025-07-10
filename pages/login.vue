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

        <div class="text-center">
          <button
            type="button"
            @click="bypassLogin"
            class="text-sm text-green-600 hover:text-green-500"
          >
            {{ $t('login.bypassAuth') }}
          </button>
        </div>
      </form>
    </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import {Button} from "~/components/ui/button";

definePageMeta({
  layout: 'auth'
});

const { $i18n } = useNuxtApp();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const { user, token } = await apiService.login(email.value, password.value);

    // Store token in localStorage (mock)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Redirect to dashboard
    await navigateTo('/dashboard');
  } catch (err: any) {
    error.value = err.message || $i18n.t('login.error');
  } finally {
    loading.value = false;
  }
};

const bypassLogin = () => {
  // Mock bypass authentication
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('auth-token', 'mock-bypass-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'user-bypass',
      email: 'bypass@example.com',
      name: 'Bypass User',
      role: 'admin',
      created_at: new Date().toISOString()
    }));
  }

  navigateTo('/dashboard');
};
</script>
