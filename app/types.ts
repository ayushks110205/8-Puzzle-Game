// Shared types for the puzzle app

export type AppState = "lobby" | "loading" | "arena" | "stats";
export type GridSize = 3 | 4 | 5;
export type Difficulty = "easy" | "medium" | "hard";
export type PuzzleMode = "classic" | "photo";

export type BestEntry = {
  moves: number;
  time: number;
  /** How many shuffles were used (for Efficiency badge on large boards) */
  shuffleLength?: number;
};

export type BestScores = {
  easy: BestEntry | null;
  medium: BestEntry | null;
  hard: BestEntry | null;
};

export type AllBestScores = {
  "3": BestScores;
  "4": BestScores;
  "5": BestScores;
};

export const SHUFFLE_LENGTHS: Record<GridSize, Record<Difficulty, number>> = {
  3: { easy: 10, medium: 30, hard: 60 },
  4: { easy: 20, medium: 50, hard: 100 },
  5: { easy: 30, medium: 70, hard: 150 },
};

export const PRO_TIPS = [
  "Strategy: Solve the top row first to clear the path for the rest!",
  "Controls: You can swipe anywhere on the board — no need to tap individual tiles!",
  "Photo Mode: Use the 👁️ icon to see a 20% opacity ghost of the original image.",
  "Performance: The Auto-Solver uses IDA* to find the fastest possible solution.",
  "Tip: Corner tiles are the trickiest — plan your moves 3 steps ahead.",
  "Tip: Hard mode shuffles more moves, making the optimal path longer to find.",
];
