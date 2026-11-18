<template>
  <!-- Stretched over the card (which must be relative): a real link that opens the
       card's page in a new tab -->
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    :aria-label="`${label} (${t('common.opensInNewTab')})`"
    class="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
    @click.stop
  />
</template>

<script setup lang="ts">
// A card's link (docs/card-links.md). Every click is left to the browser, which opens
// the page in a new tab; the click stops here so the card's own handler doesn't also
// navigate the current tab.
interface Props {
  to: string
  label: string
}

const props = defineProps<Props>()

const { t } = useI18n()
const router = useRouter()
const href = computed(() => router.resolve(props.to).href)
</script>
