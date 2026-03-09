# 🧩 8 Puzzle Game
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Educational License](https://img.shields.io/badge/License-Educational-4CAF50?style=for-the-badge)

## Description

This repository contains an interactive implementation of the classic **8 Puzzle Problem**, built using **Next.js** and **React**. The game lets you slide numbered tiles to reach the goal state while tracking moves, time, and offering helpful hints.

## Live Demo

➡️ [Play the game on Vercel](https://8-puzzle-game-ecru.vercel.app)

## Screenshot

![Game Screenshot](./public/screenshot.png)

## How the Game Works

The 8 Puzzle is a sliding puzzle consisting of a 3×3 grid with 8 numbered tiles and one empty space.

Your goal is to rearrange the tiles to reach the solved configuration:

```
1 2 3
4 5 6
7 8 _
```

You move tiles by sliding them into the empty space.

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
- Responsive UI

## AI Solver

The game includes an AI solver that uses the **A\\* Search Algorithm** with the **Manhattan Distance** heuristic to find an optimal solution path.

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

## Roadmap

- Add undo/redo support and move history tracking
- Improve AI solver performance and add alternative heuristics
- Add animated onboarding + demo GIFs for the README
- Add puzzle sharing (generate shareable puzzle links)
- Add optional sound effects, themes, and haptic feedback
- Add progressive difficulty (more tiles / larger boards)

## Author

**Ayush Kumar Singh**  
GitHub: https://github.com/ayushks110205/8-Puzzle-Game

## License

This project is for **educational purposes**.
