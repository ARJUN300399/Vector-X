# D-Defence

A compact React + Three.js browser shooting game deployed on Firebase Hosting.

Live: https://arc-vector-game.web.app

## Run

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/.

## Build

```bash
npm run build
npm run preview
```

## Play

Click **Start**, aim with the mouse, and click to shoot incoming drones before they cross the shield line.

The shot sound uses the 9.0s-10.4s slice from `public/sounds/modi-ji-bhojyam.mp3`. Use the HUD sound button to toggle it on or off.

## Project Structure

```text
src/
  audio/              Web Audio loading and shot playback
  components/         React UI components
  game/               Three.js scene, entities, state, and game loop
  App.jsx             App composition
  main.jsx            React entrypoint
  styles.css          App styling
public/
  sounds/             Static game audio assets
```

## Deploy

```bash
npm run build
firebase deploy --only hosting --project puff-stuff
```

The Firebase Hosting target is configured in `firebase.json` as site `arc-vector-game`, so deploys publish to https://arc-vector-game.web.app without touching https://puff-stuff.web.app.
