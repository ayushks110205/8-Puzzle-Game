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

return(

<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-black text-white">

<div className="text-center mb-4">

<h1 className="text-4xl font-bold">
8 Puzzle Game
</h1>

<p className="text-gray-400 text-sm mt-1">
by Ayush Kumar Singh
</p>

</div>


{/* OFFLINE NOTICE */}
{isOffline && (
<div className="mb-4 px-4 py-2 bg-yellow-600 text-black rounded">
Offline Mode – Game still playable
</div>
)}


{/* INSTALL BUTTON */}
{deferredPrompt && (
<button
onClick={installGame}
className="mb-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
>
Install Game
</button>
)}


{/* Victory Modal */}
{isSolved && (
<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">

<div className="bg-slate-900 p-8 rounded-xl text-center border border-slate-700 shadow-2xl w-[320px]">

<h2 className="text-2xl font-bold mb-3 text-green-400">
🎉 Puzzle Solved!
</h2>

<p className="mb-2">Moves: {moves}</p>
<p className="mb-4">Time: {time}s</p>

<button
onClick={resetGame}
className="px-5 py-2 bg-green-500 rounded hover:bg-green-600"
>
Play Again
</button>

</div>

</div>
)}

{/* REST OF YOUR UI (UNCHANGED) */}

<div className="flex gap-6 mb-4">
<p>Moves: {moves}</p>
<p>Time: {time}s</p>
</div>

{/* controls */}

<div className="mb-6 flex items-center gap-3">

<label>Difficulty:</label>

<select
value={difficulty}
onChange={(e)=>setDifficulty(e.target.value)}
className="bg-slate-800 px-3 py-2 rounded border border-slate-600"
>
<option value="easy">Easy</option>
<option value="medium">Medium</option>
<option value="hard">Hard</option>
</select>

<button
onClick={()=>scramble(difficulty)}
className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
>
Start
</button>

</div>

<div className="flex gap-3 mb-6 flex-wrap justify-center">

<button onClick={resetGame}
className="px-4 py-2 bg-red-500 rounded hover:bg-red-600">
Reset
</button>

<button onClick={getHint}
className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600">
Hint
</button>

<button onClick={solveStep}
className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600">
Solve Step
</button>

<button onClick={solvePuzzle}
className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-600">
Solve Puzzle
</button>

</div>

<div className="relative w-[264px] h-[264px] backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl">

{board.map((tile,index)=>{

const row=Math.floor(index/3)
const col=index%3

return(

<div
key={tile}
onClick={()=>moveTile(index)}
style={{
top:`${row*88}px`,
left:`${col*88}px`
}}
className={`absolute w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-lg cursor-pointer
transition-all duration-500 ease-in-out transform hover:scale-105
${
hintTile===index
? "bg-yellow-400 text-black"
: hintTarget===index
? "bg-green-400 text-black"
: "bg-blue-500 text-white hover:bg-blue-600"
}`}
>
{tile!==0 ? tile : ""}
</div>

)

})}

</div>

</main>

)

}