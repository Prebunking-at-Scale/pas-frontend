// Opens a YouTube embed already at a given second, paused, instead of on its cover
// (docs/video-start-paused.md). Browsers only let a page start a video on its own when
// it is muted: so it starts muted, pauses as soon as it plays, goes back to the exact
// second and unmutes. Pressing play then plays from there, with sound.
//
// The embed URL keeps its `start` parameter, so if any of this fails (the API doesn't
// load, the browser blocks even muted playback) the player behaves as before: on its
// cover, starting from that second when played.

import type { Ref } from 'vue'

// The parts of YouTube's IFrame Player API used here.
interface YTPlayer {
  mute(): void
  unMute(): void
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
}

interface YTNamespace {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady?: () => void
        onStateChange?: (event: { data: number }) => void
        onAutoplayBlocked?: () => void
      }
    },
  ) => YTPlayer
  PlayerState: { PLAYING: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_URL = 'https://www.youtube.com/iframe_api'

// How long to wait for the muted start before giving up and leaving the player as is.
export const START_TIMEOUT_MS = 5000

let apiPromise: Promise<YTNamespace> | null = null

// Loads YouTube's API script once per page load.
export const loadYouTubeApi = (): Promise<YTNamespace> => {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = API_URL
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube IFrame API failed to load'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

// Attaches to the iframe in `iframe` whenever `startSeconds` is set (the embed URL
// must carry enablejsapi=1 and start=<startSeconds>).
export const useYouTubePausedStart = (
  iframe: Ref<HTMLIFrameElement | null>,
  startSeconds: Ref<number | null>,
) => {
  let attachedTo: HTMLIFrameElement | null = null

  const attach = async (element: HTMLIFrameElement, seconds: number) => {
    attachedTo = element
    let YT: YTNamespace
    try {
      YT = await loadYouTubeApi()
    } catch {
      return
    }
    if (attachedTo !== element) return

    let done = false
    let timeout: ReturnType<typeof setTimeout> | undefined
    // Leaves the player as it is, with sound: muted playback was blocked or too slow.
    const giveUp = () => {
      if (done) return
      done = true
      clearTimeout(timeout)
      // In case the muted start comes through late: never let it play on its own.
      player.pauseVideo()
      player.unMute()
    }

    const player: YTPlayer = new YT.Player(element, {
      events: {
        onReady: () => {
          player.mute()
          player.playVideo()
          timeout = setTimeout(giveUp, START_TIMEOUT_MS)
        },
        onStateChange: (event) => {
          if (done || event.data !== YT.PlayerState.PLAYING) return
          done = true
          clearTimeout(timeout)
          player.pauseVideo()
          // It played for a moment: go back to the claim's second.
          player.seekTo(seconds, true)
          player.unMute()
        },
        onAutoplayBlocked: giveUp,
      },
    })
  }

  watch(
    [iframe, startSeconds],
    ([element, seconds]) => {
      if (!element || !seconds || element === attachedTo) return
      attach(element, seconds)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => {
    attachedTo = null
  })
}
