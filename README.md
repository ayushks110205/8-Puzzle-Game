# 🧩 8 Puzzle Game

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/PWA-Installable_App-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/License-Educational-4CAF50?style=for-the-badge" alt="Educational License" />
</p>

## Description

This repository contains an interactive implementation of the classic **8 Puzzle Problem**, built using **Next.js** and **React**. The game lets you slide numbered tiles to reach the goal state while tracking moves, time, and offering helpful hints.

## Live Demo

➡️ [Play the game on Vercel](https://8-puzzle-game-ecru.vercel.app)


## How the Game Works

The 8 Puzzle is a sliding puzzle consisting of a 3×3 grid with 8 numbered tiles and one empty space.

Your goal is to rearrange the tiles to reach the solved configuration:

```
1 2 3
4 5 6
7 8 _
```

You move tiles by **tapping** them (desktop & mobile) or **swiping** on the board (Android / iOS).

## Features

- Interactive sliding puzzle board
- Difficulty levels (Easy / Medium / Hard)
- Move counter
- Timer tracking
- Hint system
- Step-by-step AI solver
- Full puzzle solver
- Smooth tile animations (shuffling, sliding, & victory effects)
- Victory popup modal
- Collapsible How-to-Play section
- **Touch / swipe controls** — swipe on the board to slide tiles (Android & iOS)
- Responsive UI with fixed mobile layout (no clipped buttons)
- Installable as a mobile application (PWA)
- Offline gameplay support using service workers

## AI Solver

The game includes an AI solver that uses the **A\* Search Algorithm** with the **Manhattan Distance** heuristic to find an optimal solution path.

## Touch Controls (Android & iOS)

Swipe anywhere on the puzzle board to slide tiles — no need to tap individual tiles:

| Swipe direction | Tile that moves |
|---|---|
| ← Left | Tile to the **right** of the empty slot |
| → Right | Tile to the **left** of the empty slot |
| ↑ Up | Tile **below** the empty slot |
| ↓ Down | Tile **above** the empty slot |

> A minimum swipe distance of 18 px is required to prevent accidental moves. `touchAction: none` is applied to the board so page-scroll doesn't interfere.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel

## Project Structure

- `app/page.tsx` contains the main game logic and UI.

## Run Locally

```bash
git clone https://github.com/ayushks110205/8-Puzzle-Game.git
cd 8-Puzzle-Game
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play.

## Deployment

This project is deployed on **Vercel**. The live demo is available at:

https://8-puzzle-game-ecru.vercel.app

## Mobile Application (PWA)

The game is built as a **Progressive Web App (PWA)**, meaning it can be installed and run like a native mobile application on supported devices.

### Install on Mobile

1. Open the deployed link: https://8-puzzle-game-ecru.vercel.app
2. Click the **Install Game** button or select **Add to Home Screen** from the browser menu.
3. The game installs like a native mobile application.

### PWA Features

- Installable on mobile and desktop
- Works offline after first load
- Runs in standalone app mode
- Fast loading through service worker caching

## Roadmap

- Add undo/redo support and move history tracking
- Improve AI solver performance and add alternative heuristics
- Add animated onboarding + demo GIFs for the README
- Add puzzle sharing (generate shareable puzzle links)
- Add optional sound effects, themes, and haptic feedback (vibration on tile move)
- Add progressive difficulty (more tiles / larger boards)

## Author

**Ayush Kumar Singh**  
GitHub: https://github.com/ayushks110205/8-Puzzle-Game

## License

This project is for **educational purposes**.
