"use client";
import { useState, useCallback } from "react";
import type { AppState, GridSize, Difficulty, PuzzleMode, BestEntry } from "./types";
import Lobby from "./components/Lobby";
import TransitionOverlay from "./components/TransitionOverlay";
import Arena from "./components/Arena";
import Stats from "./components/Stats";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("lobby");
  const [gridSize, setGridSize] = useState<GridSize>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<PuzzleMode>("classic");

  // When loading completes, move to arena
  const handleTransitionComplete = useCallback(() => {
    setAppState("arena");
  }, []);

  // Called by Arena on new best score (so Stats always reflects latest)
  const handleScoreUpdate = useCallback(
    (_gs: GridSize, _diff: Difficulty, _entry: BestEntry) => {
      // localStorage is already updated inside Arena; this is a hook point
      // for future live leaderboard integration
    },
    []
  );

  // Navigate to loading state
  const handleStartGame = useCallback((state: AppState) => {
    setAppState(state);
  }, []);

  if (appState === "lobby") {
    return (
      <Lobby
        gridSize={gridSize}
        difficulty={difficulty}
        mode={mode}
        setGridSize={setGridSize}
        setDifficulty={setDifficulty}
        setMode={setMode}
        setAppState={handleStartGame}
      />
    );
  }

  if (appState === "loading") {
    return (
      <TransitionOverlay
        gridSize={gridSize}
        onComplete={handleTransitionComplete}
      />
    );
  }

  if (appState === "arena") {
    return (
      <Arena
        gridSize={gridSize}
        difficulty={difficulty}
        mode={mode}
        onHome={() => setAppState("lobby")}
        onScoreUpdate={handleScoreUpdate}
      />
    );
  }

  if (appState === "stats") {
    return (
      <Stats
        onBack={() => setAppState("lobby")}
      />
    );
  }

  return null;
}