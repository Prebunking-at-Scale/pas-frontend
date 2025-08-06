<template>
  <div class="max-w-md w-full space-y-8 mx-auto">
    <div class="flex justify-center flex-col">
      <div class="flex justify-center">
        <img src="/assets/images/prebunking-logo.png" class="w-48">
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ $t('invitation.title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ $t('invitation.subtitle') }}
      </p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ error }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Manual token entry form -->
    <form v-if="!autoAccepting" @submit.prevent="acceptInvitation" class="mt-8 space-y-6">
      <div class="space-y-4">
        <div>
          <Label for="token">{{ $t('invitation.tokenLabel') }}</Label>
          <Input
            id="token"
            v-model="inviteToken"
            type="text"
            :placeholder="$t('invitation.tokenPlaceholder')"
            required
            class="mt-1"
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          class="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50"
          :disabled="loading || !inviteToken"
        >
          {{ loading ? $t('invitation.accepting') : $t('invitation.accept') }}
        </Button>
      </div>
    </form>

    <!-- Auto-accepting message -->
    <div v-else class="mt-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
      <p class="mt-4 text-gray-600">
        {{ loading ? $t('invitation.autoAccepting') : $t('invitation.accepting') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { authService } from '~/services/auth';

definePageMeta({
  layout: 'auth',
  middleware: [] // No auth required for invitation page
});

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const { apiFetch } = useApi();

// Check for token immediately to set initial state
const tokenFromUrl = route.query.token as string || route.query.invite_token as string;

// State - initialize autoAccepting based on token presence
const inviteToken = ref(tokenFromUrl || '');
const loading = ref(!!tokenFromUrl); // Start loading if we have a token
const error = ref('');
const autoAccepting = ref(!!tokenFromUrl);

// Check for token in query params on mount
onMounted(async () => {
  if (tokenFromUrl) {
    await acceptInvitation();
  }
});

// Accept invitation function
const acceptInvitation = async () => {
  if (!inviteToken.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await apiFetch('/api/auth/organisation/invite/accept', {
      method: 'GET',
      query: {
        invite_token: inviteToken.value
      }
    });

    // Extract the response data
    const { user, organisations, first_time_setup } = response.data;

    // Store user information
    authService.setUser(user);

    // Get the first organization (users are only in one org)
    const orgId = Object.keys(organisations)[0];
    const orgData = organisations[orgId];
    
    // Store the token and organization
    authService.setToken(orgData.token);
    authService.setOrganization(orgData.organisation.id);
    
    // Store first time setup flag and user data in session storage for the profile page
    if (first_time_setup) {
      sessionStorage.setItem('first_time_setup', 'true');
      // Store the user data to populate profile form
      sessionStorage.setItem('invitation_user_data', JSON.stringify({
        email: user.email,
        display_name: user.display_name || '',
        organization: orgData.organisation
      }));
    }

    // User is now logged in - redirect to profile
    await router.push('/profile');
  } catch (err: any) {
    error.value = err.data?.detail || err.message || $i18n.t('invitation.error');
    autoAccepting.value = false; // Show form if auto-accept fails
  } finally {
    loading.value = false;
  }
};
</script>