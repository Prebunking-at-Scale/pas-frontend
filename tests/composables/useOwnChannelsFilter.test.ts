/**
 * The "Ours / All" switch of Research's channel filter: it reflects whether every own
 * channel is selected, and turning it off removes what turning it on added.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { computed, ref } from 'vue'

beforeAll(() => {
  // Nuxt auto-imports the composable uses
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
})

const setup = async (initial: string[]) => {
  const { useOwnChannelsFilter } = await import('~/composables/useOwnChannelsFilter')
  const selected = ref<string[]>(initial)
  const own = ref(['@a', '@b'])
  const filter = useOwnChannelsFilter(() => selected.value, (c) => { selected.value = c }, own)
  return { selected, ...filter }
}

describe('useOwnChannelsFilter', () => {
  it('turns on by adding the own channels, and off by removing just those', async () => {
    const { selected, onlyOwn, setOnlyOwn } = await setup(['@x', '@a'])
    setOnlyOwn(true)
    expect(onlyOwn.value).toBe(true)
    expect(selected.value).toEqual(['@x', '@a', '@b'])
    setOnlyOwn(false)
    expect(onlyOwn.value).toBe(false)
    expect(selected.value).toEqual(['@x', '@a'])
  })

  it('stays on when Ours is chosen again', async () => {
    const { selected, onlyOwn, setOnlyOwn } = await setup([])
    setOnlyOwn(true)
    setOnlyOwn(true)
    expect(onlyOwn.value).toBe(true)
    expect(selected.value).toEqual(['@a', '@b'])
  })

  it('is on when the own channels were already selected, and All takes them out', async () => {
    const { selected, onlyOwn, setOnlyOwn } = await setup(['@b', '@a', '@x'])
    expect(onlyOwn.value).toBe(true)
    setOnlyOwn(false)
    expect(selected.value).toEqual(['@x'])
  })
})
