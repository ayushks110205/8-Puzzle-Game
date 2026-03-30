/// <reference lib="webworker" />
// puzzle-solver.worker.ts
// Fully self-contained IDA* solver (no imports from page.tsx)
// Receives : { board: number[]; gridSize: number }
// Posts    : { solution: number[][] }

/* ── Heuristic: Manhattan Distance + Linear Conflict ──── */
function heuristic(state: number[], gs: number): number {
  let h = 0;
  const tc = gs * gs;

  // Manhattan Distance
  for (let i = 0; i < tc; i++) {
    const tile = state[i];
    if (tile === 0) continue;
    const gi = tile - 1;
    const gr = Math.floor(gi / gs), gc = gi % gs;
    const cr = Math.floor(i / gs),  cc = i % gs;
    h += Math.abs(cr - gr) + Math.abs(cc - gc);
  }

  // Linear Conflict — rows
  for (let r = 0; r < gs; r++) {
    const inRow: number[] = []; // goal-col of each tile currently in row r
    for (let c = 0; c < gs; c++) {
      const tile = state[r * gs + c];
      if (tile === 0) continue;
      const gi = tile - 1;
      if (Math.floor(gi / gs) === r) inRow.push(gi % gs);
    }
    for (let i = 0; i < inRow.length - 1; i++)
      for (let j = i + 1; j < inRow.length; j++)
        if (inRow[i] > inRow[j]) h += 2;
  }

  // Linear Conflict — columns
  for (let c = 0; c < gs; c++) {
    const inCol: number[] = []; // goal-row of each tile currently in col c
    for (let r = 0; r < gs; r++) {
      const tile = state[r * gs + c];
      if (tile === 0) continue;
      const gi = tile - 1;
      if (gi % gs === c) inCol.push(Math.floor(gi / gs));
    }
    for (let i = 0; i < inCol.length - 1; i++)
      for (let j = i + 1; j < inCol.length; j++)
        if (inCol[i] > inCol[j]) h += 2;
  }

  return h;
}

/* ── Neighbour generation ──────────────────────────────── */
function getNeighbours(state: number[], gs: number): number[][] {
  const empty = state.indexOf(0);
  const er = Math.floor(empty / gs), ec = empty % gs;
  const result: number[][] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
  for (const [dr, dc] of dirs) {
    const nr = er + dr, nc = ec + dc;
    if (nr < 0 || nr >= gs || nc < 0 || nc >= gs) continue;
    const ni = nr * gs + nc;
    const next = state.slice();
    next[empty] = next[ni]; next[ni] = 0;
    result.push(next);
  }
  return result;
}

/* ── IDA* ─────────────────────────────────────────────── */
const TIME_CAP_MS = 4000;
let startTime = 0;
let bestPath: number[][] = [];
let bestDepth = 0;

function search(
  path: number[][],
  g: number,
  threshold: number,
  gs: number,
  prevKey: string
): number {
  const state = path[path.length - 1];
  const h = heuristic(state, gs);
  const f = g + h;

  // Track deepest node reached for partial-path fallback
  if (g > bestDepth) {
    bestDepth = g;
    bestPath = path.slice();
  }

  if (f > threshold) return f;
  if (h === 0) return -1; // goal found
  if (Date.now() - startTime > TIME_CAP_MS) return Infinity;

  let min = Infinity;
  for (const next of getNeighbours(state, gs)) {
    const key = next.join(",");
    if (key === prevKey) continue; // don't undo last move
    path.push(next);
    const t = search(path, g + 1, threshold, gs, state.join(","));
    if (t === -1) return -1;
    if (t < min) min = t;
    path.pop();
  }
  return min;
}

function idaStar(start: number[], gs: number): number[][] {
  startTime = Date.now();
  bestPath = [start];
  bestDepth = 0;

  const path: number[][] = [start];
  let threshold = heuristic(start, gs);

  while (true) {
    const t = search(path, 0, threshold, gs, "");
    if (t === -1) return path.slice();                          // found!
    if (t === Infinity || Date.now() - startTime > TIME_CAP_MS) {
      return bestPath.length > 1 ? bestPath : [start];         // time cap
    }
    threshold = t;
  }
}

/* ── Message handler ──────────────────────────────────── */
self.onmessage = (e: MessageEvent) => {
  const { board, gridSize } = e.data as { board: number[]; gridSize: number };
  try {
    const solution = idaStar(board, gridSize);
    (self as DedicatedWorkerGlobalScope).postMessage({ solution });
  } catch {
    (self as DedicatedWorkerGlobalScope).postMessage({ solution: [] });
  }
};
