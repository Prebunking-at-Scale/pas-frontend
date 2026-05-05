<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ mode === 'create' ? $t('alerts.create_new') : $t('alerts.edit_alert') }}
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">{{ $t('alerts.name') }}</Label>
          <Input
            id="name"
            v-model="formData.name"
            :placeholder="$t('alerts.name_placeholder')"
            :maxlength="255"
            required
          />
        </div>

        <!-- Show immutable scope and narrative info when creating from narrative page -->
        <div v-if="mode === 'create' && narrativeId" class="space-y-4">
          <div class="space-y-2">
            <Label>{{ $t('alerts.scope.label') }}</Label>
            <div class="flex items-center p-2 border rounded-md bg-muted">
              <Badge variant="secondary" class="text-xs">
                {{ $t(`alerts.scope.${formData.scope}`) }}
              </Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>{{ $t('alerts.narrative') }}</Label>
            <div class="flex items-center p-2 border rounded-md bg-muted">
              <span class="text-sm">{{ getNarrativeName() }}</span>
            </div>
          </div>
        </div>

        <div v-if="mode === 'create'" class="space-y-2">
          <Label for="alert_type">{{ $t('alerts.type.label') }}</Label>
          <Select v-model="formData.alert_type" @update:modelValue="onTypeChange" required>
            <SelectTrigger>
              <SelectValue :placeholder="$t('alerts.type.placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="type in availableAlertTypes" 
                :key="type" 
                :value="type"
              >
                {{ $t(`alerts.type.${type}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="showThresholdField" class="space-y-2">
          <Label for="threshold">{{ $t('alerts.threshold') }}</Label>
          <Input
            id="threshold"
            v-model.number="formData.threshold"
            type="number"
            min="1"
            :placeholder="$t('alerts.threshold_placeholder')"
            required
          />
        </div>

        <div v-if="showTopicField" class="space-y-2">
          <Label for="topic">{{ $t('alerts.topic') }}</Label>
          <Select v-model="formData.topic_id" required>
            <SelectTrigger>
              <SelectValue :placeholder="$t('alerts.topic_placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="topic in topics" :key="topic.id" :value="topic.id">
                {{ topic.topic }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="showKeywordField" class="space-y-2">
          <Label for="keyword">{{ $t('alerts.keyword') }}</Label>
          <Input
            id="keyword"
            v-model="formData.keyword"
            :placeholder="$t('alerts.keyword_placeholder')"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="notificationChannel">{{ $t('alerts.notificationChannel') }}</Label>
          <ComboboxRoot v-model="selectedChannels" multiple>
            <div class="flex flex-col gap-2">
              <!-- Selected channels display -->
              <div v-if="selectedChannelLabels.length > 0" class="flex flex-wrap gap-2">
                <Badge 
                  v-for="(label, index) in selectedChannelLabels" 
                  :key="index"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ label }}
                </Badge>
              </div>
              <!-- Combobox button trigger and dropdown -->
              <div class="relative z-10">
                <ComboboxAnchor as-child>
                  <ComboboxTrigger class="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-background hover:bg-accent/5 transition-colors cursor-pointer">
                    <span class="text-sm text-muted-foreground">
                      {{ selectedChannelLabels.length > 0 
                          ? `${selectedChannelLabels.length} ${selectedChannelLabels.length === 1 ? $t('alerts.channel_selected') : $t('alerts.channels_selected')}` 
                          : $t('alerts.select_channels_placeholder') 
                      }}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50 flex-shrink-0">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </ComboboxTrigger>
                </ComboboxAnchor>
                <ComboboxContent class="absolute top-full left-0 right-0 mt-1 z-50 max-h-[300px] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  <ComboboxViewport class="p-1">
                    <ComboboxEmpty class="py-6 text-center text-sm text-muted-foreground">{{ $t('common.no_results') }}</ComboboxEmpty>
                    <ComboboxItem 
                      v-for="channel in availableChannels" 
                      :key="channel.value" 
                      :value="channel.value" 
                      class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:bg-accent/50"
                    >
                      <span class="mr-2">{{ selectedChannels.includes(channel.value) ? '✓' : '' }}</span>
                      {{ channel.label }}
                    </ComboboxItem>
                    <ComboboxItem 
                      v-if="availableChannels.length === 1 && availableChannels[0].value === 'email'" 
                      disabled
                      :value="null"
                      class="flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground"
                    >
                      {{ $t('alerts.activate_slack_integration') }}
                    </ComboboxItem>
                  </ComboboxViewport>
                </ComboboxContent>
              </div>
            </div>
          </ComboboxRoot>
        </div>

        <div class="flex items-center space-x-2">
          <Switch
            id="enabled"
            v-model="formData.enabled"
          />
          <Label for="enabled">{{ $t('alerts.enabled') }}</Label>
        </div>

        <div v-if="validationError" class="text-sm text-destructive">
          {{ validationError }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="dialogOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? $t('common.saving') : $t('common.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Alert, CreateAlertRequest, UpdateAlertRequest, AlertType, AlertScope } from '~/types/alert'
import type { AlertChannel } from '~/types/api'
import { apiService } from '~/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
  ComboboxAnchor,
  ComboboxViewport,
  ComboboxEmpty,
 } from 'reka-ui'

interface Props {
  open: boolean
  alert?: Alert | null
  mode: 'create' | 'edit'
  narrativeId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [alert: Alert]
}>()

const { t } = useI18n()
const { createAlert, updateAlert, validateAlertRequest } = useAlerts()
const toast = useToast()

const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formData = ref<CreateAlertRequest>({
  name: '',
  scope: 'general',
  alert_type: 'narrative_views',
  enabled: true,
  channels: []
})

const narratives = ref<any[]>([])
const topics = ref<any[]>([])
const loading = ref(false)
const validationError = ref<string | null>(null)
const currentNarrative = ref<any>(null)
const availableChannels = ref<any[]>([])
const selectedChannels = ref<string[]>([])

const selectedChannelLabels = computed(() => {
  if (!selectedChannels.value || selectedChannels.value.length === 0) {
    return []
  }
  return selectedChannels.value
    .map(value => availableChannels.value.find(c => c.value === value)?.label)
    .filter(Boolean)
})

const availableAlertTypes = computed(() => {
  // When creating from alerts page (no narrativeId), show all alert types
  if (!props.narrativeId) {
    return ['narrative_views', 'narrative_claims_count', 'narrative_videos_count', 'narrative_with_topic', 'keyword']
  }
  // When creating from narrative page with specific scope
  if (formData.value.scope === 'specific') {
    return ['narrative_views', 'narrative_claims_count', 'narrative_videos_count']
  }
  // When creating from narrative page with general scope
  return ['narrative_with_topic', 'keyword']
})

const showThresholdField = computed(() => {
  return ['narrative_views', 'narrative_claims_count', 'narrative_videos_count'].includes(formData.value.alert_type)
})

const showTopicField = computed(() => {
  return formData.value.alert_type === 'narrative_with_topic'
})

const showKeywordField = computed(() => {
  return formData.value.alert_type === 'keyword'
})

const onScopeChange = (scope: string) => {
  formData.value.scope = scope as AlertScope
  if (scope === 'general') {
    delete formData.value.narrative_id
    formData.value.alert_type = 'narrative_with_topic'
  } else {
    formData.value.narrative_id = props.narrativeId
    formData.value.alert_type = 'narrative_views'
  }
  resetFieldsForType()
}

const onTypeChange = (type: any) => {
  if (!type || typeof type !== 'string') return
  formData.value.alert_type = type as AlertType
  resetFieldsForType()
}

const resetFieldsForType = () => {
  delete formData.value.threshold
  delete formData.value.topic_id
  delete formData.value.keyword
  validationError.value = null
}

const getNarrativeName = () => {
  if (currentNarrative.value) {
    return currentNarrative.value.title || currentNarrative.value.description || props.narrativeId
  }
  return props.narrativeId || ''
}

const loadNarratives = async () => {
  try {
    const response = await apiService.getNarratives({ limit: 100 })
    narratives.value = response.data || []
  } catch (error) {
    console.error('Failed to load narratives:', error)
    narratives.value = []
  }
}

const loadCurrentNarrative = async () => {
  if (props.narrativeId) {
    try {
      currentNarrative.value = await apiService.getNarrative(props.narrativeId)
    } catch (error) {
      console.error('Failed to load narrative:', error)
    }
  }
}

const loadTopics = async () => {
  try {
    const response = await apiService.getTopicsWithStats({ limit: 100 })
    topics.value = response.data || []
  } catch (error) {
    console.error('Failed to load topics:', error)
    topics.value = []
  }
}

const loadChannels = async () => {
  const channels = [{ 
    channel_type: 'email', 
    label: 'Email',
    value: 'email',
  }] as any[]
  try {
    const response = await apiService.getSlackInstallations()
    response.forEach((installation) => {
      channels.push({
        channel_type: 'slack',
        label: `#${installation.incoming_webhook_channel} (Slack)`,
        slack_channel_id: installation.incoming_webhook_channel_id,
        value: `slack:${installation.incoming_webhook_channel_id}`,
      })
    })
  } catch (error) {
    console.error('Failed to load channels:', error)
  } finally {
    availableChannels.value = channels
  }
}

const handleSubmit = async () => {
  loading.value = true
  validationError.value = null

  try {
    // Populate formData.channels with selectedChannels before validation
    formData.value.channels = selectedChannels.value.map(value => {
      const channel = availableChannels.value.find(c => c.value === value)
      if (!channel) return null
      return {
        channel_type: channel.channel_type,
        slack_channel_id: channel.slack_channel_id
      }
    }).filter(Boolean) as AlertChannel[]

    const error = validateAlertRequest(formData.value)
    if (error) {
      validationError.value = error
      return
    }

    if (props.mode === 'create') {

      const alert = await createAlert(formData.value)
      emit('save', alert)
      toast.add({
        title: t('common.success'),
        description: t('alerts.create_success')
      })
    } else if (props.alert) {
      const updateRequest: UpdateAlertRequest = {
        name: formData.value.name,
        enabled: formData.value.enabled,
        channels: formData.value.channels
      }
      if (showThresholdField.value) {
        updateRequest.threshold = formData.value.threshold
      }
      if (showKeywordField.value) {
        updateRequest.keyword = formData.value.keyword
      }

      const alert = await updateAlert(props.alert.id, updateRequest)
      emit('save', alert)
      toast.add({
        title: t('common.success'),
        description: t('alerts.update_success')
      })
    }
    dialogOpen.value = false
  } catch (error: any) {
    validationError.value = error.message || t('common.error_occurred')
    toast.add({
      title: t('common.error'),
      description: error.message || t('common.error_occurred'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (newValue) => {
  if (newValue) {
    if (props.mode === 'edit' && props.alert) {
      formData.value = {
        name: props.alert.name,
        scope: props.alert.scope,
        alert_type: props.alert.alert_type,
        narrative_id: props.alert.narrative_id,
        threshold: props.alert.threshold,
        topic_id: props.alert.topic_id,
        keyword: props.alert.keyword,
        enabled: props.alert.enabled,
        channels: props.alert.channels || []
      }
      // Initialize selectedChannels from alert data
      selectedChannels.value = (props.alert.channels || []).map(ch => {
        if (ch.channel_type === 'email') return 'email'
        if (ch.channel_type === 'slack' && ch.slack_channel_id) {
          return `slack:${ch.slack_channel_id}`
        }
        return null
      }).filter(Boolean) as string[]
    } else {
      // When creating from narrative page, always set scope to specific
      formData.value = {
        name: '',
        scope: props.narrativeId ? 'specific' : 'general',
        alert_type: props.narrativeId ? 'narrative_views' : 'narrative_with_topic',
        narrative_id: props.narrativeId,
        enabled: true,
        channels: []
      }
      selectedChannels.value = []
    }
    validationError.value = null
    
    // Load current narrative if creating from narrative page
    if (props.narrativeId && props.mode === 'create') {
      loadCurrentNarrative()
    }
  }
})

onMounted(() => {
  loadNarratives()
  loadTopics()
  loadChannels()
  if (props.narrativeId) {
    loadCurrentNarrative()
  }
})
</script>