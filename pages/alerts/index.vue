<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p class="max-w-2xl text-sm text-gray-600">{{ $t('alertRules.intro') }}</p>
      <div class="flex gap-2">
        <Button variant="outline" class="cursor-pointer" :disabled="alerts.length === 0" @click="showDigest = true">
          <Mail class="h-4 w-4" />
          {{ $t('alertRules.previewDigest') }}
        </Button>
        <NuxtLink to="/alerts/new" :class="buttonVariants()">
          <Plus class="h-4 w-4" />
          {{ $t('alertRules.newAlert') }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="py-8 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
    </div>

    <p v-else-if="failed" class="py-12 text-center text-red-700">{{ $t('alertRules.loadFailed') }}</p>

    <p v-else-if="alerts.length === 0" class="py-12 text-center text-gray-500">{{ $t('alertRules.noAlerts') }}</p>

    <div v-else class="space-y-3">
      <div
        v-for="(alert, index) in alerts"
        :key="alert.id"
        class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
        :class="{ 'opacity-60': !alert.enabled }"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-2">
            <!-- The order here is the order of the e-mail -->
            <div class="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 cursor-pointer"
                :disabled="index === 0"
                :aria-label="$t('alertRules.list.moveUp')"
                @click="move(index, -1)"
              >
                <ChevronUp class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 cursor-pointer"
                :disabled="index === alerts.length - 1"
                :aria-label="$t('alertRules.list.moveDown')"
                @click="move(index, 1)"
              >
                <ChevronDown class="h-4 w-4" />
              </Button>
            </div>
            <NuxtLink :to="`/alerts/${alert.id}`" class="min-w-0">
              <h2 class="text-lg font-semibold text-gray-900 hover:underline">{{ alert.name }}</h2>
            </NuxtLink>
          </div>

          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm text-gray-600">
              <Switch :model-value="alert.enabled" @update:model-value="toggle(alert, $event)" />
              {{ alert.enabled ? $t('alertRules.list.enabled') : $t('alertRules.list.disabled') }}
            </label>
            <NuxtLink
              :to="`/alerts/${alert.id}`"
              :class="buttonVariants({ variant: 'ghost', size: 'icon' })"
              :aria-label="$t('alertRules.editAlert')"
            >
              <Pencil class="h-4 w-4" />
            </NuxtLink>
            <Button
              variant="ghost"
              size="icon"
              class="cursor-pointer hover:text-red-700"
              :aria-label="$t('alertRules.list.delete')"
              @click="toDelete = alert"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Conditions, combined with OR -->
        <div class="mt-3 space-y-1.5">
          <template v-for="(c, i) in alert.conditions" :key="c.id">
            <p v-if="i > 0" class="text-xs font-semibold uppercase text-gray-400">{{ $t('alertRules.or') }}</p>
            <div class="flex flex-wrap items-center gap-2 rounded-md bg-stone-50 p-1.5">
              <AlertTypeBadge :type="c.type" />
              <span v-if="c.narrative_id" class="text-sm text-gray-700">
                {{ $t('alertRules.list.belongsTo', { title: titles[c.narrative_id] ?? '…' }) }}
              </span>
              <AlertConditionSummary :type="c.type" :filters="c.filters" />
            </div>
          </template>
        </div>

        <p class="mt-3 text-xs text-gray-500">
          {{ alert.last_match_at
            ? $t('alertRules.list.lastMatch', { date: formatDate(alert.last_match_at, locale) })
            : $t('alertRules.list.neverMatched') }}
        </p>
      </div>
    </div>

    <DigestPreviewDialog v-model:open="showDigest" :alerts="alerts" />

    <AlertDialog :open="toDelete !== null" @update:open="(open) => { if (!open) toDelete = null }">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('alertRules.list.deleteTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('alertRules.list.deleteMessage', { name: toDelete?.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/80" @click="remove">
            {{ $t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
// Your alerts (docs/alerts.md): each with its conditions, combined with OR, in the
// order they come in the daily e-mail. Only yours: nobody else sees them.
import { ChevronDown, ChevronUp, Mail, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { Button, buttonVariants } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import AlertTypeBadge from '~/components/alerts/AlertTypeBadge.vue'
import AlertConditionSummary from '~/components/alerts/AlertConditionSummary.vue'
import DigestPreviewDialog from '~/components/alerts/DigestPreviewDialog.vue'
import { alertsService } from '~/services/alerts'
import { apiService } from '~/services/api'
import { formatDate } from '~/utils/date'
import type { Alert } from '~/utils/alertRules'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const { setPageHeader, clearPageHeader } = usePageHeader()
const { load: loadOptions, resolveEntities } = useSearchFilterOptions()

const alerts = ref<Alert[]>([])
const loading = ref(true)
const failed = ref(false)
const showDigest = ref(false)
const toDelete = ref<Alert | null>(null)

// Titles of the narratives conditions follow, shared with the narrative picker
const titles = useState<Record<string, string>>('alerts:narrativeTitles', () => ({}))
const loadTitles = async () => {
  const ids = [...new Set(alerts.value.flatMap(a => a.conditions.map(c => c.narrative_id)).filter(Boolean))] as string[]
  await Promise.allSettled(ids.filter(id => !titles.value[id]).map(async (id) => {
    try {
      titles.value = { ...titles.value, [id]: (await apiService.getNarrative(id)).title }
    } catch {
      titles.value = { ...titles.value, [id]: id }
    }
  }))
}

const load = async () => {
  try {
    alerts.value = await alertsService.list()
    resolveEntities(alerts.value.flatMap(a => a.conditions.flatMap(c => c.filters.entity_id ?? [])))
    loadTitles()
  } catch (error) {
    console.error('Failed to load alerts:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

const toggle = async (alert: Alert, enabled: boolean) => {
  try {
    Object.assign(alert, await alertsService.update(alert.id, { ...alert, enabled }))
  } catch (error) {
    console.error('Failed to update alert:', error)
  }
}

const move = async (index: number, by: -1 | 1) => {
  const order = [...alerts.value]
  const [moved] = order.splice(index, 1)
  order.splice(index + by, 0, moved!)
  alerts.value = order
  try {
    alerts.value = await alertsService.reorder(order.map(a => a.id))
  } catch (error) {
    console.error('Failed to reorder alerts:', error)
  }
}

const remove = async () => {
  if (!toDelete.value) return
  const id = toDelete.value.id
  try {
    await alertsService.remove(id)
    alerts.value = alerts.value.filter(a => a.id !== id)
  } catch (error) {
    console.error('Failed to delete alert:', error)
  } finally {
    toDelete.value = null
  }
}

onMounted(() => {
  setPageHeader({ title: t('alertRules.title') })
  loadOptions()
  load()
})

onBeforeUnmount(() => {
  clearPageHeader()
})
</script>
