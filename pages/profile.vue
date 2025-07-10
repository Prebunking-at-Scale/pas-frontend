<template>
  <div>

      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">{{ $t('profile.personalInfo') }}</h3>
        </div>
        <div class="p-6">
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.name') }}</label>
              <input 
                v-model="user.name"
                type="text" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.email') }}</label>
              <input 
                v-model="user.email"
                type="email" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                disabled
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.role') }}</label>
              <input 
                v-model="user.role"
                type="text" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                disabled
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.memberSince') }}</label>
              <input 
                :value="formatDate(user.created_at)"
                type="text" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                disabled
              >
            </div>
          </form>
        </div>
      </div>

      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">{{ $t('profile.changePassword') }}</h3>
        </div>
        <div class="p-6">
          <form @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.currentPassword') }}</label>
              <input 
                v-model="passwordForm.current"
                type="password" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.newPassword') }}</label>
              <input 
                v-model="passwordForm.new"
                type="password" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('profile.confirmPassword') }}</label>
              <input 
                v-model="passwordForm.confirm"
                type="password" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
            </div>
            <div class="flex justify-end">
              <button 
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {{ $t('profile.updatePassword') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-red-900">{{ $t('profile.dangerZone') }}</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">{{ $t('profile.deleteAccountWarning') }}</p>
          <button 
            @click="showDeleteConfirm = true"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            {{ $t('profile.deleteAccount') }}
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('profile.confirmDelete') }}</h3>
          <p class="text-sm text-gray-600 mb-6">{{ $t('profile.deleteConfirmMessage') }}</p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteConfirm = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              @click="deleteAccount"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { User } from '~/types/api';

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
  name: '',
  role: '',
  created_at: ''
});

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
});

const showDeleteConfirm = ref(false);

// Load user data
onMounted(async () => {
  try {
    const currentUser = await apiService.getCurrentUser();
    if (currentUser) {
      user.value = currentUser;
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
});

// Methods
const updateProfile = async () => {
  // Mock profile update
  alert($i18n.t('profile.profileUpdated'));
};

const changePassword = async () => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    alert($i18n.t('profile.passwordMismatch'));
    return;
  }
  // Mock password change
  alert($i18n.t('profile.passwordChanged'));
  passwordForm.value = {
    current: '',
    new: '',
    confirm: ''
  };
};

const deleteAccount = async () => {
  // Mock account deletion
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
  }
  router.push('/login');
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>