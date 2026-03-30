"use client";
import { useEffect, useState } from "react";
import type { GridSize, Difficulty, BestScores, BestEntry, AllBestScores } from "../types";

interface StatsProps {
  onBack: () => void;
}

const GRID_SIZES: GridSize[] = [3, 4, 5];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const SHUFFLE_LENGTHS: Record<GridSize, Record<Difficulty, number>> = {
  3: { easy: 10, medium: 30, hard: 60 },
  4: { easy: 20, medium: 50, hard: 100 },
  5: { easy: 30, medium: 70, hard: 150 },
};

function loadBestScores(): AllBestScores {
  const result: AllBestScores = {
    "3": { easy: null, medium: null, hard: null },
    "4": { easy: null, medium: null, hard: null },
    "5": { easy: null, medium: null, hard: null },
  };
  if (typeof window === "undefined") return result;
  GRID_SIZES.forEach((gs) => {
    DIFFICULTIES.forEach((d) => {
      try {
        const raw = localStorage.getItem(`8puzzle_best_${gs}x${gs}_${d}`);
        if (raw) result[String(gs) as "3" | "4" | "5"][d] = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    });
  });
  return result;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function getBadge(entry: BestEntry, gs: GridSize, difficulty: Difficulty): string | null {
  if (gs === 3 && entry.shuffleLength !== undefined) {
    // For 3x3, shuffleLength field repurposed to hold optimal moves when known
    if (entry.moves <= entry.shuffleLength) return "🎯 Perfect Solve";
    return null;
  }
  // 4x4 and 5x5 — compare against shuffle sequence length
  const shuffleLen = SHUFFLE_LENGTHS[gs][difficulty];
  if (entry.moves <= shuffleLen) return "⚡ Efficiency Master";
  return null;
}

const diffColors: Record<Difficulty, { bg: string; border: string; text: string }> = {
  easy: { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.30)", text: "#34d399" },
  medium: { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.30)", text: "#a78bfa" },
  hard: { bg: "rgba(244,63,94,0.10)", border: "rgba(244,63,94,0.30)", text: "#fb7185" },
};

export default function Stats({ onBack }: StatsProps) {
  const [scores, setScores] = useState<AllBestScores | null>(null);
  const [activeSize, setActiveSize] = useState<GridSize>(3);

  useEffect(() => {
    setScores(loadBestScores());
  }, []);

  const hasAnyScore = scores
    ? GRID_SIZES.some((gs) =>
        DIFFICULTIES.some((d) => scores[String(gs) as "3" | "4" | "5"][d] !== null)
      )
    : false;

  const currentScores: BestScores | null = scores
    ? scores[String(activeSize) as "3" | "4" | "5"]
    : null;

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)" }}
    >
      {/* Background */}
      <div className="bg-dots" aria-hidden />
      <div className="pointer-events-none" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          id="stats-back-btn"
          onClick={onBack}
          className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.30)",
            color: "#c4b5fd",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Card */}
      <div className="glass-card relative z-10 rounded-3xl p-7 w-[93vw] max-w-[500px] animate-fade-up flex flex-col gap-6">
        <div className="card-ring rounded-3xl" aria-hidden />

        {/* Header */}
        <div className="text-center">
          <span className="text-3xl block mb-1">🏛️</span>
          <h1
            className="text-3xl font-black"
            style={{
              fontFamily: "var(--font-syne),sans-serif",
              background: "linear-gradient(135deg,#f0ebff,#c4b5fd,#818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(167,139,250,0.4))",
            }}
          >
            Hall of Fame
          </h1>
          <p className="text-xs text-slate-500 mt-1 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-space),sans-serif" }}>
            Your best performances
          </p>
        </div>

        {/* Size tabs */}
        <div className="flex gap-2">
          {GRID_SIZES.map((gs) => (
            <button
              key={gs}
              id={`stats-size-${gs}`}
              onClick={() => setActiveSize(gs)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 btn-shimmer"
              style={{
                background:
                  activeSize === gs
                    ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                    : "rgba(139,92,246,0.08)",
                border: `1px solid ${activeSize === gs ? "transparent" : "rgba(139,92,246,0.2)"}`,
                color: activeSize === gs ? "#fff" : "#64748b",
                boxShadow: activeSize === gs ? "0 4px 14px rgba(124,58,237,0.4)" : "none",
                fontFamily: "var(--font-space),sans-serif",
              }}
            >
              {gs}×{gs}
            </button>
          ))}
        </div>

        {/* Score rows */}
        {!hasAnyScore ? (
          <div className="text-center py-8 flex flex-col items-center gap-3">
            <span className="text-4xl">🎮</span>
            <p className="text-sm text-slate-500" style={{ fontFamily: "var(--font-space),sans-serif" }}>
              No records yet. Play a game first!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map((d) => {
              const entry = currentScores ? currentScores[d] : null;
              const col = diffColors[d];
              const badge = entry ? getBadge(entry, activeSize, d) : null;
              return (
                <div
                  key={d}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: col.bg, border: `1px solid ${col.border}` }}
                >
                  {/* Difficulty label */}
                  <div
                    className="w-16 text-center py-1 rounded-lg text-xs font-black uppercase shrink-0"
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      color: col.text,
                      fontFamily: "var(--font-space),sans-serif",
                    }}
                  >
                    {d}
                  </div>

                  {entry ? (
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      {/* Moves */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" style={{ color: col.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span
                          className="text-sm font-black text-white"
                          style={{ fontFamily: "var(--font-syne),sans-serif" }}
                        >
                          {entry.moves}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">moves</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                        </svg>
                        <span
                          className="text-sm font-black text-white"
                          style={{ fontFamily: "var(--font-syne),sans-serif" }}
                        >
                          {formatTime(entry.time)}
                        </span>
                      </div>

                      {/* Badge */}
                      {badge && (
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            background: "linear-gradient(135deg,rgba(52,211,153,0.20),rgba(16,185,129,0.12))",
                            border: "1px solid rgba(52,211,153,0.40)",
                            color: "#34d399",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="flex-1 text-xs text-slate-600 italic"
                      style={{ fontFamily: "var(--font-space),sans-serif" }}>
                      No record yet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Clear button */}
        {hasAnyScore && (
          <button
            id="stats-clear-btn"
            onClick={() => {
              GRID_SIZES.forEach((gs) => {
                DIFFICULTIES.forEach((d) => {
                  localStorage.removeItem(`8puzzle_best_${gs}x${gs}_${d}`);
                });
              });
              setScores(loadBestScores());
            }}
            className="text-xs text-slate-600 hover:text-rose-400 transition-colors duration-200 self-center"
            style={{ fontFamily: "var(--font-space),sans-serif" }}
          >
            Clear all records
          </button>
        )}
      </div>
    </main>
  );
}
