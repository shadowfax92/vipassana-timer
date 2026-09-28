# Practice UI

The setup follows [Paper V5](https://app.paper.design/file/01M3JQHDG1JNYNF57JA5MYQ3K4/p-4-1). The small Buddha image is a transparent 42×48 export of the approved Paper node (3.6 KB); outline icons use the same Tabler paths.

## Boundaries

- `lib/sessionPlan.ts` adapts the selected total into the existing player's silent timer duration. The phase registry still owns the recording order, sources and fades. Guided sessions retain their complete recording.
- `audioCatalog.ts` records measured durations and source hashes. After changing a recording, run `npm run audio:metadata` (requires ffprobe); tests reject stale hashes.
- `lib/preferences.ts` validates one versioned, one-year browser cookie for committed setup choices, theme and the start-reminder preference. Audio-sheet drafts are saved only by Done. The reminder choice is saved only by Start session in the popup. Clearing cookies restores the reminder.
- `components/Dialog.tsx` owns modal keyboard traversal, trigger focus restoration and scroll locking. Native dialog supplies background inertness.
- The session engine, phase implementations, background audio, worker timer and wake-lock code are unchanged. A selected 60-minute Custom sitting budgets recordings plus silent practice to 60 minutes. Playback buffering and manual Skip retain their existing behavior, so the finish-time preview is an estimate rather than a new wall-clock deadline.

## Responsive layout

The phone artboard is a visual reference, not a fixed app width. `App.css` owns three layouts using the same controls: a compact single column below 640px, a wider content-height column on tablets, and settings beside the finish/Start summary from 1024px. Type, spacing and the active timer scale within readable bounds.

The shared native dialog is a bottom sheet below 640px and centred above it; the start reminder is always centred. Short viewports scroll the dialog instead of shrinking its controls. CSS handles resizing without remounting inputs or losing draft settings and keyboard focus.

The desktop regression was caused by the 402px app cap, unconditional bottom-sheet margin, and a forced 874px minimum height. `e2e/responsive.spec.ts` locks down workspace width and modal position, then checks all dialogs and Guided mode at widths from 320px to 2560px, including short/landscape viewports. These are browser viewport checks, not a physical-device keyboard test.

## Verification

Run `npm ci`, `npm run build`, `npm run lint`, and `npm test`. For browser checks, run `npx playwright install chromium webkit` then `npm run test:e2e`.

Browser checks cover the setup, ETA, dialogs, cookie persistence, themes and responsive layout. They start real recordings and exercise the existing Skip/Stop controls after playback begins. They do not establish mobile lock-screen/background playback reliability or validate an hour-long sitting.
