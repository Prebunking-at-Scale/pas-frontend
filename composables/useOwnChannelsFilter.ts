import type { Ref } from 'vue'

// The "Ours / All" switch of the channel filter: "Ours" puts the organisation's own
// channels into the filter, "All" takes those back out and leaves the rest (docs/filters.md).
export const useOwnChannelsFilter = (
  selected: () => string[],
  select: (channels: string[]) => void,
  ownChannels: Ref<string[]>,
) => {
  // What the switch added, so turning it off removes exactly that.
  const added = ref<string[]>([])
  const onlyOwn = computed(() => added.value.length > 0
    && ownChannels.value.every(channel => selected().includes(channel)))

  const setOnlyOwn = (value: boolean) => {
    if (value) {
      const missing = ownChannels.value.filter(channel => !selected().includes(channel))
      added.value = missing
      select([...selected(), ...missing])
    } else {
      select(selected().filter(channel => !added.value.includes(channel)))
      added.value = []
    }
  }

  // The switch itself, as FilterToggle wants it
  const { t } = useI18n()
  const scopeOptions = computed(() => [
    { value: 'own', label: t('filters.channelScope.own') },
    { value: 'all', label: t('filters.channelScope.all') },
  ])

  return { onlyOwn, setOnlyOwn, scopeOptions }
}
