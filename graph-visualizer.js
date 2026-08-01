/* ═══════════════════════════════════════════════
   GraphAlgo · graph-visualizer.js  v3
   Glassmorphism edition — full rewrite
   Clear step-by-step UX, speed control, progress
═══════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────
   CANVAS FIT  — reads CSS size, sets resolution
──────────────────────────────────────────────*/
function fitCanvas(c) {
  const W = Math.max(c.offsetWidth  || 0, c.getBoundingClientRect().width  | 0, 300);
  const H = Math.max(c.offsetHeight || 0, c.getBoundingClientRect().height | 0, 260);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  return { W, H };
}

/* ────────────────────────────────────────────
   SCALE NODES to canvas bounds with padding
──────────────────────────────────────────────*/
function scale(nodes, W, H, pad) {
  pad = pad || 42;
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rx = x1 - x0 || 1, ry = y1 - y0 || 1;
  return nodes.map(n => ({
    ...n,
    x: pad + ((n.x - x0) / rx) * (W - pad * 2),
    y: pad + ((n.y - y0) / ry) * (H - pad * 2),
  }));
}

/* ────────────────────────────────────────────
   GRAPH DATA
──────────────────────────────────────────────*/
const NODES = [
  { id:0, label:'A', x:200, y: 30 },
  { id:1, label:'B', x: 80, y:120 },
  { id:2, label:'C', x:320, y:120 },
  { id:3, label:'D', x: 20, y:240 },
  { id:4, label:'E', x:155, y:235 },
  { id:5, label:'F', x:270, y:235 },
  { id:6, label:'G', x:375, y:240 },
];
const EDGES = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,5]];

function adj() {
  const a = {};
  NODES.forEach(n => a[n.id] = []);
  EDGES.forEach(([x,y]) => { a[x].push(y); a[y].push(x); });
  return a;
}

/* DIJKSTRA GRAPH */
const DJ_NODES = [
  { id:0, label:'S', x: 30, y:145 },
  { id:1, label:'A', x:140, y: 45 },
  { id:2, label:'B', x:140, y:245 },
  { id:3, label:'C', x:265, y: 45 },
  { id:4, label:'D', x:265, y:245 },
  { id:5, label:'T', x:375, y:145 },
];
const DJ_EDGES = [
  {a:0,b:1,w:4},{a:0,b:2,w:2},{a:1,b:3,w:5},
  {a:2,b:4,w:3},{a:2,b:1,w:1},{a:3,b:5,w:2},
  {a:4,b:3,w:1},{a:4,b:5,w:6},
];

/* ────────────────────────────────────────────
   DRAWING ENGINE
──────────────────────────────────────────────*/
const R = 18; // node radius

function draw(canvas, nodes, edges, state, isDijkstra) {
  const { W, H } = fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const sn  = scale(nodes, W, H, isDijkstra ? 48 : 42);
  ctx.clearRect(0, 0, W, H);

  /* — edges — */
  edges.forEach(e => {
    const ai = e.a !== undefined ? e.a : e[0];
    const bi = e.b !== undefined ? e.b : e[1];
    const na = sn[ai], nb = sn[bi];
    if (!na || !nb) return;

    const k1 = `${ai}-${bi}`, k2 = `${bi}-${ai}`;
    const isPath    = state.pathEdges  && (state.pathEdges.has(k1)    || state.pathEdges.has(k2));
    const isRelaxed = state.relaxedEdges && (state.relaxedEdges.has(k1) || state.relaxedEdges.has(k2));

    /* draw edge line */
    ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
    if      (isPath)    { ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3.5; }
    else if (isRelaxed) { ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; }
    else                { ctx.strokeStyle = 'rgba(139,92,246,0.18)'; ctx.lineWidth = 1.5; }
    ctx.stroke();

    /* weight label */
    if (isDijkstra && e.w != null) {
      const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
      const dx = nb.y - na.y, dy = na.x - nb.x;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const ox = dx/len * 11, oy = dy/len * 11;
      ctx.font = 'bold 11px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isPath ? '#059669' : isRelaxed ? '#0891b2' : 'rgba(107,114,128,0.65)';
      ctx.fillText(e.w, mx + ox, my + oy);
    }
  });

  /* — nodes — */
  sn.forEach(n => {
    const visited = state.visited  && state.visited.has(n.id);
    const current = state.current  === n.id;
    const queued  = state.queued   && state.queued.has(n.id) && !current && !visited;
    const onPath  = state.path     && state.path.includes(n.id);

    /* colours — light theme */
    let bg = 'rgba(235,233,255,0.92)', border = 'rgba(139,92,246,0.30)', glow = null;
    if      (onPath)   { bg = 'rgba(209,250,229,0.95)'; border = '#10b981'; glow = '#10b981'; }
    else if (current)  { bg = 'rgba(237,233,254,0.97)'; border = '#8b5cf6'; glow = '#8b5cf6'; }
    else if (visited)  { bg = 'rgba(209,250,229,0.80)'; border = '#10b981'; }
    else if (queued)   { bg = 'rgba(219,234,254,0.90)'; border = '#6366f1'; }

    /* glow ring */
    if (glow) {
      ctx.beginPath(); ctx.arc(n.x, n.y, R + 9, 0, Math.PI*2);
      ctx.fillStyle = glow + '22'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, R + 5, 0, Math.PI*2);
      ctx.fillStyle = glow + '15'; ctx.fill();
    }

    /* node body */
    ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = current ? 2.5 : 1.8; ctx.stroke();

    /* label — dark text on light nodes */
    ctx.fillStyle = onPath ? '#065f46' : current ? '#4c1d95' : '#1e1b4b';
    ctx.font = `bold ${R-3}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.label, n.x, n.y);

    /* distance below (Dijkstra) */
    if (isDijkstra && state.dist) {
      const d = state.dist[n.id];
      const ds = d >= 1e8 ? '∞' : String(d);
      ctx.fillStyle = onPath ? '#059669' : current ? '#7c3aed' : 'rgba(107,114,128,0.75)';
      ctx.font = `bold 10px Inter,sans-serif`;
      ctx.fillText(ds, n.x, n.y + R + 10);
    }
  });
}

/* ────────────────────────────────────────────
   BFS STEPS
──────────────────────────────────────────────*/
function bfsSteps() {
  const a = adj(), steps = [];
  const visited = new Set([0]), queue = [0], order = [];

  const snap = (lbl, icon) => steps.push({
    label: lbl, icon: icon || 'ℹ️',
    drawState: { visited: new Set(visited), queued: new Set(queue), current: order.length ? order[order.length-1] : -1 },
    queue: [...queue], order: [...order],
  });

  snap('Enqueue start node A, mark visited', '🟦');
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    snap(`Dequeue ${NODES[u].label} — now processing`, '▶️');
    for (const v of a[u]) {
      if (!visited.has(v)) {
        visited.add(v); queue.push(v);
        snap(`Neighbour ${NODES[v].label} unvisited — enqueue it`, '➕');
      } else {
        snap(`Neighbour ${NODES[v].label} already visited — skip`, '⏭️');
      }
    }
  }
  steps.push({
    label: '✅ BFS complete! All reachable nodes visited.', icon: '✅',
    drawState: { visited: new Set(visited), queued: new Set(), current: -1 },
    queue: [], order: [...order],
  });
  return steps;
}

/* ────────────────────────────────────────────
   DFS STEPS (iterative)
──────────────────────────────────────────────*/
function dfsSteps() {
  const a = adj(), steps = [];
  const visited = new Set(), stack = [0], order = [];

  const snap = (lbl, icon) => steps.push({
    label: lbl, icon: icon || 'ℹ️',
    drawState: { visited: new Set(visited), queued: new Set(stack), current: order.length ? order[order.length-1] : -1 },
    stack: [...stack], order: [...order],
  });

  snap('Push start node A onto stack', '📥');
  while (stack.length) {
    const u = stack[stack.length - 1];
    if (!visited.has(u)) {
      visited.add(u); order.push(u);
      snap(`Visit ${NODES[u].label} — mark as visited`, '✔️');
      const nbrs = [...a[u]].reverse();
      for (const v of nbrs) {
        if (!visited.has(v)) {
          stack.push(v);
          snap(`Push unvisited neighbour ${NODES[v].label}`, '📥');
        }
      }
    } else {
      stack.pop();
      if (stack.length) snap(`Backtrack from ${NODES[u].label} — pop stack`, '↩️');
    }
  }
  steps.push({
    label: '✅ DFS complete! All reachable nodes visited.', icon: '✅',
    drawState: { visited: new Set(visited), queued: new Set(), current: -1 },
    stack: [], order: [...order],
  });
  return steps;
}

/* ────────────────────────────────────────────
   DIJKSTRA STEPS
──────────────────────────────────────────────*/
function dijkstraSteps() {
  const INF = 1e9, n = DJ_NODES.length;
  const dist = Array(n).fill(INF), prev = Array(n).fill(-1);
  const visited = new Set(), relaxed = new Set(), steps = [];
  dist[0] = 0;
  const pq = [{node:0,d:0}];

  const snap = (lbl, icon, cur=-1) => steps.push({
    label: lbl, icon: icon || 'ℹ️',
    drawState: { visited: new Set(visited), current: cur, relaxedEdges: new Set(relaxed), dist: [...dist] },
    pq: pq.map(x=>({...x})), dist: [...dist],
  });

  snap('Initialise: dist[S]=0, all others=∞', '🔢');

  while (pq.length) {
    pq.sort((a,b) => a.d - b.d);
    const {node:u, d:ud} = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    snap(`Extract min: node ${DJ_NODES[u].label} (dist=${ud>=INF?'∞':ud})`, '🔍', u);

    for (const e of DJ_EDGES) {
      let v=-1, w=0;
      if      (e.a===u) { v=e.b; w=e.w; }
      else if (e.b===u) { v=e.a; w=e.w; }
      else continue;
      if (visited.has(v)) continue;
      const nd = dist[u]+w;
      if (nd < dist[v]) {
        dist[v]=nd; prev[v]=u;
        relaxed.add(`${u}-${v}`); relaxed.add(`${v}-${u}`);
        pq.push({node:v,d:nd});
        snap(`Relax ${DJ_NODES[u].label}→${DJ_NODES[v].label}: dist[${DJ_NODES[v].label}] = ${nd}`, '⚡', u);
      } else {
        snap(`${DJ_NODES[u].label}→${DJ_NODES[v].label}: no improvement (${dist[v]} ≤ ${nd})`, '✗', u);
      }
    }
  }

  /* reconstruct path */
  const path=[], pathEdges=new Set();
  let c=n-1;
  while(c!==-1){ path.unshift(c); const p=prev[c]; if(p!==-1){pathEdges.add(`${p}-${c}`);pathEdges.add(`${c}-${p}`);} c=p; }

  const cost = dist[n-1]>=INF ? '∞' : dist[n-1];
  steps.push({
    label: `✅ Shortest path S→T found! Total cost = ${cost}`, icon: '🏁',
    drawState: { visited, current:-1, relaxedEdges:new Set(relaxed), dist:[...dist], path, pathEdges },
    pq:[], dist:[...dist],
  });
  return steps;
}

/* ────────────────────────────────────────────
   CONTROLLER
──────────────────────────────────────────────*/
function makeViz(cfg) {
  /* cfg: { canvasId, nodes, edges, isDijkstra, buildSteps,
            btnPlayId, btnStepId, btnResetId, btnSpeedId,
            statusDotId, actionTextId, progressFillId, progressTextId,
            dataUpdate(step|null) } */
  const canvas = document.getElementById(cfg.canvasId);
  if (!canvas) return;

  const btnPlay  = document.getElementById(cfg.btnPlayId);
  const btnStep  = document.getElementById(cfg.btnStepId);
  const btnReset = document.getElementById(cfg.btnResetId);
  const btnSpeed = document.getElementById(cfg.btnSpeedId);
  const dot      = document.getElementById(cfg.statusDotId);
  const actionEl = document.getElementById(cfg.actionTextId);
  const progFill = document.getElementById(cfg.progressFillId);
  const progText = document.getElementById(cfg.progressTextId);

  const SPEEDS = [1, 2, 0.5];
  const SPEED_LABELS = ['1×','2×','0.5×'];
  let speedIdx = 0;
  const BASE = cfg.isDijkstra ? 800 : 650;

  let steps = [], idx = 0, timer = null, playing = false;

  function interval() { return BASE / SPEEDS[speedIdx]; }

  function setStatus(s) {
    /* s: 'idle'|'running'|'done' */
    dot.className = 'viz-status-dot' + (s==='running'?' running':s==='done'?' done':'');
  }

  function updateUI(step) {
    if (!step) {
      if (actionEl) { actionEl.className = 'viz-action-text'; actionEl.textContent = 'Press ▶ Play to start, or → Step to go one step at a time'; }
      if (progFill) progFill.style.width = '0%';
      if (progText) progText.textContent = 'Step 0 / 0';
      cfg.dataUpdate(null);
      return;
    }
    const isDone = step.label.startsWith('✅');
    if (actionEl) {
      actionEl.className = 'viz-action-text' + (isDone ? ' done' : ' highlight');
      actionEl.textContent = step.icon + '  ' + step.label;
    }
    if (progFill && steps.length > 1) progFill.style.width = ((idx / (steps.length-1)) * 100) + '%';
    if (progText) progText.textContent = `Step ${idx} / ${steps.length-1}`;
    cfg.dataUpdate(step);
  }

  function render() {
    const s = steps[Math.min(idx, steps.length-1)];
    if (!s) return;
    draw(canvas, cfg.nodes, cfg.edges, s.drawState, cfg.isDijkstra);
    updateUI(s);
  }

  function stop(done) {
    clearInterval(timer); timer = null; playing = false;
    btnPlay.textContent = '▶ Play';
    setStatus(done ? 'done' : 'idle');
  }

  function reset() {
    stop(false);
    steps = []; idx = 0;
    draw(canvas, cfg.nodes, cfg.edges, { visited: new Set(), current: -1 }, cfg.isDijkstra);
    updateUI(null);
  }

  btnPlay.addEventListener('click', () => {
    if (playing) { stop(false); return; }
    if (!steps.length) { steps = cfg.buildSteps(); idx = 0; }
    if (idx >= steps.length) { reset(); steps = cfg.buildSteps(); idx = 0; }
    playing = true; btnPlay.textContent = '⏸ Pause'; setStatus('running');
    timer = setInterval(() => {
      render(); idx++;
      if (idx >= steps.length) { stop(true); }
    }, interval());
  });

  btnStep.addEventListener('click', () => {
    if (playing) { stop(false); }
    if (!steps.length) { steps = cfg.buildSteps(); idx = 0; }
    if (idx >= steps.length) { reset(); steps = cfg.buildSteps(); idx = 0; }
    render(); idx++;
    setStatus(idx >= steps.length ? 'done' : 'idle');
  });

  btnReset.addEventListener('click', reset);

  if (btnSpeed) {
    btnSpeed.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      btnSpeed.textContent = SPEED_LABELS[speedIdx];
      if (playing) { clearInterval(timer); timer = setInterval(() => { render(); idx++; if(idx>=steps.length){stop(true);} }, interval()); }
    });
  }

  /* initial draw */
  reset();
}

/* ────────────────────────────────────────────
   WIRE: BFS
──────────────────────────────────────────────*/
makeViz({
  canvasId: 'bfsCanvas',
  nodes: NODES, edges: EDGES.map(([a,b])=>({a,b})),
  isDijkstra: false,
  buildSteps: bfsSteps,
  btnPlayId: 'bfsPlay', btnStepId: 'bfsStep',
  btnResetId: 'bfsReset', btnSpeedId: 'bfsSpeed',
  statusDotId: 'bfsStatusDot',
  actionTextId: 'bfsActionText',
  progressFillId: 'bfsProgressFill', progressTextId: 'bfsProgressText',
  dataUpdate(s) {
    const qEl = document.getElementById('bfsQueueVal');
    const oEl = document.getElementById('bfsOrderVal');
    if (!s) { if(qEl) qEl.textContent='[ ]'; if(oEl) oEl.textContent='—'; return; }
    if (qEl) qEl.textContent = s.queue.length ? '[ ' + s.queue.map(i=>NODES[i].label).join(' , ') + ' ]' : '[ empty ]';
    if (oEl) oEl.textContent = s.order.length ? s.order.map(i=>NODES[i].label).join(' → ') : '—';
  },
});

/* ────────────────────────────────────────────
   WIRE: DFS
──────────────────────────────────────────────*/
makeViz({
  canvasId: 'dfsCanvas',
  nodes: NODES, edges: EDGES.map(([a,b])=>({a,b})),
  isDijkstra: false,
  buildSteps: dfsSteps,
  btnPlayId: 'dfsPlay', btnStepId: 'dfsStep',
  btnResetId: 'dfsReset', btnSpeedId: 'dfsSpeed',
  statusDotId: 'dfsStatusDot',
  actionTextId: 'dfsActionText',
  progressFillId: 'dfsProgressFill', progressTextId: 'dfsProgressText',
  dataUpdate(s) {
    const sEl = document.getElementById('dfsStackVal');
    const oEl = document.getElementById('dfsOrderVal');
    if (!s) { if(sEl) sEl.textContent='[ ]'; if(oEl) oEl.textContent='—'; return; }
    if (sEl) sEl.textContent = s.stack.length ? '[ ' + [...s.stack].reverse().map(i=>NODES[i].label).join(' , ') + ' ]' : '[ empty ]';
    if (oEl) oEl.textContent = s.order.length ? s.order.map(i=>NODES[i].label).join(' → ') : '—';
  },
});

/* ────────────────────────────────────────────
   WIRE: DIJKSTRA
──────────────────────────────────────────────*/
makeViz({
  canvasId: 'dijkstraCanvas',
  nodes: DJ_NODES, edges: DJ_EDGES,
  isDijkstra: true,
  buildSteps: dijkstraSteps,
  btnPlayId: 'dijkstraPlay', btnStepId: 'dijkstraStep',
  btnResetId: 'dijkstraReset', btnSpeedId: 'dijkstraSpeed',
  statusDotId: 'dijkstraStatusDot',
  actionTextId: 'dijkstraActionText',
  progressFillId: 'dijkstraProgressFill', progressTextId: 'dijkstraProgressText',
  dataUpdate(s) {
    const hEl = document.getElementById('dijkstraHeapVal');
    const dEl = document.getElementById('dijkstraDistVal');
    if (!s) { if(hEl) hEl.textContent='[ ]'; if(dEl) dEl.textContent='—'; return; }
    if (hEl) hEl.textContent = s.pq.length
      ? s.pq.map(x=>`${DJ_NODES[x.node].label}(${x.d})`).join(' , ')
      : '[ empty ]';
    if (dEl) dEl.textContent = s.dist.map((d,i)=>`${DJ_NODES[i].label}=${d>=1e8?'∞':d}`).join('  ');
  },
});

/* ────────────────────────────────────────────
   RESIZE: redraw all canvases
──────────────────────────────────────────────*/
let _rt;
window.addEventListener('resize', () => {
  clearTimeout(_rt);
  _rt = setTimeout(() => {
    ['bfsReset','dfsReset','dijkstraReset'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.click();
    });
  }, 180);
});
