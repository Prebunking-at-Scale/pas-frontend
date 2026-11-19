import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'

// Nuxt auto-imports aren't resolved in unit tests: give the composable what it uses,
// before it is imported.
vi.hoisted(async () => {
  const vue = await import('vue')
  Object.assign(globalThis, { watch: vue.watch, onBeforeUnmount: vue.onBeforeUnmount })
})

import { useYouTubePausedStart, START_TIMEOUT_MS } from '~/composables/useYouTubePausedStart'

const PLAYING = 1

// A stand-in for YouTube's player that records what the page asks of it.
class FakePlayer {
  static last: FakePlayer
  calls: string[] = []
  events: Record<string, (event?: any) => void>
  constructor(public element: HTMLIFrameElement, options: { events: Record<string, (event?: any) => void> }) {
    this.events = options.events
    FakePlayer.last = this
  }
  mute() { this.calls.push('mute') }
  unMute() { this.calls.push('unMute') }
  playVideo() { this.calls.push('playVideo') }
  pauseVideo() { this.calls.push('pauseVideo') }
  seekTo(seconds: number) { this.calls.push(`seekTo(${seconds})`) }
}

let wrapper: VueWrapper | undefined

const mountPlayer = async (startSeconds: number | null) => {
  const Page = defineComponent({
    setup() {
      const iframe = ref<HTMLIFrameElement | null>(null)
      useYouTubePausedStart(iframe, ref(startSeconds))
      return () => h('iframe', { ref: iframe })
    },
  })
  wrapper = mount(Page)
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.useFakeTimers()
  window.YT = { Player: FakePlayer as any, PlayerState: { PLAYING } }
})

afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  delete window.YT
})

describe('useYouTubePausedStart', () => {
  it('starts muted, then pauses at the claim’s second and unmutes as soon as it plays', async () => {
    await mountPlayer(83)
    const player = FakePlayer.last
    player.events.onReady()
    expect(player.calls).toEqual(['mute', 'playVideo'])

    player.events.onStateChange({ data: PLAYING })
    expect(player.calls).toEqual(['mute', 'playVideo', 'pauseVideo', 'seekTo(83)', 'unMute'])
  })

  it('leaves later plays alone: pressing play plays', async () => {
    await mountPlayer(83)
    const player = FakePlayer.last
    player.events.onReady()
    player.events.onStateChange({ data: PLAYING })
    player.calls = []

    player.events.onStateChange({ data: PLAYING })
    expect(player.calls).toEqual([])
  })

  it('gives up with sound when the browser blocks even a muted start', async () => {
    await mountPlayer(83)
    const player = FakePlayer.last
    player.events.onReady()
    player.events.onAutoplayBlocked()
    expect(player.calls.slice(2)).toEqual(['pauseVideo', 'unMute'])

    // The person then presses play: it must not be paused.
    player.calls = []
    player.events.onStateChange({ data: PLAYING })
    expect(player.calls).toEqual([])
  })

  it('gives up with sound when the muted start takes too long', async () => {
    await mountPlayer(83)
    const player = FakePlayer.last
    player.events.onReady()
    vi.advanceTimersByTime(START_TIMEOUT_MS)
    expect(player.calls.slice(2)).toEqual(['pauseVideo', 'unMute'])
  })

  it('does nothing without a start second', async () => {
    FakePlayer.last = undefined as any
    await mountPlayer(null)
    expect(FakePlayer.last).toBeUndefined()
  })
})
