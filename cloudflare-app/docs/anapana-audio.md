# Selected Anapana instructions

`public/audio/anapana-instructions.mp3` contains the user-selected excerpt from
S. N. Goenka's English **Daily practice** recording (audition recording 01).
Choose **Anapana** in the Custom session's **Instructions** dropdown to play
this clip before silent practice. **Vipassana** plays the existing instructions;
**Skip** omits instructions. Saved Play/Skip choices retain their behavior.

- Selection: **0:00.0–7:14.9** (434.9 seconds).
- [Source page](https://uk.dhamma.org/more-resources/mini-anapana/).
- [Full source MP3](https://discourses.dhamma.org/oml/recordings/uuid/d6c3b1c1-2c6a-4db8-8de0-0c6ada1e2030.mp3).
- Source SHA-256: `53d426d6a339dcde88a8a0db712638e5939c297d07dad0ca8f439b543d015b2f`.
- Clip SHA-256: `d1d576be62bc8819fe9f27a244c1f436c79feb49cceffdb6b45934361f8480a5`.

The excerpt preserves the original order, pauses, volume and speed. It was
encoded as a 44.1 kHz mono MP3 with no fades or normalization. The full source
recording remains outside the repository.

To reproduce the cut with FFmpeg 8.0.1, from `cloudflare-app/`, using a local
copy of the full source named `01-daily-practice.mp3`:

```sh
ffmpeg -i 01-daily-practice.mp3 -map 0:a:0 -t 434.9 -map_metadata -1 \
  -c:a libmp3lame -q:a 2 public/audio/anapana-instructions.mp3
```

Validation: the complete clip decodes without errors; its decoded sample count
and measured duration both equal 434.9 seconds. The asset is registered in
`scripts/audio-metadata.mjs` and the generated `src/audioCatalog.ts`. Planning
includes the entire recording inside the selected session duration, leaving
the remaining time for silent practice. The session details and active player
identify the selected instructions. Guided sessions keep their full recordings.
