# Video page: open paused at the claim's second

Opening a claim takes you to its video at the moment the claim is said
(`/videos/{id}?t={seconds}`, see `card-links.md`). The YouTube embed carried
`start={seconds}`, so it did play from there, but until someone pressed play YouTube
showed only the cover, with no time bar: nothing said the video would start mid-way.

## Decision

When the page has a `t` and the video is on YouTube, the player opens **already at that
second, paused**, showing that frame and the time bar
(`composables/useYouTubePausedStart.ts`, used by `pages/videos/[id].vue`).

Browsers only let a page start a video on its own when it is muted, so on the player's
`onReady` it:

1. mutes and starts the video (it begins at `start`);
2. on the first "playing" event, pauses, seeks back to the exact second (it played for a
   moment) and unmutes.

Pressing play then plays from the claim's second, with sound.

- Uses YouTube's IFrame Player API (`https://www.youtube.com/iframe_api`, loaded once),
  not raw `postMessage`: its `onReady` avoids the load race noted in the page.
- **Fallbacks:** the embed URL keeps `start`, so if the API doesn't load, the player is
  as before. If the browser blocks even a muted start (`onAutoplayBlocked`) or nothing
  plays within 5 seconds, it pauses and unmutes and is left alone.
- Only the first play is caught: later plays, seeks from the claims list and the
  transcript are untouched.
- Without `t`, or on TikTok/Vimeo, nothing changes. TikTok's embed can't start at a
  given second; Vimeo already takes `#t=`.

Rejected: playing muted on arrival (it is already moving and you miss the claim's start);
a "Starts at 1:23" label (not wanted).
