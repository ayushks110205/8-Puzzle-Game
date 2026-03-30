"use client";
import { useEffect, useState, useRef } from "react";
import type { GridSize } from "../types";
import { PRO_TIPS } from "../types";

interface TransitionOverlayProps {
  gridSize: GridSize;
  onComplete: () => void;
}

const STATUS_MESSAGES = [
  "Calibrating Grid...",
  "Initializing AI Solver...",
  "Shuffling Tiles...",
  "Loading Assets...",
  "Ready!",
];

export default function TransitionOverlay({ gridSize, onComplete }: TransitionOverlayProps) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [tip] = useState(() => PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)]);
  const [tileNumbers, setTileNumbers] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tileCount = gridSize * gridSize;

  // Generate randomized tile display
  useEffect(() => {
    const tiles = Array.from({ length: tileCount }, (_, i) => i + 1);
    setTileNumbers(tiles);

    // Rapid random shuffles for shimmer effect
    const shuffleInterval = setInterval(() => {
      setTileNumbers((prev) => {
        const arr = [...prev];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      });
    }, 110);

    return () => clearInterval(shuffleInterval);
  }, [tileCount]);

  // Cycle status messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 300);

    // Navigate after 1500ms
    timerRef.current = setTimeout(() => {
      clearInterval(msgInterval);
      onComplete();
    }, 1500);

    return () => {
      clearInterval(msgInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  const tilePx = Math.min(Math.max(300 / gridSize - 4, 44), 76);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 select-none"
      style={{ background: "linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)" }}
    >
      {/* Orbs */}
      <div className="pointer-events-none" aria-hidden>
        <div className="orb orb-1" style={{ opacity: 0.5 }} />
        <div className="orb orb-2" style={{ opacity: 0.5 }} />
      </div>

      {/* Shimmering grid */}
      <div className="flex flex-col items-center gap-3">
        <p
          className="text-xs font-bold tracking-[0.25em] uppercase mb-1"
          style={{ color: "rgba(167,139,250,0.55)", fontFamily: "var(--font-space),sans-serif" }}
        >
          Preparing your {gridSize}×{gridSize} board
        </p>

        <div
          className="transition-overlay-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, ${tilePx}px)`,
            gap: "4px",
            padding: "10px",
            background: "rgba(7,4,22,0.7)",
            borderRadius: "1.2rem",
            border: "1px solid rgba(139,92,246,0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          {tileNumbers.map((num, idx) => (
            <div
              key={idx}
              className="transition-tile"
              style={{
                width: tilePx,
                height: tilePx,
                borderRadius: gridSize === 5 ? "0.5rem" : "0.75rem",
                background:
                  num === tileCount
                    ? "rgba(139,92,246,0.04)"
                    : "linear-gradient(145deg,#7c3aed,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: gridSize === 3 ? "1.1rem" : gridSize === 4 ? "0.8rem" : "0.65rem",
                fontWeight: 900,
                color: num === tileCount ? "transparent" : "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-syne),sans-serif",
                boxShadow:
                  num === tileCount
                    ? "inset 0 2px 8px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "all 0.08s ease",
                filter: "blur(0.3px)",
              }}
            >
              {num !== tileCount ? num : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Status message */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: "#a78bfa",
              boxShadow: "0 0 10px rgba(167,139,250,0.8)",
              animation: "pulse-dot 0.8s ease-in-out infinite",
            }}
          />
          <span
            className="text-sm font-bold"
            style={{
              color: "#e2e8f0",
              fontFamily: "var(--font-space),sans-serif",
              minWidth: "200px",
              textAlign: "center",
            }}
          >
            {STATUS_MESSAGES[statusIdx]}
          </span>
        </div>

        {/* Loading bar */}
        <div
          style={{
            width: "200px",
            height: "3px",
            background: "rgba(139,92,246,0.15)",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,#7c3aed,#6366f1,#0891b2)",
              borderRadius: "9999px",
              animation: "loading-bar 1.5s ease-in-out forwards",
            }}
          />
        </div>
      </div>

      {/* Pro-Tip */}
      <div
        className="mx-6 px-5 py-3.5 rounded-2xl text-center max-w-sm"
        style={{
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.22)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: "rgba(167,139,250,0.55)" }}
        >
          💡 Pro Tip
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "#94a3b8", fontFamily: "var(--font-space),sans-serif" }}
        >
          {tip}
        </p>
      </div>
    </div>
  );
}
