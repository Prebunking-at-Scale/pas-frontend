<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ $t(texts.title) }}</DialogTitle>
        <DialogDescription>
          {{ narrative ? $t('alertRules.addFromNarrative.description') : $t(`alertRules.addFromSearch.description.${prefill.type}`) }}
        </DialogDescription>
      </DialogHeader>

      <!-- The search or the narrative, as the condition it becomes -->
      <div class="rounded-md bg-stone-50 p-3 text-sm">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{{ $t(texts.this) }}</p>
        <p v-if="narrative" class="font-medium text-gray-900">{{ narrative.title }}</p>
        <AlertConditionSummary v-else :type="prefill.type" :filters="prefill.filters" />
        <p v-if="droppedDate" class="mt-1.5 text-xs text-gray-500">{{ $t('alertRules.addFromSearch.dateDropped') }}</p>
      </div>

      <!-- Done -->
      <div v-if="done" role="status" class="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p>{{ done.message }}</p>
          <NuxtLink :to="`/alerts/${done.alertId}`" class="mt-1 inline-flex items-center gap-1 font-medium underline">
            {{ $t('alertRules.addFromSearch.openAlert') }}
          </NuxtLink>
        </div>
      </div>

      <!-- 1. Existing or new -->
      <div v-else-if="step === 'choose'" class="grid gap-2">
        <button
          v-for="option in (['existing', 'new'] as const)"
          :key="option"
          type="button"
          class="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:bg-stone-50 cursor-pointer"
          @click="step = option"
        >
          <component :is="option === 'existing' ? ListPlus : BellPlus" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
          <span>
            <span class="block font-medium text-gray-900">{{ $t(`alertRules.addFromSearch.${option}`) }}</span>
            <span class="block text-sm text-gray-600">
              {{ option === 'existing'
                ? $t(texts.existingHint, { count: compatible.length }, compatible.length)
                : $t(texts.newHint) }}
            </span>
          </span>
        </button>
      </div>

      <!-- 2a. Pick an existing alert -->
      <div v-else-if="step === 'existing'">
        <div v-if="loadingAlerts" class="py-4 text-center">
          <Loader2 class="mx-auto h-5 w-5 animate-spin text-gray-400" />
        </div>
        <div v-else-if="compatible.length === 0" class="space-y-2 text-sm text-gray-600">
          <p>{{ $t('alertRules.addFromSearch.noAlerts') }}</p>
          <Button variant="outline" size="sm" class="cursor-pointer" @click="step = 'new'">
            {{ $t('alertRules.addFromSearch.new') }}
          </Button>
        </div>
        <div v-else role="radiogroup" :aria-label="$t('alertRules.addFromSearch.chooseAlert')" class="max-h-72 space-y-2 overflow-y-auto">
          <label
            v-for="alert in compatible"
            :key="alert.id"
            class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
            :class="selectedId === alert.id ? 'border-emerald-700 bg-emerald-50' : 'border-neutral-200 hover:bg-stone-50'"
          >
            <input v-model="selectedId" type="radio" name="alert" :value="alert.id" class="mt-1 accent-emerald-700">
            <span class="min-w-0">
              <span class="block font-medium text-gray-900">{{ alert.name }}</span>
              <span class="block text-xs text-gray-500">
                {{ $t('alertRules.addFromSearch.caseCount', { count: alert.conditions.length }, alert.conditions.length) }}
                <template v-if="!alert.enabled"> · {{ $t('alertRules.list.disabled') }}</template>
              </span>
            </span>
          </label>
        </div>
      </div>

      <!-- 2b. Name a new alert -->
      <div v-else-if="step === 'new'" class="space-y-2">
        <Label for="new-alert-name">{{ $t('alertRules.fields.name') }}</Label>
        <Input
          id="new-alert-name"
          v-model="newName"
          :placeholder="$t('alertRules.fields.namePlaceholder')"
          @keydown.enter.prevent="confirm"
        />
        <p class="text-xs text-gray-500">
          {{ $t('alertRules.addFromSearch.newDetails') }}
          <NuxtLink :to="{ path: '/alerts/new', query: editorQuery }" class="text-emerald-800 underline">
            {{ $t('alertRules.addFromSearch.fullEditor') }}
          </NuxtLink>
        </p>
      </div>

      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>

      <DialogFooter v-if="!done && step !== 'choose'" class="gap-2">
        <Button variant="outline" class="cursor-pointer" @click="step = 'choose'; error = ''">
          {{ $t('common.back') }}
        </Button>
        <Button
          class="cursor-pointer"
          :disabled="saving || (step === 'existing' && !selectedId) || (step === 'new' && !newName.trim())"
          @click="confirm"
        >
          {{ step === 'existing' ? $t('alertRules.addFromSearch.confirmAdd') : $t('alertRules.create') }}
        </Button>
      </DialogFooter>
      <DialogFooter v-else-if="done">
        <Button class="cursor-pointer" @click="emit('update:open', false)">{{ $t('alertRules.addFromSearch.close') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// "Add to alerts" (docs/alerts.md): a Research search, or a narrative, becomes a
// condition of one of your alerts or of a new one. From Research, a New narrative
// condition (Narratives tab) or a New claim one (Claims tab); from a narrative's page,
// "New claim + belongs to this narrative". Conditions carry their own type, so any alert
// can take one.
import { BellPlus, CheckCircle2, ListPlus, Loader2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import AlertConditionSummary from '~/components/alerts/AlertConditionSummary.vue'
import { alertsService } from '~/services/alerts'
import { conditionFollowing, conditionFromSearch, isSameCondition } from '~/utils/alertRules'
import type { Alert } from '~/utils/alertRules'

interface Props {
  open: boolean
  /** From Research: the tab (narratives or claims)… */
  tab?: string
  /** …and the search's API params (searchApiParams). */
  params?: Record<string, unknown>
  /** From a narrative's page: the narrative to follow. */
  narrative?: { id: string; title: string }
}

const props = withDefaults(defineProps<Props>(), { tab: 'narratives', params: () => ({}), narrative: undefined })
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useI18n()

type Step = 'choose' | 'existing' | 'new'
const step = ref<Step>('choose')
const alerts = ref<Alert[]>([])
const loadingAlerts = ref(false)
const selectedId = ref<string | null>(null)
const newName = ref('')
const saving = ref(false)
const error = ref('')
const done = ref<{ alertId: string; message: string } | null>(null)

const prefill = computed(() => props.narrative
  ? conditionFollowing(props.narrative.id)
  : conditionFromSearch(props.tab, props.params))
const droppedDate = computed(() => !props.narrative && (props.params.date_from !== undefined || props.params.date_to !== undefined))
// The full editor, prefilled the same way
const editorQuery = computed(() => (props.narrative
  ? { narrative: props.narrative.id }
  : { tab: props.tab, ...props.params }) as Record<string, string | string[]>)

// The texts that differ between a search and a narrative
const texts = computed(() => {
  const from = props.narrative ? 'alertRules.addFromNarrative' : 'alertRules.addFromSearch'
  return {
    title: `${from}.title`,
    this: props.narrative ? `${from}.thisNarrative` : `${from}.thisSearch`,
    existingHint: `${from}.existingHint`,
    newHint: `${from}.newHint`,
    alreadyThere: `${from}.alreadyThere`,
  }
})

// Every alert can take the search: the case brings its own type.
const compatible = computed(() => alerts.value)

const reset = () => {
  step.value = 'choose'
  selectedId.value = null
  newName.value = ''
  error.value = ''
  done.value = null
}

watch(() => props.open, async (open) => {
  if (!open) return
  reset()
  loadingAlerts.value = true
  try {
    alerts.value = await alertsService.list()
  } catch (e) {
    console.error('Failed to load alerts:', e)
  } finally {
    loadingAlerts.value = false
  }
})

const addToExisting = async () => {
  const alert = compatible.value.find(a => a.id === selectedId.value)
  if (!alert) return
  if (alert.conditions.some(c => isSameCondition(c, prefill.value))) {
    error.value = t(texts.value.alreadyThere, { name: alert.name })
    return
  }
  const conditions = [...alert.conditions, prefill.value]
  await alertsService.update(alert.id, { name: alert.name, enabled: alert.enabled, conditions })
  done.value = {
    alertId: alert.id,
    message: t('alertRules.addFromSearch.added', { name: alert.name, number: conditions.length }),
  }
}

const createNew = async () => {
  const name = newName.value.trim()
  if (!name) return
  const alert = await alertsService.create({ name, conditions: [prefill.value], enabled: true })
  done.value = { alertId: alert.id, message: t('alertRules.addFromSearch.created', { name }) }
}

const confirm = async () => {
  error.value = ''
  saving.value = true
  try {
    if (step.value === 'existing') await addToExisting()
    else if (step.value === 'new') await createNew()
  } catch (e) {
    console.error('Failed to save alert:', e)
    error.value = t('alertRules.errors.save_failed')
  } finally {
    saving.value = false
  }
}
</script>
