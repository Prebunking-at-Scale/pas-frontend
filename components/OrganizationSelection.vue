<template>
  <!-- Organization Selection -->
  <div class="space-y-6">
    <div class="flex justify-center flex-col">
      <div class="flex justify-center">
        <img src="/assets/images/prebunking-logo.png" class="w-48">
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ $t('login.selectOrganization') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ $t('login.multipleOrganizations') }}
      </p>
    </div>

    <div class="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="(orgData, orgId) in organizations" :key="orgId"
        class="cursor-pointer hover:border-green-500 transition-colors" @click="onSelectOrganization(orgId, orgData)">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-lg">{{ orgData.organisation.display_name }}</h3>
              <p class="text-sm text-gray-500">{{ orgData.organisation.short_name }}</p>
              <div v-if="orgData.is_organisation_admin" class="mt-1">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ $t('profile.admin') }}
                </span>
              </div>
            </div>
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="mt-6">
      <Button variant="outline" class="w-full" @click="emit('resetLogin')">
        {{ $t('common.back') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth';
const { $i18n } = useNuxtApp();

const props = defineProps<{
  organizations: Record<string, any>;
  firstTimeSetup: boolean;
}>();

const emit = defineEmits<{
  (e: 'resetLogin'): void;
  (e: 'error', error: string): void;
}>();

const onSelectOrganization = async (orgId: string, orgData: any) => {
  try {
    authService.selectOrganization(orgId, orgData, props.firstTimeSetup);
    await navigateTo('/dashboard');
  } catch (err: any) {
    // Handle error (you might want to emit an event or show a message)
    emit('error', $i18n.t('login.genericError'));
  }
};

</script>