<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ isEdit ? $t('channels.editKeywordFeedTitle') : $t('channels.addKeywordFeedTitle') }}
        </DialogTitle>
      </DialogHeader>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
        <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
      </div>
      <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
        <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
      </div>

      <div class="space-y-4">
        <!-- Topic Selection -->
        <div class="space-y-2">
          <Label for="topic">{{ $t('channels.selectTopic') }}</Label>
          <!-- Edit mode: topic is locked -->
          <div
            v-if="isEdit"
            class="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-gray-700"
          >
            {{ feed?.topic_name }}
          </div>
          <!-- Create mode: topic selector -->
          <Select v-else v-model="form.topic" :disabled="loading || loadingTopics">
            <SelectTrigger>
              <SelectValue :placeholder="$t('channels.selectTopicPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <div v-if="loadingTopics" class="py-2 px-3 text-sm text-gray-500">
                {{ $t('common.loading') }}
              </div>
              <div v-else-if="topics.length === 0" class="py-2 px-3 text-sm text-gray-500">
                {{ $t('channels.noTopicsAvailable') }}
              </div>
              <SelectItem
                v-for="topic in topics"
                :key="topic.id"
                :value="topic.id"
              >
                {{ topic.topic }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Keywords Input with Pills -->
        <div class="space-y-2">
          <Label for="keywords">{{ $t('channels.keywordsLabel') }}</Label>

          <!-- Keywords Pills -->
          <div v-if="keywords.length > 0" class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(keyword, index) in keywords"
              :key="index"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              {{ keyword }}
              <button
                type="button"
                class="hover:bg-green-200 rounded-full p-0.5"
                @click="removeKeyword(index)"
                :disabled="loading"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>

          <!-- Input for new keywords -->
          <Input
            id="keywords"
            v-model="keywordInput"
            :placeholder="$t('channels.keywordsPlaceholder')"
            :disabled="loading"
            @keydown.enter.prevent="addKeywordsFromInput"
            @keydown.comma.prevent="addKeywordsFromInput"
            @blur="addKeywordsFromInput"
          />
          <p class="text-xs text-gray-500">{{ $t('channels.keywordsHint') }}</p>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" @click="closeDialog" :disabled="loading">
          {{ $t('common.cancel') }}
        </Button>
        <Button
          type="button"
          class="cursor-pointer"
          :disabled="!canSubmit || loading"
          @click="submit"
        >
          <span v-if="loading">{{ isEdit ? $t('common.saving') : $t('common.creating') }}</span>
          <span v-else>{{ isEdit ? $t('common.save') : $t('common.create') }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { apiService } from '~/services/api';
import type { TopicWithStats, KeywordFeed } from '~/types/api';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  feed?: KeywordFeed | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved'): void;
}>();

const isEdit = computed(() => !!props.feed);

const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const loading = ref(false);
const loadingTopics = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const topics = ref<TopicWithStats[]>([]);

const form = ref({
  topic: ''
});

const keywordInput = ref('');
const keywords = ref<string[]>([]);

const canSubmit = computed(() => {
  return keywords.value.length > 0 && (isEdit.value || form.value.topic !== '');
});

const addKeywordsFromInput = () => {
  const newKeywords = keywordInput.value
    .split(',')
    .map(k => k.trim())
    .filter(k => k !== '' && !keywords.value.includes(k));

  if (newKeywords.length > 0) {
    keywords.value.push(...newKeywords);
  }
  keywordInput.value = '';
};

const removeKeyword = (index: number) => {
  keywords.value.splice(index, 1);
};

const loadTopics = async () => {
  try {
    loadingTopics.value = true;
    const response = await apiService.getTopicsWithStats({ limit: 100 });
    topics.value = response.data || [];
  } catch (error) {
    console.error('Failed to load topics:', error);
    topics.value = [];
  } finally {
    loadingTopics.value = false;
  }
};

const resetForm = () => {
  form.value = {
    topic: ''
  };
  keywordInput.value = '';
  keywords.value = [];
  successMessage.value = '';
  errorMessage.value = '';
};

const closeDialog = () => {
  resetForm();
  dialogOpen.value = false;
};

const submit = async () => {
  // Add any pending input before submitting
  addKeywordsFromInput();

  if (keywords.value.length === 0) {
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    if (isEdit.value && props.feed) {
      await apiService.updateKeywordFeed(props.feed.id, {
        topic_id: props.feed.topic_id,
        keywords: keywords.value
      });
      successMessage.value = t('channels.keywordFeedUpdateSuccess');
    } else {
      await apiService.createKeywordFeed({
        topic_id: form.value.topic,
        keywords: keywords.value
      });
      successMessage.value = t('channels.keywordFeedCreateSuccess');
    }

    emit('saved');

    // Close dialog after short delay to show success message
    setTimeout(() => {
      closeDialog();
    }, 1500);
  } catch (error: any) {
    console.error('Failed to save keyword feed:', error);
    const fallback = isEdit.value
      ? t('channels.keywordFeedUpdateError')
      : t('channels.keywordFeedCreateError');
    errorMessage.value = error.data?.detail || error.message || fallback;
  } finally {
    loading.value = false;
  }
};

// Prepare the form whenever the dialog opens
watch(dialogOpen, (isOpen) => {
  if (!isOpen) {
    return;
  }

  successMessage.value = '';
  errorMessage.value = '';
  keywordInput.value = '';

  if (isEdit.value && props.feed) {
    form.value.topic = props.feed.topic_id;
    keywords.value = [...(props.feed.keywords ?? [])];
  } else {
    form.value.topic = '';
    keywords.value = [];
    loadTopics();
  }
});
</script>
