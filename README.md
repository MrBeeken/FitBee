# FitBee

A phone-first coach that tells you **what** to train, **when** it fits the week, **where** to stand, and **how** to do the move. Glutes and legs get first place in the week. Upper body, walks, and rest still get real days.

FitBee is a progressive web app. After you open it once, you can put it on a home screen. It works offline. Everything is stored on the phone — no account.

## Put it on her phone

After this repo is on `main` and GitHub Pages is enabled (Settings → Pages → GitHub Actions), the live app is:

**https://mrbeeken.github.io/FitBee/**

### iPhone

1. Open the link in **Safari** (not Chrome).
2. Tap the **Share** button.
3. Tap **Add to Home Screen**.
4. Open **FitBee** from the home screen. It runs like an app.

### Android

1. Open the link in **Chrome**.
2. Tap **Add to Home screen** / **Install app**.
3. Open **FitBee** from the home screen.

### Try it on this computer

```bash
npm install
npm run dev
```

Then open the local URL. On a wide screen the app sits in a phone frame.

## What she gets

- A **Today** screen that already decided the session
- Energy / time / home-or-gym knobs that swap the workout without asking her to program
- Guided player: warmup → sets → rest timer → cooldown, with setup, cues, and swaps
- A week plan that favors glute strength, a second lower-body day, and a glute pump
- Exercise library with where / how / common misses
- Streak, calendar, heaviest-set log, export
- Knee- and back-sensitive swaps
- Rest days that can be marked done without pretending they are workouts

## Stack

Vite, React, TypeScript. Static hosting. `npm test` checks the planner and that every workout points at a real exercise.
