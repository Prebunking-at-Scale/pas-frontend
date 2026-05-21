<template>
  <ClientOnly>
    <template #fallback>
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
          <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
        </div>
      </div>
    </template>
    <div class="space-y-8">
      <!-- Channel Feeds Section -->
      <Card class="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="px-4 py-3 sm:p-4">
          <div class="flex justify-between items-center">
            <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('channels.channelFeeds') }}</CardTitle>
            <Button class="cursor-pointer" @click="showAddChannelDialog = true">
              <Plus class="mr-2 h-4 w-4" />
              {{ $t('channels.addChannelFeed') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <!-- Loading state -->
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
          </div>

          <!-- Channel Feeds table -->
          <div v-else-if="channelFeeds.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.channel') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.platform') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.status') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.createdAt') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="feed in channelFeeds" :key="feed.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a
                      v-if="feed.platform === 'youtube'"
                      :href="getChannelUrl(feed)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {{ feed.channel }}
                    </a>
                    <span v-else>{{ feed.channel }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span :class="getPlatformBadgeClass(feed.platform)">
                      {{ getPlatformLabel(feed.platform) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span :class="getStatusBadgeClass(!feed.is_archived)">
                      {{ !feed.is_archived ? $t('common.active') : $t('common.inactive') }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(feed.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8">
            <p class="text-gray-500">{{ $t('channels.noChannelFeeds') }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Keyword Feeds Section -->
      <Card class="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader class="px-4 py-3 sm:p-4">
          <div class="flex justify-between items-center">
            <CardTitle class="text-lg leading-6 font-medium text-gray-900">{{ $t('channels.keywordFeeds') }}</CardTitle>
            <Button class="cursor-pointer" @click="openAddKeywordDialog">
              <Plus class="mr-2 h-4 w-4" />
              {{ $t('channels.addKeywordFeed') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pb-4 px-4 sm:px-6">
          <!-- Loading state -->
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ $t('common.loading') }}</p>
          </div>

          <!-- Keyword Feeds table -->
          <div v-else-if="keywordFeeds.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.topic') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.keywords') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.status') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.createdAt') }}
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('channels.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="feed in keywordFeeds" :key="feed.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ feed.topic_name }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="keyword in feed.keywords"
                        :key="keyword"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {{ keyword }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span :class="getStatusBadgeClass(!feed.is_archived)">
                      {{ !feed.is_archived ? $t('common.active') : $t('common.inactive') }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(feed.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon">
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem class="cursor-pointer" @click="openEditKeywordDialog(feed)">
                          <Pencil class="mr-2 h-4 w-4" />
                          {{ $t('common.edit') }}
                        </DropdownMenuItem>
                        <template v-if="!feed.is_archived">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem class="cursor-pointer text-red-600" @click="confirmArchive(feed)">
                            <Archive class="mr-2 h-4 w-4" />
                            {{ $t('common.archive') }}
                          </DropdownMenuItem>
                        </template>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8">
            <p class="text-gray-500">{{ $t('channels.noKeywordFeeds') }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Add Channel Feed Dialog -->
      <AddChannelFeedDialog
        v-model:open="showAddChannelDialog"
        @created="loadMediaFeeds"
      />

      <!-- Add / Edit Keyword Feed Dialog -->
      <KeywordFeedDialog
        v-model:open="showKeywordDialog"
        :feed="editingFeed"
        @saved="loadMediaFeeds"
      />

      <!-- Archive Keyword Feed Confirmation -->
      <AlertDialog :open="showArchiveDialog" @update:open="showArchiveDialog = $event">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ $t('channels.archiveKeywordFeedTitle') }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ $t('channels.archiveConfirmMessage', { topic: feedToArchive?.topic_name }) }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
            <AlertDialogAction
              class="bg-destructive text-white hover:bg-destructive/80"
              @click="archiveSelectedFeed"
            >
              {{ $t('common.archive') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Plus, MoreVertical, Pencil, Archive } from 'lucide-vue-next';
import type { ChannelFeed, KeywordFeed } from '~/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog';
import { apiService } from '~/services/api';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { fetchMediaFeeds } = useMediaFeeds();
const { t } = useI18n();
const toast = useToast();

const channelFeeds = ref<ChannelFeed[]>([]);
const keywordFeeds = ref<KeywordFeed[]>([]);
const loading = ref(true);
const showAddChannelDialog = ref(false);
const showKeywordDialog = ref(false);
const editingFeed = ref<KeywordFeed | null>(null);
const showArchiveDialog = ref(false);
const feedToArchive = ref<KeywordFeed | null>(null);

onMounted(async () => {
  await loadMediaFeeds();
});

const loadMediaFeeds = async () => {
  try {
    loading.value = true;
    const response = await fetchMediaFeeds();
    channelFeeds.value = response.channel_feeds || [];
    keywordFeeds.value = response.keyword_feeds || [];
  } catch (error) {
    console.error('Failed to load media feeds:', error);
  } finally {
    loading.value = false;
  }
};

const openAddKeywordDialog = () => {
  editingFeed.value = null;
  showKeywordDialog.value = true;
};

const openEditKeywordDialog = (feed: KeywordFeed) => {
  editingFeed.value = feed;
  showKeywordDialog.value = true;
};

const confirmArchive = (feed: KeywordFeed) => {
  feedToArchive.value = feed;
  showArchiveDialog.value = true;
};

const archiveSelectedFeed = async () => {
  if (!feedToArchive.value) return;

  try {
    await apiService.archiveKeywordFeed(feedToArchive.value.id);
    toast.add({
      title: t('common.success'),
      description: t('channels.keywordFeedArchiveSuccess')
    });
    await loadMediaFeeds();
  } catch (error: any) {
    console.error('Failed to archive keyword feed:', error);
    toast.add({
      title: t('common.error'),
      description: error.data?.detail || error.message || t('channels.keywordFeedArchiveError'),
      color: 'error'
    });
  } finally {
    feedToArchive.value = null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const getPlatformLabel = (platform: string) => {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram'
  };
  return labels[platform] || platform;
};

const getPlatformBadgeClass = (platform: string) => {
  const classes: Record<string, string> = {
    youtube: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
    tiktok: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white',
    instagram: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800'
  };
  return classes[platform] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
};

const getStatusBadgeClass = (isActive: boolean) => {
  return isActive
    ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
};

const getChannelUrl = (feed: ChannelFeed) => {
  if (feed.platform === 'youtube') {
    return `https://www.youtube.com/${feed.channel}`;
  }
  return '';
};
</script>
