"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Confetti colours ───────────────────────────────── */
const CONFETTI_COLORS = [
  "#a78bfa","#818cf8","#f472b6","#34d399","#fbbf24","#60a5fa"
];

/* ─── Confetti particle component (pure visual) ──────── */
function ConfettiParticle({color,style}:{color:string;style:React.CSSProperties}){
  return(
    <div
      className="confetti-dot"
      style={{background:color,...style}}
    />
  )
}

export default function Home(){

/* ══════════════════════════════════════════════════════
   ALL STATE BELOW IS UNCHANGED GAME LOGIC
══════════════════════════════════════════════════════ */

const goal=[1,2,3,4,5,6,7,8,0]

const [board,setBoard]=useState(goal)
const [moves,setMoves]=useState(0)
const [time,setTime]=useState(0)
const [running,setRunning]=useState(false)

const [hintTile,setHintTile]=useState<number|null>(null)
const [hintTarget,setHintTarget]=useState<number|null>(null)

const [difficulty,setDifficulty]=useState("medium")

const [isSolved,setIsSolved]=useState(false)
const [autoSolving,setAutoSolving]=useState(false)

const [showHelp,setShowHelp]=useState(false)

/* PWA INSTALL STATE */
const [deferredPrompt,setDeferredPrompt]=useState<any>(null)

/* OFFLINE STATE */
const [isOffline,setIsOffline]=useState(false)

/* ── Visual-only state (not part of game logic) ──────── */
const [bestScore,setBestScore]=useState<number|null>(null)
const [showConfetti,setShowConfetti]=useState(false)
const [flashMoves,setFlashMoves]=useState(false)
const prevMoves=useRef(0)

/* TIMER – unchanged */
useEffect(()=>{
  let timer:NodeJS.Timeout
  if(running){ timer=setInterval(()=>setTime(t=>t+1),1000) }
  return ()=>clearInterval(timer)
},[running])

/* CAPTURE INSTALL EVENT – unchanged */
useEffect(()=>{
  const handler=(e:any)=>{ e.preventDefault(); setDeferredPrompt(e) }
  window.addEventListener("beforeinstallprompt",handler)
  return()=>window.removeEventListener("beforeinstallprompt",handler)
},[])

/* OFFLINE DETECTOR – unchanged */
useEffect(()=>{
  const updateStatus=()=>{ setIsOffline(!navigator.onLine) }
  window.addEventListener("online",updateStatus)
  window.addEventListener("offline",updateStatus)
  updateStatus()
  return()=>{ window.removeEventListener("online",updateStatus); window.removeEventListener("offline",updateStatus) }
},[])

/* Flash moves badge when count changes (visual only) */
useEffect(()=>{
  if(moves!==prevMoves.current){
    prevMoves.current=moves
    setFlashMoves(true)
    const t=setTimeout(()=>setFlashMoves(false),450)
    return()=>clearTimeout(t)
  }
},[moves])

/* Confetti burst on solve (visual only) */
useEffect(()=>{
  if(isSolved){
    setShowConfetti(true)
    const t=setTimeout(()=>setShowConfetti(false),2200)
    return()=>clearTimeout(t)
  }
},[isSolved])

/* ══════════════════════════════════════════════════════
   ALL FUNCTIONS BELOW ARE UNCHANGED GAME LOGIC
══════════════════════════════════════════════════════ */

const installGame=async()=>{
  if(!deferredPrompt) return
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  setDeferredPrompt(null)
}

const toggleHelp=()=>setShowHelp(!showHelp)

const manhattan=(state:number[])=>{
  let dist=0
  state.forEach((tile,index)=>{
    if(tile===0) return
    const gr=Math.floor((tile-1)/3); const gc=(tile-1)%3
    const r=Math.floor(index/3);    const c=index%3
    dist+=Math.abs(gr-r)+Math.abs(gc-c)
  })
  return dist
}

const serialize=(s:number[])=>s.join(",")

const getNeighbors=(state:number[])=>{
  const empty=state.indexOf(0)
  const moves=[empty-1,empty+1,empty-3,empty+3].filter(i=>i>=0&&i<9)
  return moves.map(m=>{ const next=[...state]; next[empty]=next[m]; next[m]=0; return next })
}

const aStarSolve=(start:number[])=>{
  const goalKey=serialize(goal)
  const open=[{state:start,g:0,f:manhattan(start),path:[start]}]
  const visited=new Set()
  while(open.length){
    open.sort((a,b)=>a.f-b.f)
    const current=open.shift()!
    const key=serialize(current.state)
    if(key===goalKey) return current.path
    if(visited.has(key)) continue
    visited.add(key)
    getNeighbors(current.state).forEach(n=>{
      const g=current.g+1; const h=manhattan(n)
      open.push({state:n,g,f:g+h,path:[...current.path,n]})
    })
  }
  return []
}

const moveTile=(index:number)=>{
  if(!running) setRunning(true)
  const empty=board.indexOf(0)
  const row=Math.floor(index/3); const col=index%3
  const er=Math.floor(empty/3);  const ec=empty%3
  const adjacent=(Math.abs(row-er)===1&&col===ec)||(Math.abs(col-ec)===1&&row===er)
  if(adjacent){
    const newBoard=[...board]
    newBoard[empty]=board[index]
    newBoard[index]=0
    setBoard(newBoard)
    setMoves(m=>m+1)
    setHintTile(null)
    setHintTarget(null)
    const solved=newBoard.every((v,i)=>v===goal[i])
    if(solved){
      setIsSolved(true)
      setRunning(false)
      /* visual-only best score update */
      setBestScore(prev=>(prev===null||moves+1<prev)?moves+1:prev)
    }
  }
}

const getValidMoves=(state:number[])=>{
  const empty=state.indexOf(0)
  return [empty-1,empty+1,empty-3,empty+3].filter(i=>i>=0&&i<9)
}

const scramble=(level:string)=>{
  let moves=30
  if(level==="easy") moves=10
  if(level==="medium") moves=30
  if(level==="hard") moves=60
  let temp=[...goal]
  for(let i=0;i<moves;i++){
    const possible=getValidMoves(temp)
    const move=possible[Math.floor(Math.random()*possible.length)]
    const empty=temp.indexOf(0)
    temp[empty]=temp[move]
    temp[move]=0
  }
  setBoard(temp); setMoves(0); setTime(0); setRunning(false); setIsSolved(false)
}

const resetGame=()=>{
  setBoard(goal); setMoves(0); setTime(0); setRunning(false); setIsSolved(false)
}

const solveStep=()=>{
  const empty=board.indexOf(0)
  const moves=[empty-1,empty+1,empty-3,empty+3].filter(i=>i>=0&&i<9)
  let best=null; let score=Infinity
  moves.forEach(m=>{
    const temp=[...board]; temp[empty]=temp[m]; temp[m]=0
    const h=manhattan(temp)
    if(h<score){ score=h; best=m }
  })
  if(best!==null) moveTile(best)
}

const solvePuzzle=async()=>{
  if(autoSolving) return
  setAutoSolving(true)
  const path=aStarSolve(board)
  for(let i=1;i<path.length;i++){
    await new Promise(r=>setTimeout(r,350))
    setBoard(path[i])
  }
  setAutoSolving(false)
}

const getHint=()=>{
  const empty=board.indexOf(0)
  const moves=[empty-1,empty+1,empty-3,empty+3].filter(i=>i>=0&&i<9)
  let best=null; let score=Infinity
  moves.forEach(m=>{
    const temp=[...board]; temp[empty]=temp[m]; temp[m]=0
    const h=manhattan(temp)
    if(h<score){ score=h; best=m }
  })
  setHintTile(best); setHintTarget(empty)
}

/* ─── Format helpers (visual only) ──────────────────── */
const formatTime=(s:number)=>{
  const m=Math.floor(s/60); const sec=s%60
  return m>0?`${m}m ${sec}s`:`${sec}s`
}

/* Difficulty colour accent */
const diffColor = difficulty==="easy" ? "#10b981" : difficulty==="hard" ? "#f43f5e" : "#a78bfa"
const diffDots  = difficulty==="easy" ? 1         : difficulty==="hard" ? 3         : 2

/* ─── Confetti particles (visual only) ──────────────── */
const confettiItems=showConfetti
  ? Array.from({length:22},(_,i)=>({
      id:i,
      color:CONFETTI_COLORS[i%CONFETTI_COLORS.length],
      left:`${8+Math.random()*84}%`,
      top:`${5+Math.random()*40}%`,
      delay:`${Math.random()*0.9}s`,
      size:`${6+Math.floor(Math.random()*6)}px`
    }))
  : []

/* ═══════════════════════════════════════════════════════
   JSX — ALL LOGIC HANDLERS UNCHANGED
═══════════════════════════════════════════════════════ */
return(

<main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden select-none"
  style={{background:"linear-gradient(135deg,#0b0818 0%,#100820 50%,#09060f 100%)"}}>

  {/* ── Dot-Grid Background ───────────────────────────── */}
  <div className="bg-dots" aria-hidden />

  {/* ── Floating Orbs ────────────────────────────────── */}
  <div className="pointer-events-none" aria-hidden>
    <div className="orb orb-1"/>
    <div className="orb orb-2"/>
    <div className="orb orb-3"/>
    <div className="orb orb-4"/>
  </div>

  {/* ── Top-right badges (offline / install) ─────────── */}
  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-20">

    {isOffline&&(
      <div className="animate-fade-in flex items-center gap-2 px-3 py-1.5 rounded-full
        text-xs font-semibold text-amber-300 backdrop-blur-sm"
        style={{background:"rgba(245,158,11,0.13)",border:"1px solid rgba(245,158,11,0.3)",boxShadow:"0 0 18px rgba(245,158,11,0.18)"}}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
        Offline
      </div>
    )}

    {deferredPrompt&&(
      <button onClick={installGame}
        className="btn-shimmer animate-fade-in flex items-center gap-1.5 px-4 py-2 rounded-full
          text-sm font-bold text-white"
        style={{background:"linear-gradient(135deg,#6d28d9,#4f46e5)",boxShadow:"0 4px 20px rgba(109,40,217,0.45)"}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Install
      </button>
    )}

    {/* Help toggle */}
    <button onClick={toggleHelp}
      className="btn-shimmer animate-fade-in flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-xs font-semibold text-slate-300"
      style={{background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.28)"}}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2}/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
      </svg>
      Help
    </button>

  </div>

  {/* ── Main Glass Card ──────────────────────────────── */}
  <div className="glass-card relative z-10 rounded-3xl
    p-6 sm:p-8 w-[93vw] max-w-[420px]
    animate-fade-up flex flex-col items-center gap-5">

    {/* Spinning conic ring (purely decorative) */}
    <div className="card-ring rounded-3xl" aria-hidden/>

    {/* ── Header ──────────────────────────────────── */}
    <div className="text-center w-full animate-fade-up">

      <span className="text-[10px] font-bold tracking-[0.26em] uppercase text-violet-400/70 block mb-0.5">
        Sliding Puzzle
      </span>

      <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-tight leading-none"
        style={{
          fontFamily:"var(--font-outfit),sans-serif",
          background:"linear-gradient(135deg,#f0ebff 0%,#c4b5fd 35%,#818cf8 75%,#60a5fa 100%)",
          WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent",
          backgroundClip:"text",
          filter:"drop-shadow(0 0 28px rgba(167,139,250,0.40))"
        }}>
        8 Puzzle
      </h1>

      <p className="text-[10px] text-slate-600 mt-1 tracking-widest uppercase">
        by Ayush Kumar Singh
      </p>

    </div>

    {/* ── Stat Badges Row ──────────────────────────── */}
    <div className="flex gap-3 flex-wrap justify-center animate-fade-up delay-100">

      {/* Moves */}
      <div className="stat-pill flex items-center gap-2 px-4 py-2">
        <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">Moves</p>
          <p className={`text-base font-black text-slate-100 leading-snug ${flashMoves?"animate-num-flash":""}`}
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            {moves}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div className="stat-pill flex items-center gap-2 px-4 py-2">
        <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2}/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
        </svg>
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">Time</p>
          <p className="text-base font-black text-slate-100 leading-snug"
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            {formatTime(time)}
          </p>
        </div>
      </div>

      {/* Best Score */}
      <div className="stat-pill flex items-center gap-2 px-4 py-2">
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">Best</p>
          <p className="text-base font-black text-slate-100 leading-snug"
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            {bestScore??"-"}
          </p>
        </div>
      </div>

    </div>

    {/* ── Difficulty Selector ──────────────────────── */}
    <div className="flex items-center gap-3 animate-fade-up delay-200 w-full justify-center">

      <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase whitespace-nowrap">
        Difficulty
      </label>

      {/* Custom difficulty pill buttons */}
      <div className="flex gap-1.5">
        {(["easy","medium","hard"] as const).map(d=>(
          <button
            key={d}
            onClick={()=>setDifficulty(d)}
            className="relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-250 capitalize"
            style={{
              background: difficulty===d
                ? `linear-gradient(135deg,${d==="easy"?"#059669,#10b981":d==="hard"?"#e11d48,#f43f5e":"#5b21b6,#7c3aed"})`
                : "rgba(139,92,246,0.08)",
              border: `1px solid ${difficulty===d ? "transparent" : "rgba(139,92,246,0.2)"}`,
              color: difficulty===d ? "#fff" : "#94a3b8",
              boxShadow: difficulty===d
                ? `0 4px 14px ${d==="easy"?"rgba(16,185,129,0.4)":d==="hard"?"rgba(244,63,94,0.4)":"rgba(124,58,237,0.4)"}`
                : "none",
              transform: difficulty===d ? "scale(1.05)" : "scale(1)"
            }}>
            {d}
          </button>
        ))}
      </div>

      <button
        onClick={()=>scramble(difficulty)}
        className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
        style={{
          background:"linear-gradient(135deg,#059669,#10b981)",
          boxShadow:"0 4px 16px rgba(16,185,129,0.40)"
        }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Start
      </button>

    </div>

    {/* ── Puzzle Board ─────────────────────────────── */}
    <div className="puzzle-board animate-fade-up delay-300"
      style={{
        width:"clamp(240px,72vw,300px)",
        height:"clamp(240px,72vw,300px)",
      }}>

      <div className="relative w-full h-full">

        {board.map((tile,index)=>{

          const row=Math.floor(index/3)
          const col=index%3

          /* tile size = (board - 2*padding) / 3 */
          const BOARD_MIN=240; const BOARD_MAX=300
          /* We use CSS custom props via inline for responsive tile sizing */
          const tileSize=`calc((clamp(${BOARD_MIN}px,72vw,${BOARD_MAX}px) - 16px) / 3)`

          const isHintTile = hintTile===index
          const isTarget   = hintTarget===index
          const isEmpty    = tile===0

          return(
            <div
              key={tile}
              onClick={()=>moveTile(index)}
              style={{
                top:`calc(${row} * ((clamp(${BOARD_MIN}px,72vw,${BOARD_MAX}px) - 16px) / 3 + 0px) + ${row}px)`,
                left:`calc(${col} * ((clamp(${BOARD_MIN}px,72vw,${BOARD_MAX}px) - 16px) / 3 + 0px) + ${col}px)`,
                width:tileSize,
                height:tileSize,
              }}
              className={[
                "puzzle-tile",
                isHintTile ? "puzzle-tile-hint" : "",
                isTarget   ? "puzzle-tile-target" : "",
                isEmpty    ? "puzzle-tile-empty" : "",
              ].join(" ")}
            >
              {tile!==0&&(
                <span
                  className="relative z-10 font-black text-white pointer-events-none"
                  style={{
                    fontFamily:"var(--font-outfit),sans-serif",
                    fontSize:"clamp(1.1rem,4.5vw,1.6rem)",
                    textShadow:"0 1px 0 rgba(0,0,0,0.5),0 0 14px rgba(255,255,255,0.22)",
                    letterSpacing:"-0.02em"
                  }}>
                  {tile}
                </span>
              )}
            </div>
          )

        })}

      </div>

    </div>

    {/* ── Action Buttons ───────────────────────────── */}
    <div className="grid grid-cols-2 gap-2 w-full animate-fade-up delay-400">

      {/* Row 1 */}
      <button onClick={resetGame}
        className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{background:"linear-gradient(135deg,#ef4444,#dc2626)",boxShadow:"0 4px 14px rgba(239,68,68,0.35)"}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Reset
      </button>

      <button onClick={getHint}
        className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",boxShadow:"0 4px 14px rgba(245,158,11,0.35)"}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M12 21v-1m-6.364-1.636l.707-.707M3.636 5.636l.707.707M20.364 18.364l-.707-.707m-9.9-9.9a5 5 0 117.07 0l-.548.548A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Hint
      </button>

      {/* Row 2 */}
      <button onClick={solveStep}
        className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",boxShadow:"0 4px 14px rgba(139,92,246,0.35)"}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
        Solve Step
      </button>

      <button onClick={solvePuzzle} disabled={autoSolving}
        className="btn-shimmer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white
          disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background:autoSolving
            ?"linear-gradient(135deg,#3730a3,#312e81)"
            :"linear-gradient(135deg,#6366f1,#4f46e5)",
          boxShadow:autoSolving?"none":"0 4px 14px rgba(99,102,241,0.38)"
        }}>
        {autoSolving?(
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Solving…
          </>
        ):(
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Auto-Solve
          </>
        )}
      </button>

    </div>

    {/* ── Footer caption ───────────────────────────── */}
    <p className="text-[10px] text-slate-700 tracking-widest uppercase animate-fade-up delay-500">
      Tap a tile adjacent to the blank space
    </p>

  </div>{/* /glass-card */}


  {/* ══════════════════════════════════════════════════
      VICTORY MODAL
  ══════════════════════════════════════════════════ */}
  {isSolved&&(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(5,2,16,0.82)",backdropFilter:"blur(20px)"}}>

      {/* Confetti particles */}
      {confettiItems.map(p=>(
        <ConfettiParticle key={p.id} color={p.color}
          style={{
            left:p.left, top:p.top,
            width:p.size, height:p.size,
            animationDelay:p.delay,
            animationDuration:"1.5s"
          }}/>
      ))}

      <div className="victory-card animate-celebrate rounded-[2rem] p-8 text-center
        w-[300px] sm:w-[360px] flex flex-col items-center gap-5 relative overflow-hidden">

        {/* Subtle radial glow behind trophy */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden
          style={{background:"radial-gradient(ellipse at 50% 20%,rgba(167,139,250,0.18) 0%,transparent 70%)"}}/>

        {/* Trophy */}
        <div className="relative z-10">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-50 scale-150"
            style={{background:"radial-gradient(circle,#a78bfa,transparent)"}}/>
          <span className="relative text-7xl animate-trophy block">🏆</span>
        </div>

        {/* Heading */}
        <div className="relative z-10">
          <h2 className="font-black text-3xl sm:text-4xl mb-1"
            style={{
              fontFamily:"var(--font-outfit),sans-serif",
              background:"linear-gradient(135deg,#f0ebff,#c4b5fd)",
              WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent",
              backgroundClip:"text",
              filter:"drop-shadow(0 0 18px rgba(167,139,250,0.5))"
            }}>
            Puzzle Solved!
          </h2>
          <p className="text-sm text-slate-400">Brilliant! You crushed it 🎉</p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-3 flex-wrap justify-center">

          <div className="stat-pill flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-black text-white" style={{fontFamily:"var(--font-outfit),sans-serif"}}>{moves}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Moves</span>
          </div>

          <div className="stat-pill flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-black text-white" style={{fontFamily:"var(--font-outfit),sans-serif"}}>{formatTime(time)}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Time</span>
          </div>

          {bestScore!==null&&(
            <div className="stat-pill flex flex-col items-center px-5 py-3"
              style={{borderColor:"rgba(245,158,11,0.4)",background:"rgba(245,158,11,0.08)"}}>
              <span className="text-2xl font-black text-amber-300" style={{fontFamily:"var(--font-outfit),sans-serif"}}>{bestScore}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Best</span>
            </div>
          )}

        </div>

        {/* Play Again */}
        <button
          onClick={resetGame}
          className="btn-shimmer relative z-10 w-full py-3 rounded-2xl text-base font-black text-white"
          style={{
            background:"linear-gradient(135deg,#7c3aed,#6366f1)",
            boxShadow:"0 8px 32px rgba(124,58,237,0.55)"
          }}>
          Play Again
        </button>

      </div>

    </div>
  )}


  {/* ══════════════════════════════════════════════════
      HELP MODAL
  ══════════════════════════════════════════════════ */}
  {showHelp&&(
    <div className="help-backdrop" onClick={toggleHelp}>

      <div className="glass-card rounded-3xl p-7 w-[300px] sm:w-[360px]
        animate-scale-in flex flex-col gap-4"
        onClick={e=>e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-100"
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            How to Play
          </h3>
          <button onClick={toggleHelp}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400
              hover:text-white hover:bg-white/10 transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-400 leading-relaxed">

          {[
            {icon:"🖱️", text:"Click any tile next to the empty space to slide it in."},
            {icon:"💡", text:"Hint highlights the best tile to move next."},
            {icon:"⏩", text:"Solve Step moves one optimal step toward the solution."},
            {icon:"⚡", text:"Auto-Solve uses A* search to solve the puzzle instantly."},
            {icon:"🎯", text:"Goal: arrange tiles 1–8 in order, blank at bottom-right."},
          ].map((item,i)=>(
            <div key={i} className="flex items-start gap-3">
              <span className="text-base leading-none mt-0.5">{item.icon}</span>
              <p>{item.text}</p>
            </div>
          ))}

        </div>

        <div className="flex gap-2 pt-1">
          {(["easy","medium","hard"] as const).map(d=>(
            <div key={d} className="flex-1 py-2 rounded-xl text-center text-xs font-bold capitalize"
              style={{
                background:d==="easy"
                  ?"rgba(16,185,129,0.14)"
                  :d==="hard"
                  ?"rgba(244,63,94,0.14)"
                  :"rgba(139,92,246,0.14)",
                color:d==="easy"?"#34d399":d==="hard"?"#fb7185":"#a78bfa",
                border:`1px solid ${d==="easy"?"rgba(16,185,129,0.25)":d==="hard"?"rgba(244,63,94,0.25)":"rgba(139,92,246,0.25)"}`
              }}>
              {d}
              <div className="text-[9px] opacity-60 mt-0.5">
                {d==="easy"?"10 moves":d==="hard"?"60 moves":"30 moves"}
              </div>
            </div>
          ))}
        </div>

        <button onClick={toggleHelp}
          className="btn-shimmer py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 4px 18px rgba(124,58,237,0.4)"}}>
          Got it!
        </button>

      </div>

    </div>
  )}

</main>

)

}