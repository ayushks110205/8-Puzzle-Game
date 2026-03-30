"use client";
import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import type { GridSize, Difficulty, PuzzleMode, BestScores, BestEntry } from "../types";
import { SHUFFLE_LENGTHS } from "../types";

interface ArenaProps {
  gridSize: GridSize;
  difficulty: Difficulty;
  mode: PuzzleMode;
  onHome: () => void;
  onScoreUpdate: (gs: GridSize, diff: Difficulty, entry: BestEntry) => void;
}

// Maps row index → CSS class suffix, legend bg gradient, and glow colour
const ROW_CORRECT_COLORS = [
  { cls: "puzzle-tile-correct-0", bg: "linear-gradient(135deg,#1e3a8a,#3b82f6)", glow: "rgba(59,130,246,0.75)",  label: "Row 1" },
  { cls: "puzzle-tile-correct-1", bg: "linear-gradient(135deg,#0e7490,#06b6d4)", glow: "rgba(6,182,212,0.75)",   label: "Row 2" },
  { cls: "puzzle-tile-correct-2", bg: "linear-gradient(135deg,#9f1239,#e11d48)", glow: "rgba(244,63,94,0.75)",   label: "Row 3" },
  { cls: "puzzle-tile-correct-3", bg: "linear-gradient(135deg,#92400e,#d97706)", glow: "rgba(245,158,11,0.75)",  label: "Row 4" },
  { cls: "puzzle-tile-correct-4", bg: "linear-gradient(135deg,#047857,#10b981)", glow: "rgba(52,211,153,0.75)",  label: "Row 5" },
];

function extractDominantColor(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#7c3aed";
    ctx.drawImage(img, 0, 0, 16, 16);
    const d = ctx.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; g += d[i + 1]; b += d[i + 2]; count++;
    }
    const avg = (v: number) => Math.min(255, Math.round((v / count) * 1.3));
    return `rgb(${avg(r)},${avg(g)},${avg(b)})`;
  } catch { return "#7c3aed"; }
}

export default function Arena({ gridSize, difficulty, mode, onHome, onScoreUpdate }: ArenaProps) {
  const tileCount = gridSize * gridSize;
  const goal = Array.from({ length: tileCount - 1 }, (_, i) => i + 1).concat([0]);

  const [board, setBoard] = useState<number[]>(goal);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);
  const [workerSolving, setWorkerSolving] = useState(false);
  const [solveError, setSolveError] = useState(false);
  const [hintTile, setHintTile] = useState<number | null>(null);
  const [hintTarget, setHintTarget] = useState<number | null>(null);
  const [optimalMoves, setOptimalMoves] = useState<number | null>(null);
  const [flashMoves, setFlashMoves] = useState(false);
  const [showGhost, setShowGhost] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bestScores, setBestScores] = useState<BestScores>({ easy: null, medium: null, hard: null });
  const [themeColor, setThemeColor] = useState("#7c3aed");

  // Photo mode state
  const [puzzleImage, setPuzzleImage] = useState<string | null>(null);
  const [photoPhase, setPhotoPhase] = useState<"upload" | "playing">(mode === "photo" ? "upload" : "playing");

  const solverWorkerRef = useRef<Worker | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const prevMoves = useRef(0);
  const shuffleLengthRef = useRef(SHUFFLE_LENGTHS[gridSize][difficulty]);

  // Load best scores
  useEffect(() => {
    const load = (d: string): BestEntry | null => {
      try {
        const raw = localStorage.getItem(`8puzzle_best_${gridSize}x${gridSize}_${d}`);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    };
    setBestScores({ easy: load("easy"), medium: load("medium"), hard: load("hard") });
  }, [gridSize]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running) { timer = setInterval(() => setTime(t => t + 1), 1000); }
    return () => clearInterval(timer);
  }, [running]);

  // Flash moves
  useEffect(() => {
    if (moves !== prevMoves.current) {
      prevMoves.current = moves;
      setFlashMoves(true);
      const t = setTimeout(() => setFlashMoves(false), 450);
      return () => clearTimeout(t);
    }
  }, [moves]);

  // Confetti
  useEffect(() => {
    if (isSolved) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2200);
      return () => clearTimeout(t);
    }
  }, [isSolved]);

  // Auto-scramble on mount if classic mode
  useEffect(() => {
    if (mode === "classic") doScramble(difficulty, gridSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSolvable = (state: number[], gs: number) => {
    const flat = state.filter(x => x !== 0);
    let inv = 0;
    for (let i = 0; i < flat.length; i++)
      for (let j = i + 1; j < flat.length; j++)
        if (flat[i] > flat[j]) inv++;
    if (gs % 2 === 1) return inv % 2 === 0;
    const blankRow = Math.floor(state.indexOf(0) / gs);
    const fromBottom = gs - blankRow;
    return inv % 2 === 0 ? fromBottom % 2 === 1 : fromBottom % 2 === 0;
  };

  const getValidMoves = (state: number[], gs = gridSize) => {
    const tc = gs * gs;
    const empty = state.indexOf(0);
    const er = Math.floor(empty / gs), ec = empty % gs;
    return [empty - 1, empty + 1, empty - gs, empty + gs].filter(i => {
      if (i < 0 || i >= tc) return false;
      const r = Math.floor(i / gs), c = i % gs;
      return (Math.abs(r - er) === 1 && c === ec) || (Math.abs(c - ec) === 1 && r === er);
    });
  };

  const manhattan = (state: number[], gs = gridSize) => {
    let dist = 0;
    state.forEach((tile, index) => {
      if (tile === 0) return;
      const gr = Math.floor((tile - 1) / gs), gc = (tile - 1) % gs;
      const r = Math.floor(index / gs), c = index % gs;
      dist += Math.abs(gr - r) + Math.abs(gc - c);
    });
    return dist;
  };

  const doScramble = (level: string, gs: GridSize) => {
    if (solverWorkerRef.current) { solverWorkerRef.current.terminate(); solverWorkerRef.current = null; }
    setWorkerSolving(false); setSolveError(false);

    const tc = gs * gs;
    const g = Array.from({ length: tc - 1 }, (_, i) => i + 1).concat([0]);
    const nm = SHUFFLE_LENGTHS[gs][level as Difficulty] ?? 30;
    shuffleLengthRef.current = nm;

    const getVM = (state: number[]) => {
      const e = state.indexOf(0), er = Math.floor(e / gs), ec = e % gs;
      return [e - 1, e + 1, e - gs, e + gs].filter(i => {
        if (i < 0 || i >= tc) return false;
        const r = Math.floor(i / gs), c = i % gs;
        return (Math.abs(r - er) === 1 && c === ec) || (Math.abs(c - ec) === 1 && r === er);
      });
    };

    let seq: number[][], final: number[];
    do {
      seq = [[...g]]; let tmp = [...g];
      for (let i = 0; i < nm; i++) {
        const poss = getVM(tmp);
        const mv = poss[Math.floor(Math.random() * poss.length)];
        const e = tmp.indexOf(0); tmp = [...tmp]; tmp[e] = tmp[mv]; tmp[mv] = 0;
        seq.push([...tmp]);
      }
      final = seq[seq.length - 1];
    } while (!isSolvable(final, gs));

    setMoves(0); setTime(0); setRunning(false); setIsSolved(false);
    setOptimalMoves(null); setIsShuffling(true);
    setBoard([...g]); setHintTile(null); setHintTarget(null);
    let step = 1;
    const tick = () => {
      if (step >= seq.length) { setIsShuffling(false); return; }
      setBoard(seq[step]); step++; setTimeout(tick, 80);
    };
    setTimeout(tick, 80);
  };

  const saveScore = (finalMoves: number, finalTime: number) => {
    setBestScores(prev => {
      const entry = prev[difficulty as keyof BestScores];
      const isBetter = !entry || finalMoves < entry.moves || (finalMoves === entry.moves && finalTime < entry.time);
      if (!isBetter) return prev;
      const newEntry: BestEntry = {
        moves: finalMoves,
        time: finalTime,
        shuffleLength: gridSize === 3 ? (optimalMoves ?? shuffleLengthRef.current) : shuffleLengthRef.current,
      };
      if (typeof window !== "undefined")
        localStorage.setItem(`8puzzle_best_${gridSize}x${gridSize}_${difficulty}`, JSON.stringify(newEntry));
      onScoreUpdate(gridSize, difficulty, newEntry);
      return { ...prev, [difficulty]: newEntry };
    });
  };

  const moveTile = useCallback((index: number) => {
    if (isShuffling) return;
    if (!running) setRunning(true);
    setBoard(currentBoard => {
      const empty = currentBoard.indexOf(0);
      const row = Math.floor(index / gridSize), col = index % gridSize;
      const er = Math.floor(empty / gridSize), ec = empty % gridSize;
      const adjacent = (Math.abs(row - er) === 1 && col === ec) || (Math.abs(col - ec) === 1 && row === er);
      if (!adjacent) return currentBoard;
      const newBoard = [...currentBoard];
      newBoard[empty] = currentBoard[index];
      newBoard[index] = 0;
      setMoves(m => m + 1);
      setHintTile(null); setHintTarget(null);
      try { navigator.vibrate(10); } catch (_) {}
      const currentGoal = Array.from({ length: gridSize * gridSize - 1 }, (_, i) => i + 1).concat([0]);
      if (newBoard.every((v, i) => v === currentGoal[i])) {
        setIsSolved(true); setRunning(false);
        try { navigator.vibrate([30, 20, 30]); } catch (_) {}
        (async () => {
          try { const confetti = (await import('canvas-confetti')).default; confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); }
          catch (_) {}
        })();
        setMoves(m => { setTime(t => { saveScore(m + 1, t); return t; }); return m + 1; });
      }
      return newBoard;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShuffling, running, gridSize]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isShuffling) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null; touchStartY.current = null;
    const ADX = Math.abs(dx), ADY = Math.abs(dy);
    if (Math.max(ADX, ADY) < 18) return;
    const empty = board.indexOf(0);
    let tileToMove: number | null = null;
    if (ADX > ADY) {
      if (dx > 0) { const l = empty - 1; if (Math.floor(l / gridSize) === Math.floor(empty / gridSize) && l >= 0) tileToMove = l; }
      else { const r = empty + 1; if (Math.floor(r / gridSize) === Math.floor(empty / gridSize) && r < tileCount) tileToMove = r; }
    } else {
      if (dy > 0) { const a = empty - gridSize; if (a >= 0) tileToMove = a; }
      else { const b = empty + gridSize; if (b < tileCount) tileToMove = b; }
    }
    if (tileToMove !== null) moveTile(tileToMove);
  };

  const getHint = () => {
    const empty = board.indexOf(0), er = Math.floor(empty / gridSize), ec = empty % gridSize;
    const valMoves = [empty - 1, empty + 1, empty - gridSize, empty + gridSize].filter(i => {
      if (i < 0 || i >= tileCount) return false;
      const r = Math.floor(i / gridSize), c = i % gridSize;
      return (Math.abs(r - er) === 1 && c === ec) || (Math.abs(c - ec) === 1 && r === er);
    });
    let best = null, score = Infinity;
    valMoves.forEach(m => {
      const temp = [...board]; temp[empty] = temp[m]; temp[m] = 0;
      const h = manhattan(temp);
      if (h < score) { score = h; best = m; }
    });
    setHintTile(best); setHintTarget(empty);
  };

  const solvePuzzle = () => {
    if (autoSolving || workerSolving) return;
    if (solverWorkerRef.current) { solverWorkerRef.current.terminate(); solverWorkerRef.current = null; }
    setSolveError(false);
    if (!running) setRunning(true);
    let worker: Worker;
    try { worker = new Worker(new URL('../puzzle-solver.worker.ts', import.meta.url)); }
    catch { setSolveError(true); setTimeout(() => setSolveError(false), 3000); return; }
    solverWorkerRef.current = worker;
    setWorkerSolving(true);
    const snapBoard = [...board], snapGs = gridSize, snapDiff = difficulty;
    worker.onmessage = (e: MessageEvent<{ solution: number[][] }>) => {
      solverWorkerRef.current = null; worker.terminate(); setWorkerSolving(false);
      const path = e.data.solution;
      if (!path || path.length <= 1) { setSolveError(true); setTimeout(() => setSolveError(false), 3000); return; }
      setOptimalMoves(path.length - 1);
      setAutoSolving(true);
      let i = 1;
      const step = () => {
        if (i >= path.length) {
          const final = path[path.length - 1];
          const goalLocal = Array.from({ length: final.length - 1 }, (_, k) => k + 1).concat([0]);
          if (final.every((v, k) => v === goalLocal[k])) {
            setIsSolved(true); setRunning(false);
            const solvedMoves = path.length - 1;
            saveScore(solvedMoves, 0);
          }
          setAutoSolving(false); return;
        }
        setBoard(path[i]); setMoves(m => m + 1); i++; setTimeout(step, 350);
      };
      setTimeout(step, 350);
    };
    worker.onerror = () => {
      solverWorkerRef.current = null; setWorkerSolving(false); setAutoSolving(false);
      setSolveError(true); setTimeout(() => setSolveError(false), 3000);
    };
    worker.postMessage({ board: snapBoard, gridSize: snapGs });
  };

  const resetGame = () => {
    if (solverWorkerRef.current) { solverWorkerRef.current.terminate(); solverWorkerRef.current = null; }
    setWorkerSolving(false); setSolveError(false); setAutoSolving(false);
    setBoard(goal); setMoves(0); setTime(0); setRunning(false); setIsSolved(false);
  };

  const handleBack = () => {
    const inProgress = moves > 0 && !isSolved;
    if (inProgress && !window.confirm("Quit game? Your progress will be lost.")) return;
    if (solverWorkerRef.current) { solverWorkerRef.current.terminate(); solverWorkerRef.current = null; }
    onHome();
  };

  // Photo upload handler
  const loadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setPuzzleImage(result);
        setShowGhost(false);
        // Extract theme color
        const img = new Image();
        img.onload = () => {
          const color = extractDominantColor(img);
          setThemeColor(color);
          document.documentElement.style.setProperty("--theme-primary", color);
          document.documentElement.style.setProperty("--theme-accent", color);
        };
        img.src = result;
        // Start game after image loads
        setPhotoPhase("playing");
        setTimeout(() => doScramble(difficulty, gridSize), 80);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Progress calculation
  const correctTiles = board.filter((v, i) => v !== 0 && v === goal[i]).length;
  const progressPct = Math.round((correctTiles / (tileCount - 1)) * 100);

  // Board sizing
  const BOARD_MIN = gridSize === 5 ? 260 : 240;
  const BOARD_MAX = gridSize === 5 ? 320 : 300;
  const BOARD_PX = typeof window !== "undefined"
    ? Math.min(Math.max(window.innerWidth * (gridSize === 5 ? 0.85 : 0.72), BOARD_MIN), BOARD_MAX)
    : BOARD_MAX;
  const TILE_PX = (BOARD_PX - 16) / gridSize;

  const confettiColors = ["#a78bfa","#818cf8","#f472b6","#34d399","#fbbf24","#60a5fa"];

  // ── Photo Upload Phase ────────────────────────────────
  if (mode === "photo" && photoPhase === "upload") {
    return (
      <main
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden select-none"
        style={{ background: "linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)" }}
      >
        <div className="bg-dots" aria-hidden />
        <div className="pointer-events-none" aria-hidden>
          <div className="orb orb-1" /><div className="orb orb-2" />
        </div>
        <div className="absolute top-4 left-4 z-20">
          <button onClick={handleBack} id="arena-back-btn"
            className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)", color: "#c4b5fd" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <div className="glass-card relative z-10 rounded-3xl p-8 w-[90vw] max-w-[380px] animate-fade-up flex flex-col items-center gap-6">
          <div className="card-ring rounded-3xl" aria-hidden />
          <div className="text-center">
            <span className="text-4xl block mb-3">🖼️</span>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-syne),sans-serif" }}>
              Upload Your Photo
            </h2>
            <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: "var(--font-space),sans-serif" }}>
              Your image will be split into {tileCount - 1} puzzle tiles
            </p>
          </div>
          <label
            className="w-full flex flex-col items-center gap-3 py-10 rounded-2xl cursor-pointer transition-all duration-200"
            style={{
              border: "2px dashed rgba(139,92,246,0.45)",
              background: "rgba(139,92,246,0.06)",
            }}
          >
            <svg className="w-10 h-10" style={{ color: "#a78bfa" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-bold text-violet-300" style={{ fontFamily: "var(--font-space),sans-serif" }}>
              Tap to choose image
            </span>
            <span className="text-xs text-slate-600">JPG, PNG, WebP supported</span>
            <input type="file" accept="image/*" className="sr-only" onChange={loadImage} />
          </label>
          <button
            onClick={() => { setPhotoPhase("playing"); doScramble(difficulty, gridSize); }}
            className="text-xs text-slate-600 hover:text-violet-400 transition-colors duration-200"
            style={{ fontFamily: "var(--font-space),sans-serif" }}
          >
            Skip — play without photo
          </button>
        </div>
      </main>
    );
  }

  // ── Main Game Arena ───────────────────────────────────────────────
  return (
    <main
      className="relative flex flex-col items-center justify-start min-h-[100dvh] overflow-x-hidden overflow-y-auto select-none py-5"
      style={{ background: "linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)" }}
    >
      <div className="bg-dots" aria-hidden />
      <div className="pointer-events-none" aria-hidden>
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="orb orb-3" /><div className="orb orb-4" />
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={handleBack} id="arena-back-btn"
          className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)", color: "#c4b5fd" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>
      </div>

      {/* Confetti */}
      {showConfetti && Array.from({ length: 22 }, (_, i) => ({
        id: i, color: confettiColors[i % confettiColors.length],
        left: `${8 + Math.random() * 84}%`, top: `${5 + Math.random() * 40}%`,
        delay: `${Math.random() * 0.9}s`, size: `${6 + Math.floor(Math.random() * 6)}px`
      })).map(p => (
        <div key={p.id} className="confetti-dot" style={{
          left: p.left, top: p.top, background: p.color,
          width: p.size, height: p.size, animationDelay: p.delay, animationDuration: "1.5s"
        }} />
      ))}

      {/* Main card */}
      <div className="glass-card relative z-10 rounded-3xl p-4 sm:p-6 w-[95vw] max-w-[440px] animate-fade-up flex flex-col items-center gap-3 mt-10">
        <div className="card-ring rounded-3xl" aria-hidden />

        {/* Header */}
        <div className="text-center w-full">
          <span className="text-[9px] font-bold tracking-[0.26em] uppercase block"
            style={{ color: "rgba(167,139,250,0.65)", fontFamily: "var(--font-space),sans-serif" }}>
            {gridSize}×{gridSize} · {difficulty}
          </span>
          <h1 className="text-3xl font-black leading-none mt-0.5"
            style={{
              fontFamily: "var(--font-syne),sans-serif",
              background: "linear-gradient(135deg,#f0ebff 0%,#c4b5fd 35%,#818cf8 75%,#60a5fa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 22px rgba(167,139,250,0.4))"
            }}>
            Sliding Puzzle
          </h1>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 flex-wrap justify-center w-full">
          {[
            { icon: "🎯", label: "Moves", value: String(moves), flash: flashMoves },
            { icon: "⏱️", label: "Time", value: formatTime(time), flash: false },
            { icon: "⭐", label: "Best", value: (() => { const b = bestScores[difficulty as keyof BestScores]; return b ? `${b.moves}m` : "—"; })(), flash: false },
          ].map(({ icon, label, value, flash }) => (
            <div key={label} className="stat-pill flex items-center gap-2 px-3 py-1.5">
              <span className="text-base">{icon}</span>
              <div>
                <p className="text-[8px] text-slate-500 uppercase tracking-widest leading-none" style={{ fontFamily: "var(--font-space),sans-serif" }}>{label}</p>
                <p className={`text-sm font-bold text-slate-100 leading-snug tabular-nums ${flash ? "animate-num-flash" : ""}`}
                  style={{ fontFamily: "var(--font-space),sans-serif" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {!isSolved && (
          <div className="w-full flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest">
              <span>Progress</span>
              <span style={{ color: progressPct === 100 ? "#34d399" : "#94a3b8" }}>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(139,92,246,0.12)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? "linear-gradient(90deg,#34d399,#10b981)"
                    : "linear-gradient(90deg,#7c3aed,#6366f1,#0891b2)",
                }}
              />
            </div>
          </div>
        )}

        {/* Puzzle board wrapper */}
        <div className="relative">
          <div
            className="puzzle-board"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              width: `clamp(${BOARD_MIN}px,${gridSize === 5 ? "85vw" : "72vw"},${BOARD_MAX}px)`,
              height: `clamp(${BOARD_MIN}px,${gridSize === 5 ? "85vw" : "72vw"},${BOARD_MAX}px)`,
              touchAction: "none",
            }}
          >
            <div className="relative w-full h-full">
              {/* Ghost overlay */}
              {puzzleImage && showGhost && (
                <img src={puzzleImage} alt="" aria-hidden style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", opacity: 0.20, borderRadius: "0.85rem",
                  zIndex: 0, pointerEvents: "none",
                }} />
              )}

              {board.map((tile, index) => {
                const row = Math.floor(index / gridSize), col = index % gridSize;
                const goalRow = tile === 0 ? 0 : Math.floor((tile - 1) / gridSize);
                const goalCol = tile === 0 ? 0 : (tile - 1) % gridSize;
                const isHintTile = hintTile === index;
                const isTarget = hintTarget === index;
                const isEmpty = tile === 0;
                const isCorrect = !isEmpty && tile === goal[index];
                const correctRow = isCorrect ? row % 5 : -1;

                const photoStyle: React.CSSProperties = puzzleImage && !isEmpty ? {
                  background: `url(${puzzleImage}) no-repeat -${goalCol * TILE_PX}px -${goalRow * TILE_PX}px / ${BOARD_PX - 16}px ${BOARD_PX - 16}px`,
                } : {};

                const numFontSize = gridSize === 3 ? "clamp(1.1rem,4.5vw,1.6rem)" : gridSize === 4 ? "clamp(0.65rem,2.5vw,0.9rem)" : "clamp(0.55rem,2vw,0.75rem)";

                const tileSize = `calc((clamp(${BOARD_MIN}px,${gridSize === 5 ? "85vw" : "72vw"},${BOARD_MAX}px) - 16px) / ${gridSize})`;

                return (
                  <div
                    key={index}
                    onClick={() => moveTile(index)}
                    style={{
                      top: `calc(${row} * ((clamp(${BOARD_MIN}px,${gridSize === 5 ? "85vw" : "72vw"},${BOARD_MAX}px) - 16px) / ${gridSize}) + ${row}px)`,
                      left: `calc(${col} * ((clamp(${BOARD_MIN}px,${gridSize === 5 ? "85vw" : "72vw"},${BOARD_MAX}px) - 16px) / ${gridSize}) + ${col}px)`,
                      width: tileSize, height: tileSize, zIndex: 1,
                      transform: isCorrect && !isHintTile ? "scale(1.03)" : undefined,
                      ...photoStyle,
                    }}
                    className={[
                      "puzzle-tile",
                      isHintTile ? "puzzle-tile-hint" : "",
                      isTarget ? "puzzle-tile-target" : "",
                      isEmpty ? "puzzle-tile-empty" : "",
                      isCorrect && !isHintTile && !isTarget && !puzzleImage
                        ? `puzzle-tile-correct-${correctRow}` : "",
                      puzzleImage && !isEmpty && !isHintTile && !isTarget ? "puzzle-tile-photo" : "",
                    ].join(" ")}
                  >
                    {tile !== 0 && !puzzleImage && (
                      <span className="relative z-10 font-black text-white pointer-events-none"
                        style={{ fontFamily: "var(--font-syne),sans-serif", fontSize: numFontSize,
                          textShadow: "0 1px 0 rgba(0,0,0,0.5),0 0 14px rgba(255,255,255,0.22)", letterSpacing: "-0.02em" }}>
                        {tile}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghost toggle button (Photo mode only, puzzle phase) */}
          {puzzleImage && photoPhase === "playing" && (
            <button
              onClick={() => setShowGhost(g => !g)}
              title={showGhost ? "Hide reference image" : "Show reference image"}
              style={{
                position: "absolute", bottom: "-14px", right: "-14px",
                width: "32px", height: "32px", borderRadius: "50%",
                background: showGhost ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(99,102,241,0.18)",
                border: "1.5px solid rgba(99,102,241,0.5)",
                boxShadow: showGhost ? "0 0 14px rgba(99,102,241,0.55)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 10, transition: "all 0.2s ease",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                style={{ color: showGhost ? "#fff" : "#818cf8" }}>
                {showGhost ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>) : (
                  <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/></>
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Color Legend for Correct Rows */}
        {!puzzleImage && (
          <div className="flex w-full justify-between items-center gap-1 mt-3 px-2">
            {ROW_CORRECT_COLORS.slice(0, gridSize).map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 opacity-80">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: color.bg, boxShadow: `0 0 8px ${color.glow}` }}
                />
                <span className="text-[8px] text-slate-300 uppercase tracking-widest font-bold"
                  style={{ fontFamily: "var(--font-space),sans-serif" }}>{color.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 w-full mt-3">
          <button onClick={() => doScramble(difficulty, gridSize)} disabled={autoSolving || workerSolving || isShuffling}
            className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 4px 16px rgba(16,185,129,0.40)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            New Game
          </button>

          <button onClick={getHint} disabled={autoSolving || workerSolving}
            className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 14px rgba(245,158,11,0.35)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M12 21v-1m-6.364-1.636l.707-.707M3.636 5.636l.707.707M20.364 18.364l-.707-.707m-9.9-9.9a5 5 0 117.07 0l-.548.548A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Hint
          </button>

          <button onClick={resetGame} disabled={autoSolving || workerSolving}
            className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Reset
          </button>

          <button onClick={solvePuzzle} disabled={autoSolving || workerSolving}
            className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: autoSolving ? "linear-gradient(135deg,#3730a3,#312e81)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: autoSolving ? "none" : "0 4px 14px rgba(99,102,241,0.38)"
            }}>
            {autoSolving ? (
              <><svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg> Solving…</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg> Auto-Solve</>
            )}
          </button>
        </div>

        {/* Solver error */}
        {solveError && (
          <p className="text-xs text-rose-400 text-center" style={{ fontFamily: "var(--font-space),sans-serif" }}>
            Solver timed out — try Hint instead.
          </p>
        )}
      </div>

      {/* Victory Modal */}
      {isSolved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,2,16,0.85)", backdropFilter: "blur(20px)" }}>
          <div className="victory-card animate-celebrate rounded-[2rem] p-8 text-center w-[300px] sm:w-[360px] flex flex-col items-center gap-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" aria-hidden
              style={{ background: "radial-gradient(ellipse at 50% 20%,rgba(167,139,250,0.18) 0%,transparent 70%)" }} />

            <div className="relative z-10">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-50 scale-150"
                style={{ background: "radial-gradient(circle,#a78bfa,transparent)" }} />
              <span className="relative text-7xl animate-trophy block">🏆</span>
            </div>

            <div className="relative z-10">
              <h2 className="font-black text-3xl sm:text-4xl mb-1"
                style={{
                  fontFamily: "var(--font-syne),sans-serif",
                  background: "linear-gradient(135deg,#f0ebff,#c4b5fd)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  filter: "drop-shadow(0 0 18px rgba(167,139,250,0.5))"
                }}>
                Puzzle Solved!
              </h2>
              <p className="text-sm text-slate-400">Brilliant! You crushed it 🎉</p>
            </div>

            <div className="relative z-10 flex gap-3 flex-wrap justify-center">
              <div className="stat-pill flex flex-col items-center px-5 py-3">
                <span className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-syne),sans-serif" }}>{moves}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Moves</span>
              </div>
              <div className="stat-pill flex flex-col items-center px-5 py-3">
                <span className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-syne),sans-serif" }}>{formatTime(time)}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Time</span>
              </div>
            </div>

            {/* Hybrid badge logic */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {optimalMoves !== null && (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
                  Optimal: {optimalMoves} moves
                </div>
              )}
              {/* 3x3: Perfect Solve badge */}
              {gridSize === 3 && optimalMoves !== null && moves <= optimalMoves && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
                  style={{ background: "linear-gradient(135deg,rgba(52,211,153,0.20),rgba(16,185,129,0.12))", border: "1px solid rgba(52,211,153,0.40)", color: "#34d399" }}>
                  🎯 Perfect Solve!
                </div>
              )}
              {/* 4x4 / 5x5: Efficiency Master badge */}
              {(gridSize === 4 || gridSize === 5) && moves <= shuffleLengthRef.current && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
                  style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.20),rgba(217,119,6,0.12))", border: "1px solid rgba(245,158,11,0.40)", color: "#fbbf24" }}>
                  ⚡ Efficiency Master!
                </div>
              )}
            </div>

            <div className="relative z-10 flex gap-2 w-full">
              <button onClick={resetGame}
                className="btn-shimmer flex-1 py-3 rounded-2xl text-sm font-black text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)", boxShadow: "0 8px 32px rgba(124,58,237,0.55)" }}>
                Play Again
              </button>
              <button onClick={onHome}
                className="btn-shimmer py-3 px-4 rounded-2xl text-sm font-bold"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)", color: "#c4b5fd" }}>
                Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
