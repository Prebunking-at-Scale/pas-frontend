<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">{{ $t('alerts.title') }}</h1>
      <Button @click="openCreateDialog">
        <Plus class="mr-2 h-4 w-4" />
        {{ $t('alerts.create_new') }}
      </Button>
    </div>

    <div class="space-y-4">
      <Card v-for="alert in alerts" :key="alert.id">
        <CardHeader>
          <div class="flex justify-between items-start">
            <div class="mt-6 text-lg">
              <CardTitle>{{ alert.name }}</CardTitle>
              <CardDescription class="mt-4">
                <Badge :variant="alert.scope === 'general' ? 'default' : 'secondary'" class="mr-2">
                  {{ $t(`alerts.scope.${alert.scope}`) }}
                </Badge>
                <Badge variant="outline">
                  {{ $t(`alerts.type.${alert.alert_type}`) }}
                  <span v-if="alert.threshold" class="ml-1">
                    ({{ alert.threshold }})
                  </span>
                </Badge>
              </CardDescription>
            </div>
            <div class="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem @click="openEditDialog(alert)">
                    <Edit class="mr-2 h-4 w-4" />
                    {{ $t('common.edit') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="confirmDelete(alert)" class="text-red-600">
                    <Trash class="mr-2 h-4 w-4" />
                    {{ $t('common.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div v-if="alert.keyword">
              <span class="text-muted-foreground">{{ $t('alerts.keyword') }}:</span>
              <span class="ml-2 font-medium">{{ alert.keyword }}</span>
            </div>
            <div v-if="alert.topic_id">
              <span class="text-muted-foreground">{{ $t('alerts.topic') }}:</span>
              <span class="ml-2 font-medium">{{ getTopicName(alert.topic_id) }}</span>
            </div>
            <div v-if="alert.narrative_id">
              <span class="text-muted-foreground">{{ $t('alerts.narrative') }}:</span>
              <NuxtLink :to="`/narratives/${alert.narrative_id}`" class="ml-2 font-medium text-primary hover:underline">
                {{ getNarrativeName(alert.narrative_id) }}
              </NuxtLink>
            </div>
          </div>
        </CardContent>
      </Card>

      <div v-if="alerts.length === 0" class="text-center py-12">
        <AlertCircle class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground">{{ $t('alerts.no_alerts') }}</p>
      </div>
    </div>

    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('alerts.delete_confirmation_title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('alerts.delete_confirmation_message', { name: selectedAlert?.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="deleteSelectedAlert" class="bg-destructive text-white hover:bg-destructive/80">
            {{ $t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertFormDialog
      v-model:open="showFormDialog"
      :alert="selectedAlert"
      :mode="formMode"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, MoreVertical, Edit, Trash, AlertCircle } from 'lucide-vue-next'
import type { Alert } from '~/types/alert'
import { apiService } from '~/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import AlertFormDialog from '~/components/AlertFormDialog.vue'

const { t } = useI18n()
const { fetchAlerts, deleteAlert } = useAlerts()
const toast = useToast()

const alerts = ref<Alert[]>([])
const showDeleteDialog = ref(false)
const showFormDialog = ref(false)
const selectedAlert = ref<Alert | null>(null)
const formMode = ref<'create' | 'edit'>('create')
const narrativesMap = ref<Map<string, any>>(new Map())
const topicsMap = ref<Map<string, any>>(new Map())

const loadAlerts = async () => {
  try {
    const response = await fetchAlerts()
    alerts.value = response.items
    
    // Load narratives for alerts that have narrative_id
    await loadNarrativesForAlerts()
    
    // Load topics for alerts that have topic_id
    await loadTopicsForAlerts()
  } catch (error) {
    toast.add({
      title: t('common.error'),
      description: t('alerts.fetch_error'),
      color: 'error'
    })
  }
}

const loadNarrativesForAlerts = async () => {
  const narrativeIds = [...new Set(alerts.value
    .filter(a => a.narrative_id)
    .map(a => a.narrative_id!))]
  
  for (const id of narrativeIds) {
    if (!narrativesMap.value.has(id)) {
      try {
        const narrative = await apiService.getNarrative(id)
        narrativesMap.value.set(id, narrative)
      } catch (error) {
        console.error(`Failed to load narrative ${id}:`, error)
      }
    }
  }
}

const loadTopicsForAlerts = async () => {
  const topicIds = [...new Set(alerts.value
    .filter(a => a.topic_id)
    .map(a => a.topic_id!))]
  
  if (topicIds.length > 0) {
    try {
      const response = await apiService.getTopicsWithStats({ limit: 100 })
      response.data.forEach(topic => {
        if (topicIds.includes(topic.id)) {
          topicsMap.value.set(topic.id, topic)
        }
      })
    } catch (error) {
      console.error('Failed to load topics:', error)
    }
  }
}

const openCreateDialog = () => {
  selectedAlert.value = null
  formMode.value = 'create'
  showFormDialog.value = true
}

const openEditDialog = (alert: Alert) => {
  selectedAlert.value = alert
  formMode.value = 'edit'
  showFormDialog.value = true
}

const confirmDelete = (alert: Alert) => {
  selectedAlert.value = alert
  showDeleteDialog.value = true
}

const deleteSelectedAlert = async () => {
  if (!selectedAlert.value) return

  try {
    await deleteAlert(selectedAlert.value.id)
    alerts.value = alerts.value.filter(a => a.id !== selectedAlert.value!.id)
    toast.add({
      title: t('common.success'),
      description: t('alerts.delete_success')
    })
  } catch (error) {
    toast.add({
      title: t('common.error'),
      description: t('alerts.delete_error'),
      color: 'error'
    })
  } finally {
    showDeleteDialog.value = false
    selectedAlert.value = null
  }
}


const handleSave = async (alert: Alert) => {
  if (formMode.value === 'create') {
    alerts.value.unshift(alert)
  } else {
    const index = alerts.value.findIndex(a => a.id === alert.id)
    if (index !== -1) {
      alerts.value[index] = alert
    }
  }
  showFormDialog.value = false
  
  // Load narrative/topic data for the new/updated alert if needed
  if (alert.narrative_id && !narrativesMap.value.has(alert.narrative_id)) {
    try {
      const narrative = await apiService.getNarrative(alert.narrative_id)
      narrativesMap.value.set(alert.narrative_id, narrative)
    } catch (error) {
      console.error(`Failed to load narrative ${alert.narrative_id}:`, error)
    }
  }
  
  if (alert.topic_id && !topicsMap.value.has(alert.topic_id)) {
    await loadTopicsForAlerts()
  }
}

const getTopicName = (topicId: string) => {
  const topic = topicsMap.value.get(topicId)
  return topic ? topic.topic : topicId
}

const getNarrativeName = (narrativeId: string) => {
  const narrative = narrativesMap.value.get(narrativeId)
  return narrative ? (narrative.title || narrative.description || narrativeId) : narrativeId
}

onMounted(() => {
  loadAlerts()
})
</script>