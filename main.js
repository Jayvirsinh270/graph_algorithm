/* ═══════════════════════════════════════════════
   GraphAlgo · main.js  — Glassmorphism Edition
   Hero Canvas, Scroll Reveal, Navbar, Intro Graph,
   Complexity Chart, Parallax Tilt, Scroll Spy
═══════════════════════════════════════════════ */
'use strict';

/* ══════════════════ 1. HERO PARTICLE CANVAS ══════════════════ */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes, edges, raf;
  const COLORS = ['#4f8ef7','#a78bfa','#22d3ee','#34d399','#f472b6'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  function build() {
    const count = Math.min(65, Math.floor((W * H) / 18000));
    nodes = Array.from({length: count}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 2.2 + 1.2, pulse: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    rebuildEdges();
  }

  function rebuildEdges() {
    const maxD = Math.min(W, H) * 0.2;
    edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < maxD) edges.push({a:i, b:j, d, maxD});
      }
    }
  }

  let tick = 0;
  function loop() {
    ctx.clearRect(0, 0, W, H);
    // edges
    edges.forEach(e => {
      const na = nodes[e.a], nb = nodes[e.b];
      ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = `rgba(79,142,247,${(1 - e.d/e.maxD) * 0.25})`;
      ctx.lineWidth = 0.7; ctx.stroke();
    });
    // nodes
    nodes.forEach(n => {
      n.pulse += 0.016;
      const g = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + g*2, 0, Math.PI*2);
      ctx.fillStyle = n.color + '30'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fillStyle = n.color; ctx.fill();
      // move
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    tick++;
    if (tick % 100 === 0) rebuildEdges();
    raf = requestAnimationFrame(loop);
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt); cancelAnimationFrame(raf);
    rt = setTimeout(() => { resize(); build(); loop(); }, 200);
  });

  resize(); build(); loop();
})();

/* ══════════════════ 2. SIDEBAR TOGGLE (mobile) ══════════════════ */
(function () {
  const btn     = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    btn.classList.toggle('open');
  });

  /* close sidebar when a nav link is tapped on mobile */
  sidebar.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.addEventListener('click', () => {
      sidebar.classList.remove('open');
      btn.classList.remove('open');
    });
  });

  /* close on outside click */
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && e.target !== btn) {
      sidebar.classList.remove('open');
      btn.classList.remove('open');
    }
  });
})();

/* ══════════════════ 3. SIDEBAR SCROLL SPY ══════════════════ */
(function () {
  const links = document.querySelectorAll('.sidebar-nav a');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.parentElement.classList.remove('active'));
        const a = document.querySelector(`.sidebar-nav a[href="#${e.target.id}"]`);
        if (a) a.parentElement.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

  sections.forEach(s => obs.observe(s));
})();

/* ══════════════════ 4. SCROLL REVEAL ══════════════════ */
(function () {
  const items = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0) || 0;
        setTimeout(() => e.target.classList.add('visible'), delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach((el, i) => {
    el.style.transitionDelay = (i % 5) * 70 + 'ms';
    obs.observe(el);
  });
})();

/* ══════════════════ 5. INTRO GRAPH CANVAS ══════════════════ */
(function () {
  const canvas = document.getElementById('introGraphCanvas');
  if (!canvas) return;

  // Set fixed resolution
  canvas.width  = 380;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const nodes = [
    {id:'A', x:190, y:42},
    {id:'B', x: 75, y:128},
    {id:'C', x:305, y:128},
    {id:'D', x: 42, y:240},
    {id:'E', x:188, y:222},
    {id:'F', x:325, y:240},
  ];
  const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['E','F']];

  let hovered = null;

  function nbrs(id) {
    return edges.filter(e => e[0]===id||e[1]===id).map(e => e[0]===id?e[1]:e[0]);
  }

  function nodeAt(mx, my) {
    return nodes.find(n => Math.hypot(n.x-mx, n.y-my) < 22) || null;
  }

  function drawIntro(hov) {
    ctx.clearRect(0,0,W,H);

    edges.forEach(([a,b]) => {
      const na = nodes.find(n=>n.id===a), nb = nodes.find(n=>n.id===b);
      const hi = hov && (a===hov||b===hov);
      ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
      ctx.strokeStyle = hi ? '#8b5cf6' : 'rgba(139,92,246,0.18)';
      ctx.lineWidth = hi ? 2.5 : 1.5; ctx.stroke();
    });

    nodes.forEach(n => {
      const isHov = n.id===hov;
      const isNbr = hov && nbrs(hov).includes(n.id);
      /* light theme: pastel fills, dark text */
      let bg = 'rgba(235,233,255,0.92)', border = 'rgba(139,92,246,0.30)';
      if (isHov)     { bg='rgba(237,233,254,0.97)'; border='#8b5cf6'; }
      else if (isNbr){ bg='rgba(252,231,243,0.95)'; border='#f43f8e'; }

      if (isHov) {
        ctx.beginPath(); ctx.arc(n.x,n.y,27,0,Math.PI*2);
        ctx.fillStyle='rgba(139,92,246,0.12)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.x,n.y,18,0,Math.PI*2);
      ctx.fillStyle=bg; ctx.fill();
      ctx.strokeStyle=border; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#1e1b4b'; ctx.font='bold 13px Inter,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(n.id,n.x,n.y);
    });
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const n = nodeAt((e.clientX-rect.left)*sx, (e.clientY-rect.top)*sy);
    const nh = n ? n.id : null;
    if (nh !== hovered) { hovered = nh; drawIntro(hovered); }
  });
  canvas.addEventListener('mouseleave', () => { hovered=null; drawIntro(null); });

  drawIntro(null);
})();

/* ══════════════════ 6. COMPLEXITY CHART ══════════════════ */
(function () {
  const canvas = document.getElementById('complexityChart');
  if (!canvas) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { obs.disconnect(); drawChart(); }
  }, {threshold: 0.25});
  obs.observe(canvas);

  function drawChart() {
    const W = canvas.width  = canvas.offsetWidth  || 700;
    const H = canvas.height = 260;
    const ctx = canvas.getContext('2d');
    const pad = {top:30, right:24, bottom:48, left:52};
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top  - pad.bottom;
    const maxN = 20;
    const pts = Array.from({length: maxN}, (_, i) => i+1);

    const series = [
      {label:'O(V+E) — BFS/DFS',         color:'#4f8ef7', fn: n => n*1.6},
      {label:'O((V+E)logV) — Dijkstra',   color:'#22d3ee', fn: n => n*Math.log2(n+1)*0.9},
      {label:'O(V²) — Naïve Dijkstra',    color:'#a78bfa', fn: n => n*n*0.45},
    ];

    const allVals = series.flatMap(s => pts.map(n => s.fn(n)));
    const maxVal = Math.max(...allVals);
    const tx = n => pad.left + ((n-1)/(maxN-1))*cw;
    const ty = v => pad.top  + ch - (v/maxVal)*ch;

    ctx.clearRect(0,0,W,H);

    /* helper to draw grid + axes on light background */
    function drawAxes() {
      // grid lines — very light purple tint
      ctx.strokeStyle='rgba(139,92,246,0.08)'; ctx.lineWidth=1;
      for(let i=0;i<=5;i++){
        const y=pad.top+(ch/5)*i;
        ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke();
      }
      // axes — slightly bolder
      ctx.strokeStyle='rgba(107,114,128,0.35)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,pad.top+ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left,pad.top+ch); ctx.lineTo(pad.left+cw,pad.top+ch); ctx.stroke();
      // axis labels
      ctx.fillStyle='rgba(107,114,128,0.70)'; ctx.font='11px Inter,sans-serif'; ctx.textAlign='center';
      ctx.fillText('Number of Nodes (n)', pad.left+cw/2, H-6);
      ctx.save(); ctx.translate(14,pad.top+ch/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Operations',0,0); ctx.restore();
      [1,5,10,15,20].forEach(n => {
        ctx.fillStyle='rgba(107,114,128,0.60)'; ctx.textAlign='center';
        ctx.fillText(n, tx(n), pad.top+ch+16);
      });
    }
    drawAxes();

    // animated draw
    let t=0, frames=55;
    function animate() {
      t++; const prog = 1-Math.pow(1-(t/frames),3);
      const vis = Math.floor(prog*(maxN-1))+1;
      ctx.clearRect(0,0,W,H);

      drawAxes();

      series.forEach(s => {
        ctx.beginPath();
        for(let i=0;i<vis;i++){
          const n=pts[i], x=tx(n), y=ty(s.fn(n));
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=s.color; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();
        const last=pts[vis-1];
        ctx.beginPath(); ctx.arc(tx(last),ty(s.fn(last)),4,0,Math.PI*2);
        ctx.fillStyle=s.color; ctx.fill();
      });

      // legend — dark text on light bg
      series.forEach((s,i) => {
        const lx=pad.left+i*(cw/series.length)+10, ly=pad.top-14;
        ctx.fillStyle=s.color; ctx.fillRect(lx,ly-3,18,3);
        ctx.fillStyle='rgba(30,27,75,0.65)'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='left';
        ctx.fillText(s.label,lx+22,ly);
      });

      if(t<frames) requestAnimationFrame(animate);
    }
    animate();
  }
})();
