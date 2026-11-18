<template>
  <!-- Stretched over the card (which must be relative): a real link, so the browser
       offers "Open in new tab", and middle or Ctrl/Cmd-click open one -->
  <a
    :href="href"
    :aria-label="label"
    class="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
    @click="onClick"
  />
</template>

<script setup lang="ts">
// A card's link (docs/card-links.md). A plain click is left to the card's own click
// handler, which some lists use to remember their page and filters before leaving; a
// click meant for a new tab or window is left to the browser.
interface Props {
  to: string
  label: string
}

const props = defineProps<Props>()

const router = useRouter()
const href = computed(() => router.resolve(props.to).href)

const onClick = (event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
    event.stopPropagation()
    return
  }
  event.preventDefault()
}
</script>
