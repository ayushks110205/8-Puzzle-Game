"use client";
import { useState } from "react";
import type { AppState, GridSize, Difficulty, PuzzleMode } from "../types";

interface LobbyProps {
  gridSize: GridSize;
  difficulty: Difficulty;
  mode: PuzzleMode;
  setGridSize: (s: GridSize) => void;
  setDifficulty: (d: Difficulty) => void;
  setMode: (m: PuzzleMode) => void;
  setAppState: (s: AppState) => void;
}

export default function Lobby({
  gridSize,
  difficulty,
  mode,
  setGridSize,
  setDifficulty,
  setMode,
  setAppState,
}: LobbyProps) {
  const [hoverStart, setHoverStart] = useState(false);

  const handleStart = () => {
    setAppState("loading");
  };

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)" }}
    >
      {/* Dot Grid */}
      <div className="bg-dots" aria-hidden />

      {/* Floating Orbs */}
      <div className="pointer-events-none" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      {/* Floating Tiles BG Animation */}
      <div className="floating-tiles-bg pointer-events-none" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="floating-tile-bg"
            style={{
              left: `${5 + (i * 8.2) % 90}%`,
              top: `${10 + (i * 13.7) % 75}%`,
              animationDelay: `${i * 0.55}s`,
              animationDuration: `${6 + (i % 4) * 2}s`,
              width: `${36 + (i % 3) * 14}px`,
              height: `${36 + (i % 3) * 14}px`,
              opacity: 0.06 + (i % 5) * 0.02,
            }}
          >
            {i % 9 === 0 ? "" : i + 1}
          </div>
        ))}
      </div>

      {/* Stats Button — top right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          id="lobby-stats-btn"
          onClick={() => setAppState("stats")}
          className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
          style={{
            background: "rgba(139,92,246,0.14)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "#c4b5fd",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Hall of Fame
        </button>
      </div>

      {/* Main Card */}
      <div
        className="glass-card relative z-10 rounded-3xl p-7 sm:p-10 w-[93vw] max-w-[460px] animate-fade-up flex flex-col items-center gap-7"
      >
        <div className="card-ring rounded-3xl" aria-hidden />

        {/* Header */}
        <div className="text-center w-full">
          <span
            className="text-[10px] font-bold tracking-[0.3em] uppercase block mb-2"
            style={{ color: "rgba(167,139,250,0.65)", fontFamily: "var(--font-space),sans-serif" }}
          >
            Puzzle Play Store
          </span>
          <h1
            className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-2"
            style={{
              fontFamily: "var(--font-syne),sans-serif",
              background: "linear-gradient(135deg,#f0ebff 0%,#c4b5fd 35%,#818cf8 75%,#60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 32px rgba(167,139,250,0.45))",
            }}
          >
            Sliding Puzzle
          </h1>
          <p
            className="text-xs tracking-widest uppercase mt-1"
            style={{ color: "rgba(100,116,139,0.7)", fontFamily: "var(--font-space),sans-serif" }}
          >
            by Ayush Kumar Singh
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="w-full flex flex-col gap-2">
          <label
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-center block"
            style={{ color: "#64748b", fontFamily: "var(--font-space),sans-serif" }}
          >
            Difficulty
          </label>
          <div className="flex gap-2 justify-center">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                id={`lobby-diff-${d}`}
                onClick={() => setDifficulty(d)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-250 btn-shimmer"
                style={{
                  background:
                    difficulty === d
                      ? d === "easy"
                        ? "linear-gradient(135deg,#059669,#10b981)"
                        : d === "hard"
                        ? "linear-gradient(135deg,#e11d48,#f43f5e)"
                        : "linear-gradient(135deg,#5b21b6,#7c3aed)"
                      : "rgba(139,92,246,0.08)",
                  border: `1px solid ${difficulty === d ? "transparent" : "rgba(139,92,246,0.2)"}`,
                  color: difficulty === d ? "#fff" : "#94a3b8",
                  boxShadow:
                    difficulty === d
                      ? d === "easy"
                        ? "0 4px 14px rgba(16,185,129,0.4)"
                        : d === "hard"
                        ? "0 4px 14px rgba(244,63,94,0.4)"
                        : "0 4px 14px rgba(124,58,237,0.4)"
                      : "none",
                  transform: difficulty === d ? "scale(1.05)" : "scale(1)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Size Selector */}
        <div className="w-full flex flex-col gap-2">
          <label
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-center block"
            style={{ color: "#64748b", fontFamily: "var(--font-space),sans-serif" }}
          >
            Board Size
          </label>
          <div className="flex gap-2 justify-center">
            {([3, 4, 5] as GridSize[]).map((s) => (
              <button
                key={s}
                id={`lobby-size-${s}`}
                onClick={() => setGridSize(s)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-250 btn-shimmer"
                style={{
                  background:
                    gridSize === s
                      ? "linear-gradient(135deg,#0e7490,#0891b2)"
                      : "rgba(139,92,246,0.08)",
                  border: `1px solid ${gridSize === s ? "transparent" : "rgba(139,92,246,0.2)"}`,
                  color: gridSize === s ? "#fff" : "#94a3b8",
                  boxShadow: gridSize === s ? "0 4px 14px rgba(8,145,178,0.4)" : "none",
                  transform: gridSize === s ? "scale(1.05)" : "scale(1)",
                }}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* Puzzle Mode Selector */}
        <div className="w-full flex flex-col gap-2">
          <label
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-center block"
            style={{ color: "#64748b", fontFamily: "var(--font-space),sans-serif" }}
          >
            Mode
          </label>
          <div className="flex gap-2">
            <button
              id="lobby-mode-classic"
              onClick={() => setMode("classic")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-250 btn-shimmer"
              style={{
                background: mode === "classic" ? "linear-gradient(135deg,#5b21b6,#7c3aed)" : "rgba(139,92,246,0.08)",
                border: `1px solid ${mode === "classic" ? "transparent" : "rgba(139,92,246,0.2)"}`,
                color: mode === "classic" ? "#fff" : "#94a3b8",
                boxShadow: mode === "classic" ? "0 4px 16px rgba(124,58,237,0.45)" : "none",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Classic
            </button>
            <button
              id="lobby-mode-photo"
              onClick={() => setMode("photo")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-250 btn-shimmer"
              style={{
                background: mode === "photo" ? "linear-gradient(135deg,#db2777,#9333ea)" : "rgba(139,92,246,0.08)",
                border: `1px solid ${mode === "photo" ? "transparent" : "rgba(139,92,246,0.2)"}`,
                color: mode === "photo" ? "#fff" : "#94a3b8",
                boxShadow: mode === "photo" ? "0 4px 16px rgba(219,39,119,0.45)" : "none",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo
            </button>
          </div>
        </div>

        {/* Shuffle count hint */}
        <p
          className="text-[10px] text-center -mt-3"
          style={{ color: "rgba(100,116,139,0.6)", fontFamily: "var(--font-space),sans-serif" }}
        >
          {((): string => {
            const nm: Record<GridSize, Record<Difficulty, number>> = {
              3: { easy: 10, medium: 30, hard: 60 },
              4: { easy: 20, medium: 50, hard: 100 },
              5: { easy: 30, medium: 70, hard: 150 },
            };
            return `~${nm[gridSize][difficulty]} shuffle moves on a ${gridSize}×${gridSize} board`;
          })()}
        </p>

        {/* Start Button */}
        <button
          id="lobby-start-btn"
          onClick={handleStart}
          onMouseEnter={() => setHoverStart(true)}
          onMouseLeave={() => setHoverStart(false)}
          className="btn-shimmer w-full py-4 rounded-2xl text-base font-black text-white flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#6366f1,#0891b2)",
            boxShadow: hoverStart
              ? "0 12px 40px rgba(124,58,237,0.65), 0 0 0 2px rgba(99,102,241,0.35)"
              : "0 6px 24px rgba(124,58,237,0.45)",
            fontFamily: "var(--font-syne),sans-serif",
            fontSize: "1.05rem",
            letterSpacing: "0.04em",
            transition: "box-shadow 0.25s ease",
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Game
        </button>
      </div>
    </main>
  );
}
