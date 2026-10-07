<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ $t('alertRules.digest.title') }}</DialogTitle>
        <DialogDescription>{{ $t('alertRules.digest.intro') }}</DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="py-8 text-center">
        <Loader2 class="mx-auto h-6 w-6 animate-spin text-gray-400" />
      </div>

      <p v-else-if="entries.length === 0" class="py-6 text-center text-sm text-gray-500">
        {{ $t('alertRules.digest.empty') }}
      </p>

      <!-- The email -->
      <div v-else class="rounded-lg border border-neutral-200 bg-white text-sm">
        <div class="space-y-0.5 border-b border-neutral-200 bg-stone-50 px-4 py-3 text-xs text-gray-600 rounded-t-lg">
          <p><span class="font-semibold">{{ $t('alertRules.digest.from') }}</span> Prebunking at Scale &lt;alerts@…&gt;</p>
          <p>
            <span class="font-semibold">{{ $t('alertRules.digest.subject') }}</span>
            {{ $t('alertRules.digest.subjectLine', { count: entries.length }, entries.length) }}
          </p>
        </div>

        <div class="space-y-8 px-4 py-5">
          <!-- One block per triggered alert, in the order of the alerts panel -->
          <section v-for="entry in entries" :key="entry.alert_id">
            <h3 class="border-b-2 border-emerald-700 pb-1 text-lg font-bold text-gray-900">
              {{ $t('alertRules.digest.alertTriggered', { name: entry.alert_name }) }}
            </h3>

            <!-- 1. New narratives -->
            <div v-if="entry.narratives.total > 0" class="mt-3">
              <h4 class="font-semibold text-gray-800">{{ $t('alertRules.digest.sections.narratives') }}</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="item in entry.narratives.items" :key="item.id" class="leading-snug">
                  • <NuxtLink v-if="item.link" :to="item.link" target="_blank" class="underline decoration-gray-400 hover:decoration-gray-900"><strong class="text-gray-900">{{ item.title }}</strong></NuxtLink><strong v-else class="text-gray-900">{{ item.title }}</strong>
                  <span class="text-gray-500"> ({{ conditionsText(entry, item.conditions) }})</span>
                </li>
              </ul>
              <SeeAll :entry="entry" :shown="entry.narratives.items.length" :total="entry.narratives.total" />
            </div>

            <!-- 2. New claims in each selected narrative -->
            <div v-if="entry.in_narratives.length > 0" class="mt-3">
              <h4 class="font-semibold text-gray-800">{{ $t('alertRules.digest.sections.inNarratives') }}</h4>
              <div v-for="group in entry.in_narratives" :key="group.narrative_id" class="mt-1">
                <p class="text-gray-700">{{ $t('alertRules.digest.inNarrative', { title: group.narrative_title }) }}</p>
                <ul class="mt-0.5 space-y-1 pl-3">
                  <li v-for="item in group.items" :key="item.id" class="leading-snug">
                    • <NuxtLink v-if="item.link" :to="item.link" target="_blank" class="underline decoration-gray-400 hover:decoration-gray-900"><strong class="text-gray-900">{{ item.title }}</strong></NuxtLink><strong v-else class="text-gray-900">{{ item.title }}</strong>
                    <span class="text-gray-500"> ({{ conditionsText(entry, item.conditions) }})</span>
                  </li>
                </ul>
                <SeeAll :entry="entry" :shown="group.items.length" :total="group.total" />
              </div>
            </div>

            <!-- 3. Other new claims -->
            <div v-if="entry.claims.total > 0" class="mt-3">
              <h4 class="font-semibold text-gray-800">{{ $t('alertRules.digest.sections.claims') }}</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="item in entry.claims.items" :key="item.id" class="leading-snug">
                  • <NuxtLink v-if="item.link" :to="item.link" target="_blank" class="underline decoration-gray-400 hover:decoration-gray-900"><strong class="text-gray-900">{{ item.title }}</strong></NuxtLink><strong v-else class="text-gray-900">{{ item.title }}</strong>
                  <span class="text-gray-500"> ({{ conditionsText(entry, item.conditions) }})</span>
                </li>
              </ul>
              <SeeAll :entry="entry" :shown="entry.claims.items.length" :total="entry.claims.total" />
            </div>
          </section>
        </div>

        <p class="border-t border-neutral-200 px-4 py-3 text-xs text-gray-500">
          {{ $t('alertRules.digest.footer') }}
        </p>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
// Your next alerts e-mail (docs/alerts.md, "Daily digest"), with what your alerts have
// matched so far since they last reported: core-api's GET /api/alerts/digest-preview.
import { Loader2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '~/components/ui/dialog'
import { alertsService } from '~/services/alerts'
import type { PropType } from 'vue'
import type { Alert, DigestEntry } from '~/utils/alertRules'

const props = defineProps<{ open: boolean; alerts: Alert[] }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const entries = ref<DigestEntry[]>([])
const loading = ref(false)

const { t } = useI18n()
const summarize = useConditionSummary()

/** The conditions an element matched, as filter summaries joined by "or". */
const conditionsText = (entry: DigestEntry, numbers: number[]) => {
  const alert = props.alerts.find(a => a.id === entry.alert_id)
  return numbers
    .map((n) => {
      const condition = alert?.conditions[n - 1]
      if (!condition) return t('alertRules.digest.condition', { number: n })
      const parts = summarize(condition.type, condition.filters)
      return parts.length > 0 ? parts.join(' · ') : t('alertRules.digest.anyNewClaim')
    })
    .join(` ${t('alertRules.or')} `)
}

/** "See all (N)", to the alert's page, when a section has more than it shows. */
const SeeAll = defineComponent({
  props: { entry: { type: Object as PropType<DigestEntry>, required: true }, shown: Number, total: Number },
  setup: p => () => (p.total ?? 0) > (p.shown ?? 0)
    ? h(resolveComponent('NuxtLink'), {
        to: `/alerts/${p.entry.alert_id}`,
        class: 'mt-1 inline-block text-sm font-medium text-emerald-800 underline',
      }, () => t('alertRules.digest.seeAllCount', { count: p.total }))
    : null,
})

watch(() => props.open, async (open) => {
  if (!open) return
  loading.value = true
  try {
    entries.value = await alertsService.digestPreview()
  } catch (error) {
    console.error('Failed to load digest preview:', error)
    entries.value = []
  } finally {
    loading.value = false
  }
})
</script>
