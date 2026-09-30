<template>
  <TooltipProvider :delay-duration="150">
    <Tooltip>
      <TooltipTrigger as-child>
        <!-- Through its claims: a folder tab on the card's top-right corner (the parent
             positions it, and must be relative) -->
        <span
          v-if="source === 'claims'"
          class="absolute right-4 top-0 z-10 inline-flex -translate-y-full items-center gap-1 rounded-t-md border border-b-0 border-neutral-200 bg-white px-2.5 pb-0.5 pt-1 text-xs font-medium text-gray-600 cursor-help"
        >
          <MessageSquareQuote class="h-3 w-3 shrink-0" />
          {{ $t('search.tabs.claims') }}
        </span>
        <span v-else class="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 cursor-help">
          <CircleDot class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ text }}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent class="max-w-xs">
        {{ source === 'narrative' ? $t('search.viaNarrativeHint') : $t('search.containsMatchingClaimsHint') }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
// Why a result matched when it wasn't on its own fields (docs/filters.md, "Labels"):
// a video or narrative through its claims, shown as a "Claims" folder tab on the card's
// corner, or a claim through its narrative (entities only exist on narratives), shown
// as a label above the card.
import { CircleDot, MessageSquareQuote } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import type { EntityRef } from '~/services/search'

interface Props {
  source?: 'claims' | 'narrative'
  /** For "narrative": the searched entities the narrative has. */
  entities?: EntityRef[]
}

const props = withDefaults(defineProps<Props>(), { source: 'claims', entities: () => [] })

const { t } = useI18n()

const text = computed(() => {
  if (props.source === 'claims') return t('search.containsMatchingClaims')
  const names = props.entities.map(entity => entity.name)
  return names.length > 0
    ? t('search.viaNarrative', { list: names.join(', ') })
    : t('search.viaNarrativeShort')
})
</script>
