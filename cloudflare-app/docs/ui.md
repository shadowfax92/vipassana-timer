# Practice UI

The setup follows [Paper V5](https://app.paper.design/file/01M3JQHDG1JNYNF57JA5MYQ3K4/p-4-1). The small Buddha image is a transparent 42×48 export of the approved Paper node (3.6 KB); outline icons use the same Tabler paths.

## Boundaries

- `lib/sessionPlan.ts` adapts the selected total into the existing player's silent timer duration. The phase registry still owns the recording order, sources and fades. Guided sessions retain their complete recording.
- `audioCatalog.ts` records measured durations and source hashes. After changing a recording, run `npm run audio:metadata` (requires ffprobe); tests reject stale hashes.
- `lib/preferences.ts` validates one versioned, one-year browser cookie for committed setup choices, theme and the start-reminder preference. Audio-sheet drafts are saved only by Done. The reminder choice is saved only by Start session in the popup. Clearing cookies restores the reminder.
- `components/Dialog.tsx` owns modal keyboard traversal, trigger focus restoration and scroll locking. Native dialog supplies background inertness.
- The session engine, phase implementations, background audio, worker timer and wake-lock code are unchanged. A selected 60-minute Custom sitting budgets recordings plus silent practice to 60 minutes. Playback buffering and manual Skip retain their existing behavior, so the finish-time preview is an estimate rather than a new wall-clock deadline.

## Verification

Run `npm ci`, `npm run build`, `npm run lint`, and `npm test`. For browser checks, run `npx playwright install chromium webkit` then `npm run test:e2e`.

Browser checks cover the setup, ETA, dialogs, cookie persistence, themes and responsive layout. They start real recordings and exercise the existing Skip/Stop controls after playback begins. They do not establish mobile lock-screen/background playback reliability or validate an hour-long sitting.
