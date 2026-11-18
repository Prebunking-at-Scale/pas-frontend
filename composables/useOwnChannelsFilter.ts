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
  // On whenever every own channel is selected, however they got there (the switch, a
  // link, a saved selection, one by one).
  const onlyOwn = computed(() => ownChannels.value.length > 0
    && ownChannels.value.every(channel => selected().includes(channel)))

  const setOnlyOwn = (value: boolean) => {
    if (value === onlyOwn.value) return
    if (value) {
      const missing = ownChannels.value.filter(channel => !selected().includes(channel))
      added.value = missing
      select([...selected(), ...missing])
    } else {
      // Nothing recorded (they were already there): take all the own channels out.
      const remove = added.value.length > 0 ? added.value : ownChannels.value
      select(selected().filter(channel => !remove.includes(channel)))
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
