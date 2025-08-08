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
  enabled: true
})

const narratives = ref<any[]>([])
const topics = ref<any[]>([])
const loading = ref(false)
const validationError = ref<string | null>(null)
const currentNarrative = ref<any>(null)

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

const onTypeChange = (type: string) => {
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

const handleSubmit = async () => {
  loading.value = true
  validationError.value = null

  try {
    if (props.mode === 'create') {
      const error = validateAlertRequest(formData.value)
      if (error) {
        validationError.value = error
        return
      }

      const alert = await createAlert(formData.value)
      emit('save', alert)
      toast.add({
        title: t('common.success'),
        description: t('alerts.create_success')
      })
    } else if (props.alert) {
      const updateRequest: UpdateAlertRequest = {
        name: formData.value.name,
        enabled: formData.value.enabled
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
        enabled: props.alert.enabled
      }
    } else {
      // When creating from narrative page, always set scope to specific
      formData.value = {
        name: '',
        scope: props.narrativeId ? 'specific' : 'general',
        alert_type: props.narrativeId ? 'narrative_views' : 'narrative_with_topic',
        narrative_id: props.narrativeId,
        enabled: true
      }
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
  if (props.narrativeId) {
    loadCurrentNarrative()
  }
})
</script>