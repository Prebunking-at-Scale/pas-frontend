<template>
  <TooltipProvider :delay-duration="150">
    <Tooltip>
      <TooltipTrigger as-child>
        <span class="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 cursor-help">
          <component :is="source === 'narrative' ? CircleDot : MessageSquareQuote" class="h-3 w-3 shrink-0" />
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
// a video or narrative through its claims, or a claim through its narrative (entities
// only exist on narratives).
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
