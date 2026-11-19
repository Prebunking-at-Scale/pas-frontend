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

Every card opens its page **in a new tab** (`target="_blank"`, `rel="noopener"`), so the
list you came from stays where it was, with its page and filters.

- **Plain click, middle click, Ctrl/Cmd-click:** new tab (the browser decides whether it
  is focused or opened in the background, as for any link).
- **Shift-click:** new window. **Right-click:** the browser's link menu.
- The link stops the click, so the card's own click handler (and the pages listening to
  it) doesn't also navigate the current tab.
- The link's accessible name adds "opens in a new tab" (`common.opensInNewTab`, in all
  four languages), so screen readers announce it.

History: the first version (PR #68) kept a plain click in the same tab and only gave the
browser modified clicks; the user asked for a new tab on a plain click too.

Controls inside a card (topic chips, the video line, the narrative line, action buttons,
the rating, the video player) sit above the link (`relative z-10`) so they keep working
on their own.
