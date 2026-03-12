"use client";
import { useState, useEffect } from "react";

export default function Home(){

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


/* TIMER */
useEffect(()=>{

let timer:NodeJS.Timeout

if(running){
timer=setInterval(()=>setTime(t=>t+1),1000)
}

return ()=>clearInterval(timer)

},[running])


/* CAPTURE INSTALL EVENT */
useEffect(()=>{

const handler=(e:any)=>{
e.preventDefault()
setDeferredPrompt(e)
}

window.addEventListener("beforeinstallprompt",handler)

return()=>window.removeEventListener("beforeinstallprompt",handler)

},[])


/* OFFLINE DETECTOR */
useEffect(()=>{

const updateStatus=()=>{
setIsOffline(!navigator.onLine)
}

window.addEventListener("online",updateStatus)
window.addEventListener("offline",updateStatus)

updateStatus()

return()=>{
window.removeEventListener("online",updateStatus)
window.removeEventListener("offline",updateStatus)
}

},[])


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

const gr=Math.floor((tile-1)/3)
const gc=(tile-1)%3

const r=Math.floor(index/3)
const c=index%3

dist+=Math.abs(gr-r)+Math.abs(gc-c)

})

return dist
}

const serialize=(s:number[])=>s.join(",")

const getNeighbors=(state:number[])=>{

const empty=state.indexOf(0)

const moves=[empty-1,empty+1,empty-3,empty+3]
.filter(i=>i>=0 && i<9)

return moves.map(m=>{

const next=[...state]

next[empty]=next[m]
next[m]=0

return next

})

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

const g=current.g+1
const h=manhattan(n)

open.push({
state:n,
g,
f:g+h,
path:[...current.path,n]
})

})

}

return []
}

const moveTile=(index:number)=>{

if(!running) setRunning(true)

const empty=board.indexOf(0)

const row=Math.floor(index/3)
const col=index%3

const er=Math.floor(empty/3)
const ec=empty%3

const adjacent=
(Math.abs(row-er)===1 && col===ec) ||
(Math.abs(col-ec)===1 && row===er)

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
}

}

}

const getValidMoves=(state:number[])=>{

const empty=state.indexOf(0)

return [empty-1,empty+1,empty-3,empty+3]
.filter(i=>i>=0 && i<9)

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

setBoard(temp)
setMoves(0)
setTime(0)
setRunning(false)
setIsSolved(false)

}

const resetGame=()=>{
setBoard(goal)
setMoves(0)
setTime(0)
setRunning(false)
setIsSolved(false)
}

const solveStep=()=>{

const empty=board.indexOf(0)

const moves=[empty-1,empty+1,empty-3,empty+3]
.filter(i=>i>=0 && i<9)

let best=null
let score=Infinity

moves.forEach(m=>{

const temp=[...board]

temp[empty]=temp[m]
temp[m]=0

const h=manhattan(temp)

if(h<score){
score=h
best=m
}

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

const moves=[empty-1,empty+1,empty-3,empty+3]
.filter(i=>i>=0 && i<9)

let best=null
let score=Infinity

moves.forEach(m=>{

const temp=[...board]

temp[empty]=temp[m]
temp[m]=0

const h=manhattan(temp)

if(h<score){
score=h
best=m
}

})

setHintTile(best)
setHintTarget(empty)

}

/* ─── format time ─────────────────── */
const formatTime=(s:number)=>{
const m=Math.floor(s/60)
const sec=s%60
return m>0?`${m}m ${sec}s`:`${sec}s`
}

return(

<main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
  style={{background:"linear-gradient(135deg,#0d0d1a 0%,#10091f 50%,#0a0a1a 100%)"}}>

  {/* ── Animated Background Orbs ─────────────────────────────── */}
  <div className="pointer-events-none select-none" aria-hidden>
    <div className="orb orb-1" />
    <div className="orb orb-2" />
    <div className="orb orb-3" />
  </div>

  {/* ── Top Status Bar (Offline / Install) ───────────────────── */}
  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-20">

    {isOffline && (
      <div className="animate-fade-in flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
        bg-amber-500/15 border border-amber-400/30 text-amber-300 backdrop-blur-sm"
        style={{boxShadow:"0 0 16px rgba(245,158,11,0.2)"}}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Offline Mode
      </div>
    )}

    {deferredPrompt && (
      <button onClick={installGame}
        className="btn-shimmer animate-fade-in flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
          text-white transition-all duration-300 active:scale-95"
        style={{background:"linear-gradient(135deg,#6d28d9,#4f46e5)",
          boxShadow:"0 4px 20px rgba(109,40,217,0.4)"}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Install App
      </button>
    )}

  </div>

  {/* ── Main Glass Card ──────────────────────────────────────── */}
  <div className="glass-card relative z-10 rounded-3xl p-7 sm:p-9 w-[340px] sm:w-[400px]
    animate-fade-up flex flex-col items-center gap-6">

    {/* ── Header ─────────────────────────────────── */}
    <div className="text-center animate-fade-up">

      {/* Glow ring behind title */}
      <div className="relative inline-block mb-1">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{background:"radial-gradient(circle,#7c3aed,transparent)"}} />
        <span className="relative text-[11px] font-semibold tracking-[0.22em] uppercase
          text-violet-400 opacity-80">
          Sliding Puzzle
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight animate-fade-up delay-100"
        style={{
          fontFamily:"var(--font-outfit),sans-serif",
          background:"linear-gradient(135deg,#e2d9f3 0%,#a78bfa 40%,#818cf8 100%)",
          WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent",
          backgroundClip:"text",
          filter:"drop-shadow(0 0 24px rgba(167,139,250,0.35))"
        }}>
        8 Puzzle
      </h1>

      <p className="text-[11px] text-slate-500 mt-1 tracking-widest uppercase animate-fade-up delay-200">
        by Ayush Kumar Singh
      </p>

    </div>

    {/* ── Stats Row ──────────────────────────────── */}
    <div className="flex gap-4 animate-fade-up delay-200">

      <div className="stat-pill flex items-center gap-2.5 px-4 py-2">
        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Moves</span>
          <span className="text-lg font-bold text-slate-100 leading-none"
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            {moves}
          </span>
        </div>
      </div>

      <div className="stat-pill flex items-center gap-2.5 px-4 py-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2}/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
        </svg>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Time</span>
          <span className="text-lg font-bold text-slate-100 leading-none"
            style={{fontFamily:"var(--font-outfit),sans-serif"}}>
            {formatTime(time)}
          </span>
        </div>
      </div>

    </div>

    {/* ── Difficulty + Start ─────────────────────── */}
    <div className="flex items-center gap-3 animate-fade-up delay-300">

      <label className="text-xs font-semibold text-slate-400 tracking-widest uppercase whitespace-nowrap">
        Difficulty
      </label>

      <div className="relative">
        <select
          value={difficulty}
          onChange={(e)=>setDifficulty(e.target.value)}
          className="appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-xl text-sm font-semibold
            text-slate-200 transition-all duration-200 outline-none"
          style={{
            background:"rgba(139,92,246,0.12)",
            border:"1px solid rgba(139,92,246,0.3)",
            boxShadow:"0 0 12px rgba(139,92,246,0.15)"
          }}>
          <option value="easy"  style={{background:"#1a1235"}}>Easy</option>
          <option value="medium"style={{background:"#1a1235"}}>Medium</option>
          <option value="hard"  style={{background:"#1a1235"}}>Hard</option>
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      <button
        onClick={()=>scramble(difficulty)}
        className="btn-shimmer flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold
          text-white transition-all duration-200 active:scale-95"
        style={{
          background:"linear-gradient(135deg,#10b981,#059669)",
          boxShadow:"0 4px 16px rgba(16,185,129,0.35)"
        }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Start
      </button>

    </div>

    {/* ── Puzzle Board ───────────────────────────── */}
    <div className="puzzle-board relative animate-fade-up delay-300"
      style={{width:"276px",height:"276px",padding:"6px"}}>

      <div className="relative" style={{width:"264px",height:"264px"}}>

        {board.map((tile,index)=>{

          const row=Math.floor(index/3)
          const col=index%3

          const isHintTile = hintTile===index
          const isTarget   = hintTarget===index
          const isEmpty    = tile===0

          return(

            <div
              key={tile}
              onClick={()=>moveTile(index)}
              style={{
                top:`${row*88}px`,
                left:`${col*88}px`,
                width:"80px",
                height:"80px"
              }}
              className={[
                "puzzle-tile",
                "flex items-center justify-center",
                "rounded-2xl cursor-pointer select-none",
                isHintTile  ? "puzzle-tile-hint"   : "",
                isTarget    ? "puzzle-tile-target"  : "",
                isEmpty     ? "puzzle-tile-empty"   : "",
              ].join(" ")}
            >

              {tile!==0 && (
                <span className="text-2xl font-black text-white select-none"
                  style={{
                    fontFamily:"var(--font-outfit),sans-serif",
                    textShadow:"0 1px 0 rgba(0,0,0,0.4), 0 0 12px rgba(255,255,255,0.2)",
                    filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                  }}>
                  {tile}
                </span>
              )}

            </div>

          )

        })}

      </div>

    </div>

    {/* ── Action Buttons ─────────────────────────── */}
    <div className="flex flex-wrap gap-2.5 justify-center animate-fade-up delay-400">

      {/* Reset */}
      <button onClick={resetGame}
        className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
          text-white transition-all duration-200 active:scale-95"
        style={{
          background:"linear-gradient(135deg,#ef4444,#dc2626)",
          boxShadow:"0 4px 14px rgba(239,68,68,0.3)"
        }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Reset
      </button>

      {/* Hint */}
      <button onClick={getHint}
        className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
          text-white transition-all duration-200 active:scale-95"
        style={{
          background:"linear-gradient(135deg,#f59e0b,#d97706)",
          boxShadow:"0 4px 14px rgba(245,158,11,0.3)"
        }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Hint
      </button>

      {/* Solve Step */}
      <button onClick={solveStep}
        className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
          text-white transition-all duration-200 active:scale-95"
        style={{
          background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",
          boxShadow:"0 4px 14px rgba(139,92,246,0.3)"
        }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5l7 7-7 7"/>
        </svg>
        Step
      </button>

      {/* Solve Puzzle */}
      <button onClick={solvePuzzle} disabled={autoSolving}
        className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
          text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background:autoSolving
            ?"linear-gradient(135deg,#4338ca,#3730a3)"
            :"linear-gradient(135deg,#6366f1,#4f46e5)",
          boxShadow:autoSolving
            ?"none"
            :"0 4px 14px rgba(99,102,241,0.35)"
        }}>
        {autoSolving ? (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Auto-Solve
          </>
        )}
      </button>

    </div>

    {/* ── Footer hint text ───────────────────────── */}
    <p className="text-[11px] text-slate-600 tracking-wide animate-fade-up delay-400">
      Click a tile adjacent to the blank space to move it
    </p>

  </div>{/* end glass card */}


  {/* ── Victory Modal ────────────────────────────────────────── */}
  {isSolved && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(5,3,18,0.8)",backdropFilter:"blur(18px)"}}>

      <div className="victory-card animate-celebrate rounded-3xl p-8 text-center w-[310px] sm:w-[360px]
        flex flex-col items-center gap-5">

        {/* Trophy icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-60"
            style={{background:"radial-gradient(circle,#a78bfa 0%,transparent 70%)",transform:"scale(1.5)"}} />
          <div className="relative text-6xl animate-celebrate delay-100">🏆</div>
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-3xl font-black mb-1"
            style={{
              fontFamily:"var(--font-outfit),sans-serif",
              background:"linear-gradient(135deg,#e2d9f3,#a78bfa)",
              WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent",
              backgroundClip:"text"
            }}>
            Puzzle Solved!
          </h2>
          <p className="text-sm text-slate-400">Magnificent! You did it 🎉</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">

          <div className="stat-pill flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-black text-white"
              style={{fontFamily:"var(--font-outfit),sans-serif"}}>{moves}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Moves</span>
          </div>

          <div className="stat-pill flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-black text-white"
              style={{fontFamily:"var(--font-outfit),sans-serif"}}>{formatTime(time)}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Time</span>
          </div>

        </div>

        {/* Play Again */}
        <button
          onClick={resetGame}
          className="btn-shimmer w-full py-3 rounded-2xl text-base font-bold text-white
            transition-all duration-200 active:scale-95"
          style={{
            background:"linear-gradient(135deg,#7c3aed,#6366f1)",
            boxShadow:"0 6px 28px rgba(124,58,237,0.5)"
          }}>
          Play Again
        </button>

      </div>

    </div>
  )}

</main>

)

}