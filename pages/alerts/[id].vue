<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <NuxtLink to="/alerts" class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft class="h-4 w-4" />
        {{ $t('alertRules.backToList') }}
      </NuxtLink>
      <p v-if="prefilled" class="text-sm text-emerald-800">{{ $t(prefilled) }}</p>
    </div>

    <div v-if="loading" class="py-8 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <!-- 1. The alert's name, first and most visible; it goes to its creator only -->
      <section class="rounded-lg border-2 border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
        <div class="space-y-2">
          <Label for="alert-name" class="text-base font-semibold text-gray-900">{{ $t('alertRules.fields.name') }}</Label>
          <Input
            id="alert-name"
            v-model="form.name"
            class="h-12 bg-white text-lg font-semibold md:text-lg"
            :placeholder="$t('alertRules.fields.namePlaceholder')"
          />
        </div>
        <p class="mt-3 flex items-center gap-1.5 text-sm text-gray-700">
          <Mail class="h-4 w-4 shrink-0 text-gray-500" />
          {{ $t('alertRules.fields.deliveryHint') }}
        </p>
        <label class="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <Switch v-model="form.enabled" />
          {{ $t('alertRules.fields.enabled') }}
        </label>
      </section>

      <!-- 2. Conditions, each with what it watches -->
      <section class="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 class="mb-1 font-semibold text-gray-900">{{ $t('alertRules.steps.cases') }}</h2>
        <p class="mb-4 text-sm text-gray-600">{{ $t('alertRules.steps.casesIntro') }}</p>

        <div class="space-y-2">
          <template v-for="(c, index) in form.conditions" :key="c.key">
            <div v-if="index > 0" class="flex items-center gap-3 py-1" aria-hidden="true">
              <span class="h-px flex-1 bg-neutral-200" />
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ $t('alertRules.or') }}</span>
              <span class="h-px flex-1 bg-neutral-200" />
            </div>
            <AlertConditionEditor
              v-model="c.filters"
              v-model:narrative-id="c.narrative_id"
              :type="c.type"
              :number="index + 1"
              :removable="form.conditions.length > 1"
              @update:type="changeType(c, $event)"
              @remove="form.conditions.splice(index, 1)"
            />
          </template>
        </div>

        <Button type="button" variant="outline" class="mt-3 cursor-pointer" @click="addCondition">
          <Plus class="h-4 w-4" />
          {{ $t('alertRules.addCase') }}
        </Button>
      </section>

      <div v-if="errors.length > 0" role="alert" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <ul class="list-disc pl-5">
          <li v-for="error in errors" :key="error">{{ $t(`alertRules.errors.${error}`) }}</li>
        </ul>
      </div>

      <div class="flex justify-end gap-2">
        <NuxtLink to="/alerts" :class="buttonVariants({ variant: 'outline' })">
          {{ $t('common.cancel') }}
        </NuxtLink>
        <Button type="submit" class="cursor-pointer" :disabled="saving">
          {{ isNew ? $t('alertRules.create') : $t('alertRules.save') }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// Create or edit one of your alerts (docs/alerts.md): its name first, then its
// conditions, each with what it watches and its filters. "/alerts/new" creates one,
// prefilled from a Research search ("?tab=…&topic_id=…", from "Add to alerts") or from
// a narrative ("?narrative=…", from a narrative's "Create alert").
import { ArrowLeft, Plus, Mail } from 'lucide-vue-next'
import { Button, buttonVariants } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import AlertConditionEditor from '~/components/alerts/AlertConditionEditor.vue'
import { alertErrorsOf, alertsService } from '~/services/alerts'
import { conditionFollowing, conditionFromSearch, sanitizeCondition, validateAlert } from '~/utils/alertRules'
import type { AlertCondition, AlertError, AlertInput, ConditionType } from '~/utils/alertRules'

definePageMeta({ middleware: 'auth' })

type EditedCondition = Omit<AlertCondition, 'id'> & { key: number }

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { setPageHeader, clearPageHeader } = usePageHeader()
const { load: loadOptions } = useSearchFilterOptions()

const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')

let seq = 0
const edited = (c: Omit<AlertCondition, 'id'>): EditedCondition => ({ ...c, key: ++seq })
const blank = (): Omit<AlertCondition, 'id'> => ({ type: 'new_narrative', narrative_id: null, filters: {} })

const form = ref<{ name: string; enabled: boolean; conditions: EditedCondition[] }>({
  name: '',
  enabled: true,
  conditions: [edited(blank())],
})
const loading = ref(!isNew.value)
const saving = ref(false)
const errors = ref<AlertError[]>([])

// Prefilled when created from a search or from a narrative
const prefilled = computed(() => {
  if (!isNew.value) return null
  if (typeof route.query.narrative === 'string') return 'alertRules.fromNarrativeNotice'
  if (typeof route.query.tab === 'string') return 'alertRules.fromSearchNotice'
  return null
})
if (isNew.value && typeof route.query.narrative === 'string') {
  form.value.conditions = [edited(conditionFollowing(route.query.narrative))]
} else if (isNew.value && typeof route.query.tab === 'string') {
  form.value.conditions = [edited(conditionFromSearch(route.query.tab, route.query))]
}

// Switching a condition's type keeps the filters it can still use and drops the rest;
// the narrative only belongs to a condition that follows one.
const changeType = (c: EditedCondition, type: ConditionType) => {
  Object.assign(c, sanitizeCondition({ ...c, type }))
}

// A new condition starts like the last one (type and narrative), without filters.
const addCondition = () => {
  const last = form.value.conditions.at(-1)
  form.value.conditions.push(edited({ type: last?.type ?? 'new_narrative', narrative_id: last?.narrative_id ?? null, filters: {} }))
}

const save = async () => {
  const input: AlertInput = {
    name: form.value.name.trim(),
    enabled: form.value.enabled,
    conditions: form.value.conditions.map(({ type, narrative_id, filters }) => sanitizeCondition({ type, narrative_id, filters })),
  }
  errors.value = validateAlert(input)
  if (errors.value.length > 0) return

  saving.value = true
  try {
    if (isNew.value) await alertsService.create(input)
    else await alertsService.update(id.value, input)
    router.push('/alerts')
  } catch (error) {
    console.error('Failed to save alert:', error)
    errors.value = alertErrorsOf(error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  setPageHeader({ title: isNew.value ? t('alertRules.newAlert') : t('alertRules.editAlert') })
  loadOptions()
  if (isNew.value) return
  try {
    const alert = await alertsService.get(id.value)
    form.value = {
      name: alert.name,
      enabled: alert.enabled,
      conditions: alert.conditions.map(({ type, narrative_id, filters }) => edited({ type, narrative_id, filters })),
    }
  } catch (error) {
    console.error('Failed to load alert:', error)
    router.replace('/alerts')
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearPageHeader()
})
</script>
