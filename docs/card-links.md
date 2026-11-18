# Card links: open in a new tab

Narrative and claim cards used to navigate with a click handler only, so the browser
saw no link: right-click had no "Open link in new tab", and Ctrl/Cmd-click or a middle
click did nothing.

## Decision

Each card carries a real link, `components/CardLink.vue`: an `<a href>` stretched over
the whole card (the card is `relative`, the link `absolute inset-0`).

- **Narrative card:** `/narratives/{id}`.
- **Claim card:** the claim's video at the moment it is said, `/videos/{id}?t={seconds}`
  (no `t` when the claim has no start time). No link when the claim has no video.
- **Video card:** `/videos/{id}`. Its embedded YouTube player sits above the link, so it
  still plays in place.

## How clicks behave

- **Plain click:** unchanged. The link cancels its own navigation and the card's click
  handler runs as before, so lists that remember their page and filters before leaving
  (narratives, claims) keep doing so.
- **Ctrl/Cmd, Shift or Alt-click:** left to the browser (new tab or window); the card's
  handler doesn't run.
- **Middle click and right-click → Open in new tab:** handled by the browser, from the
  link's `href`.

Controls inside a card (topic chips, the video line, the narrative line, action buttons,
the rating, the video player) sit above the link (`relative z-10`) so they keep working
on their own.
