<template>
  <div>

      <Card>
        <CardHeader>
          <CardTitle>{{ $t('profile.personalInfo') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="space-y-2">
              <Label for="name">{{ $t('profile.name') }}</Label>
              <Input 
                id="name"
                v-model="user.name"
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
            <div class="space-y-2">
              <Label for="role">{{ $t('profile.role') }}</Label>
              <Input 
                id="role"
                v-model="user.role"
                type="text" 
                disabled
              />
            </div>
            <div class="space-y-2">
              <Label for="memberSince">{{ $t('profile.memberSince') }}</Label>
              <Input 
                id="memberSince"
                :value="formatDate(user.created_at, $i18n.locale.value)"
                type="text" 
                disabled
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card class="mt-6">
        <CardHeader>
          <CardTitle>{{ $t('profile.changePassword') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="changePassword" class="space-y-4">
            <div class="space-y-2">
              <Label for="currentPassword">{{ $t('profile.currentPassword') }}</Label>
              <Input 
                id="currentPassword"
                v-model="passwordForm.current"
                type="password" 
              />
            </div>
            <div class="space-y-2">
              <Label for="newPassword">{{ $t('profile.newPassword') }}</Label>
              <Input 
                id="newPassword"
                v-model="passwordForm.new"
                type="password" 
              />
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
              <Button type="submit">
                {{ $t('profile.updatePassword') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card class="mt-6">
        <CardHeader>
          <CardTitle class="text-destructive">{{ $t('profile.dangerZone') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">{{ $t('profile.deleteAccountWarning') }}</p>
          <Button 
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
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { User } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { formatDate } from '~/utils/date';

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

</script>