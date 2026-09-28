# Daily Vipassana

A simple web app to recreate the Vipassana meditation experience at home — with S.N. Goenka's chantings, a meditation timer, and the traditional closing.

**Live app:** [daily-vipassana.app](https://daily-vipassana.app)

## What is this?

After attending a 10-day Vipassana course, I wanted a way to maintain the same feeling of meditating at a center — the opening chants to settle in, the silent meditation, and the closing chants. This app recreates that flow.

All chantings are sourced from [Dhamma.org's public recordings](https://discourses.dhamma.org/recordings/chantings). Intro and outro chanting each have Skip / Play controls using a default recording. The old 2-, 5-, and 10-minute clips are retained in `archive/chanting/` and are not deployed.

## How it works

1. **Optional Gong** — Start with a gong to signal the beginning
2. **Intro Chanting** (Skip / Play) — Default opening chanting recording
3. **Meditation Timer** (30/60/90/120 min) — Silent meditation countdown
4. **Outro Chanting** (Skip / Play) — Default chanting recording before the closing
5. **Fixed Closing** — Traditional closing (Bhavatu Sabba Mangalam)

**Skip any section you want.** Every phase has a skip button if you need to move on.

## Project Structure

```
vipassana-app/
├── cloudflare-app/     # The web app (React + Vite)
├── chunking-app/       # Python scripts to process audio
└── sample/             # Source audio files (not in git)
```

### cloudflare-app/

The frontend. A simple React app that:
- Plays chanting audio files
- Runs the meditation timer
- Handles the session flow with skip buttons for each phase

Deploy: `npm run build && npx wrangler pages deploy dist`

Vite copies `public/` into `dist`. Archived clips live outside `public`, so the
next build and deployment exclude them while preserving them in Git.

### chunking-app/

Python scripts to process the original Dhamma.org recordings:

- **analyze_audio.py** — Detects silence boundaries in audio files using librosa
- **extract_chunks.py** — Extracts 2/5/10 minute chunks from the *beginning* of each file (so you get authentic opening chants, not closing mantras)

The chunks are extracted at natural pause points so the audio doesn't cut mid-chant.

## Audio Sources

All audio comes from [Dhamma.org Chantings](https://discourses.dhamma.org/recordings/chantings):
- Morning Chantings (Day 1-11)
- The fixed outro is a short closing blessing

## Acknowledgments

Deep gratitude to [Dhamma.org](https://www.dhamma.org) and the Vipassana organization for making these recordings freely available. The technique and teachings of S.N. Goenka have helped millions of people.

This project is open source — feel free to use, modify, and share. May all beings be happy.

---

*Bhavatu Sabba Mangalam* 🙏
