/* ── nav.js  shared across all pages — v2 ── */
'use strict';

/* ── SIDEBAR TOGGLE ── */
(function(){
  const btn     = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if(!btn||!sidebar) return;

  btn.addEventListener('click',()=>{
    sidebar.classList.toggle('open');
    btn.classList.toggle('open');
  });
  sidebar.querySelectorAll('.sidebar-nav a').forEach(a=>{
    a.addEventListener('click',()=>{
      sidebar.classList.remove('open');
      btn.classList.remove('open');
    });
  });
  document.addEventListener('click',e=>{
    if(sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&e.target!==btn){
      sidebar.classList.remove('open');
      btn.classList.remove('open');
    }
  });
})();

/* ── SCROLL REVEAL — handles all 4 direction classes ── */
(function(){
  const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.07});
  document.querySelectorAll(selectors).forEach(el=>obs.observe(el));
})();

/* ── SIDEBAR SCROLL SPY ── */
(function(){
  const links = document.querySelectorAll('.sidebar-nav a[href^="#"]');
  if(!links.length) return;
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        links.forEach(l=>l.parentElement.classList.remove('active'));
        const a = document.querySelector(`.sidebar-nav a[href="#${e.target.id}"]`);
        if(a) a.parentElement.classList.add('active');
      }
    });
  },{rootMargin:'-15% 0px -65% 0px',threshold:0});
  document.querySelectorAll('section[id]').forEach(s=>obs.observe(s));
})();

/* ── 3D CARD TILT ── */
(function(){
  const MAX_TILT = 7; // degrees
  document.querySelectorAll('.card, .card-sm, .card-glow').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dx = (e.clientX - cx) / (r.width/2);
      const dy = (e.clientY - cy) / (r.height/2);
      const rx = -dy * MAX_TILT, ry = dx * MAX_TILT;
      card.style.transform = `translateY(-5px) scale(1.008) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.transition = 'box-shadow 0.22s ease';
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform = '';
      card.style.transition = 'transform 0.45s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease';
    });
  });
})();

/* ── STAGGER REVEAL ── */
(function(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.querySelectorAll(':scope > *').forEach((child,i)=>{
          setTimeout(()=>child.classList.add('visible'), i*70);
        });
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.1});
  document.querySelectorAll('.stagger').forEach(el=>{
    el.querySelectorAll(':scope > *').forEach(child=>{
      child.classList.add('reveal');
    });
    obs.observe(el);
  });
})();
