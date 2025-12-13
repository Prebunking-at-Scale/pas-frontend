<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ $t('channels.addChannelFeed') }}</DialogTitle>
      </DialogHeader>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
        <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
      </div>
      <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
        <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
      </div>

      <div class="space-y-6">
        <!-- Add by Username Section -->
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-900">{{ $t('channels.addByUsername') }}</h3>
            <p class="text-sm text-gray-500">{{ $t('channels.addByUsernameDescription') }}</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <Label for="channelName">{{ $t('channels.channelName') }}</Label>
              <Input
                id="channelName"
                v-model="usernameForm.channel"
                :placeholder="$t('channels.channelNamePlaceholder')"
                :disabled="loading"
              />
            </div>

            <div class="space-y-2">
              <Label>{{ $t('channels.platform') }}</Label>
              <div class="flex gap-2">
                <Button
                  type="button"
                  :variant="usernameForm.platform === 'youtube' ? 'default' : 'outline'"
                  size="sm"
                  class="cursor-pointer"
                  @click="usernameForm.platform = 'youtube'"
                  :disabled="loading"
                >
                  YouTube
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="cursor-not-allowed opacity-50"
                  disabled
                  :title="$t('channels.comingSoon')"
                >
                  TikTok
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="cursor-not-allowed opacity-50"
                  disabled
                  :title="$t('channels.comingSoon')"
                >
                  Instagram
                </Button>
              </div>
            </div>

            <Button
              type="button"
              class="w-full cursor-pointer"
              :disabled="!canSubmitUsername || loading"
              @click="submitByUsername"
            >
              <span v-if="loading && submittingType === 'username'">{{ $t('common.creating') }}</span>
              <span v-else>{{ $t('common.create') }}</span>
            </Button>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Add by URL Section -->
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-900">{{ $t('channels.addByUrl') }}</h3>
            <p class="text-sm text-gray-500">{{ $t('channels.addByUrlDescription') }}</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <Label for="channelUrl">{{ $t('channels.channelUrl') }}</Label>
              <Input
                id="channelUrl"
                v-model="urlForm.url"
                :placeholder="$t('channels.channelUrlPlaceholder')"
                :disabled="loading"
              />
            </div>

            <Button
              type="button"
              class="w-full cursor-pointer"
              :disabled="!canSubmitUrl || loading"
              @click="submitByUrl"
            >
              <span v-if="loading && submittingType === 'url'">{{ $t('common.creating') }}</span>
              <span v-else>{{ $t('common.create') }}</span>
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="closeDialog" :disabled="loading">
          {{ $t('common.cancel') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { apiService } from '~/services/api';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created'): void;
}>();

const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const loading = ref(false);
const submittingType = ref<'username' | 'url' | null>(null);
const successMessage = ref('');
const errorMessage = ref('');

const usernameForm = ref({
  channel: '',
  platform: 'youtube' as 'youtube' | 'tiktok' | 'instagram'
});

const urlForm = ref({
  url: ''
});

const canSubmitUsername = computed(() => {
  return usernameForm.value.channel.trim() !== '' && usernameForm.value.platform !== null;
});

const canSubmitUrl = computed(() => {
  return urlForm.value.url.trim() !== '';
});

const resetForm = () => {
  usernameForm.value = {
    channel: '',
    platform: 'youtube'
  };
  urlForm.value = {
    url: ''
  };
  successMessage.value = '';
  errorMessage.value = '';
};

const closeDialog = () => {
  resetForm();
  dialogOpen.value = false;
};

const submitByUsername = async () => {
  try {
    loading.value = true;
    submittingType.value = 'username';
    errorMessage.value = '';
    successMessage.value = '';

    await apiService.createChannelFeed({
      channel: usernameForm.value.channel.trim(),
      platform: usernameForm.value.platform
    });

    successMessage.value = t('channels.createSuccess');
    emit('created');

    // Close dialog after short delay to show success message
    setTimeout(() => {
      closeDialog();
    }, 1500);
  } catch (error: any) {
    console.error('Failed to create channel feed:', error);
    errorMessage.value = error.data?.detail || error.message || t('channels.createError');
  } finally {
    loading.value = false;
    submittingType.value = null;
  }
};

const submitByUrl = async () => {
  try {
    loading.value = true;
    submittingType.value = 'url';
    errorMessage.value = '';
    successMessage.value = '';

    await apiService.createChannelFeedFromUrl({
      url: urlForm.value.url.trim()
    });

    successMessage.value = t('channels.createSuccess');
    emit('created');

    // Close dialog after short delay to show success message
    setTimeout(() => {
      closeDialog();
    }, 1500);
  } catch (error: any) {
    console.error('Failed to create channel feed from URL:', error);
    errorMessage.value = error.data?.detail || error.message || t('channels.createError');
  } finally {
    loading.value = false;
    submittingType.value = null;
  }
};
</script>
