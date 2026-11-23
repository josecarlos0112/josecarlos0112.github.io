/* Interactive extras: the Atlético de Madrid hover effect and the "Bug Hunt" mini-game. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const T = {
    es: {
      aupa: '¡Aúpa Atleti!', aupaSub: 'QA · Desarrollo Digital', goal: '¡GOOOL!',
      go: '¡A cazar!', hint: 'Haz clic en los bugs · evita las ★ features',
      feature: '¡Era una feature!', combo: 'combo',
      report: 'Informe de QA', resolved: 'Resuelto', closed: 'Bugs cerrados', escaped: 'Escapados a producción',
      accuracy: 'Precisión', best: 'Tu récord', newBest: '¡Nuevo récord!', score: 'Puntuación',
      retry: 'Otra ronda', exit: 'Volver a la terminal',
      cta: '¿Buscas a alguien que cace bugs así en tu equipo?', ctaBtn: 'Hablemos',
      ranks: ['Becario en prácticas', 'QA Junior', 'QA Senior', 'Lead QA', 'Leyenda del testing'],
    },
    en: {
      aupa: 'Aúpa Atleti!', aupaSub: 'QA · Digital Development', goal: 'GOOOAL!',
      go: 'Hunt!', hint: 'Click the bugs · avoid the ★ features',
      feature: 'That was a feature!', combo: 'combo',
      report: 'QA report', resolved: 'Resolved', closed: 'Bugs closed', escaped: 'Escaped to production',
      accuracy: 'Accuracy', best: 'Your best', newBest: 'New record!', score: 'Score',
      retry: 'One more round', exit: 'Back to terminal',
      cta: 'Looking for someone who hunts bugs like this on your team?', ctaBtn: "Let's talk",
      ranks: ['Intern', 'Junior QA', 'Senior QA', 'Lead QA', 'Testing legend'],
    },
  };
  const tr = (k) => T[lang()][k];

  /* =====================================================================
     Atlético de Madrid — red & white stripes rise as the cursor gets close
     ===================================================================== */
  const RED = '#cb3524', WHITE = '#ffffff', NAVY = '#272e61';
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let px = -1e4, py = -1e4, nearRaf = 0;
  function updateNear() {
    nearRaf = 0;
    document.querySelectorAll('.atleti').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const dx = Math.max(r.left - px, 0, px - r.right);
      const dy = Math.max(r.top - py, 0, py - r.bottom);
      const n = Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / 170));
      el.style.setProperty('--near', n.toFixed(3));
    });
  }
  const queueNear = () => { if (!nearRaf) nearRaf = requestAnimationFrame(updateNear); };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY; queueNear();
  }, { passive: true });
  addEventListener('scroll', queueNear, { passive: true });

  const BALL = `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="11" fill="#fff" stroke="${NAVY}" stroke-width="1.4"/><path d="M12 7.4l4.4 3.2-1.7 5.1H9.3l-1.7-5.1z" fill="${NAVY}"/><path d="M12 1.2v6.2M16.4 10.6l6-1.9M14.7 15.7l3.7 5.1M9.3 15.7l-3.7 5.1M7.6 10.6l-6-1.9" stroke="${NAVY}" stroke-width="1.2" fill="none"/></svg>`;

  function spawn(cls, html = '') {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    layer.appendChild(el);
    return el;
  }
  const rand = (a, b) => a + Math.random() * (b - a);

  function confetti(x, y, n, { spread = 1, up = 1 } = {}) {
    if (reduced) return;
    const colors = [RED, RED, WHITE, WHITE, NAVY];
    for (let i = 0; i < n; i++) {
      const b = spawn('fx-bit');
      b.style.background = colors[i % colors.length];
      b.style.left = `${x}px`; b.style.top = `${y}px`;
      const dx = rand(-160, 160) * spread, dy = -rand(80, 220) * up, rot = rand(-720, 720);
      b.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.7}px, ${dy}px) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx}px, ${dy + 340}px) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: rand(1100, 1700), easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => b.remove();
    }
  }

  function kickBall(x, y) {
    if (reduced) return;
    const ball = spawn('fx-ball', BALL);
    ball.style.left = `${x}px`; ball.style.top = `${y}px`;
    const dir = x > innerWidth * 0.6 ? -1 : 1, dx = dir * rand(200, 300);
    ball.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, -150px) rotate(${dir * 360}deg)`, offset: 0.42 },
      { transform: `translate(${dx * 0.88}px, 30px) rotate(${dir * 640}deg)`, offset: 0.78 },
      { transform: `translate(${dx * 0.95}px, 0px) rotate(${dir * 700}deg)`, offset: 0.88 },
      { transform: `translate(${dx}px, 30px) rotate(${dir * 760}deg)`, opacity: 0 },
    ], { duration: 1300, easing: 'cubic-bezier(.3,.5,.4,1)' }).onfinish = () => ball.remove();
  }

  const badges = new WeakMap();
  function badge(el) {
    if (badges.get(el)) return;
    const r = el.getBoundingClientRect();
    const b = spawn('atleti-badge', `<i></i><strong>${tr('aupa')}</strong><small>${tr('aupaSub')}</small>`);
    const w = 210;
    b.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
    b.style.top = `${Math.max(8, r.top - 74)}px`;
    badges.set(el, b);
    b.animate([
      { opacity: 0, transform: 'translateY(10px) scale(.85) rotate(-4deg)' },
      { opacity: 1, transform: 'translateY(0) scale(1.04) rotate(1deg)', offset: 0.18 },
      { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)', offset: 0.85 },
      { opacity: 0, transform: 'translateY(-8px) scale(.95)' },
    ], { duration: 1900, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => { b.remove(); badges.delete(el); };
  }

  let lastBurst = 0;
  function burst(el, x, y) {
    const now = performance.now();
    if (now - lastBurst < 900) return;
    lastBurst = now;
    badge(el);
    confetti(x, y, 22, { spread: 0.8 });
    kickBall(x, y);
  }

  let lastGoal = 0;
  function goal(el) {
    const now = performance.now();
    if (now - lastGoal < 1800) return;
    lastGoal = now;
    const g = spawn('goal-text', `<span>${tr('goal')}</span>`);
    g.animate([
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.4) rotate(-8deg)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1.08) rotate(2deg)', offset: 0.2 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', offset: 0.75 },
      { opacity: 0, transform: 'translate(-50%,-50%) scale(1.25)' },
    ], { duration: reduced ? 1200 : 1800, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => g.remove();
    if (!reduced) {
      for (let i = 0; i < 6; i++) setTimeout(() => confetti(rand(0, innerWidth), -10, 14, { spread: 0.6, up: -0.3 }), i * 90);
      const r = el.getBoundingClientRect();
      kickBall(r.left + r.width / 2, r.top);
    }
  }

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('.atleti');
    if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
    if (e.pointerType === 'mouse') burst(el, e.clientX, e.clientY);
  });
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('.atleti');
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (coarse) { el.classList.add('is-hot'); setTimeout(() => el.classList.remove('is-hot'), 1800); burst(el, r.left + r.width / 2, r.top + r.height / 2); }
    goal(el);
  });
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('.atleti');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goal(el); }
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('.atleti');
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(el, r.left + r.width / 2, r.top + r.height / 2);
  });

  /* =====================================================================
     Bug Hunt — a 30-second QA mini-game inside the hero terminal
     ===================================================================== */
  const BugHunt = (() => {
    const DURATION = 30;
    let term, stage, canvas, ctx, hud, overlay, S = null, raf = 0, ro = null, W = 0, H = 0;

    function start() {
      term = document.querySelector('.terminal');
      if (!term) return;
      stop();
      term.classList.add('gaming');
      const barH = term.querySelector('.terminal-bar').offsetHeight;
      stage = document.createElement('div');
      stage.className = 'bh-stage';
      stage.style.top = `${barH}px`;
      stage.innerHTML = `
        <div class="bh-hud">
          <span class="bh-score">0</span>
          <span class="bh-combo"></span>
          <span class="bh-time">${DURATION.toFixed(1)}s</span>
          <button type="button" class="bh-close" aria-label="${tr('exit')}">✕</button>
        </div>
        <div class="bh-timebar"><i></i></div>
        <canvas></canvas>
        <div class="bh-overlay"></div>`;
      term.appendChild(stage);
      canvas = stage.querySelector('canvas');
      ctx = canvas.getContext('2d');
      hud = {
        score: stage.querySelector('.bh-score'), combo: stage.querySelector('.bh-combo'),
        time: stage.querySelector('.bh-time'), bar: stage.querySelector('.bh-timebar i'),
      };
      overlay = stage.querySelector('.bh-overlay');
      ro = new ResizeObserver(resize);
      ro.observe(stage);
      resize();
      canvas.addEventListener('pointerdown', onHit);
      stage.querySelector('.bh-close').addEventListener('click', stop);

      S = { t: 0, phase: 'count', count: 3, countT: 0, score: 0, hits: 0, misses: 0, escaped: 0,
            combo: 0, lastHit: -9, bugs: [], fx: [], spawnT: 0.2, time: 0 };
      showCount();
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        step(dt);
        draw();
        if (S) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      stage?.remove();
      term?.classList.remove('gaming');
      stage = null; S = null;
    }

    function resize() {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function showCount() {
      overlay.className = 'bh-overlay show';
      overlay.innerHTML = `<div class="bh-count">${S.count > 0 ? S.count : tr('go')}</div><p class="bh-hint">${tr('hint')}</p>`;
    }

    function spawnBug() {
      const p = S.t / DURATION;
      const r = Math.random();
      const type = r < 0.11 ? 'feature' : r < 0.32 ? 'crit' : 'bug';
      const edge = Math.floor(Math.random() * 4);
      const m = 20;
      const x = edge === 0 ? -m : edge === 1 ? W + m : rand(m, W - m);
      const y = edge === 2 ? -m : edge === 3 ? H + m : rand(m + 30, H - m);
      const base = type === 'crit' ? rand(110, 150) : type === 'feature' ? rand(50, 70) : rand(60, 95);
      S.bugs.push({
        type, x, y, a: Math.atan2(H / 2 - y, W / 2 - x), speed: base * (1 + p * 0.7),
        tx: rand(40, W - 40), ty: rand(50, H - 30), retarget: rand(0.8, 1.8),
        life: type === 'crit' ? rand(3, 4) : rand(4.5, 6), leaving: false, phase: Math.random() * 10,
        size: coarse ? 1.25 : 1.1,
      });
    }

    function step(dt) {
      if (!S) return;
      S.time += dt;
      if (S.phase === 'count') {
        S.countT += dt;
        if (S.countT >= 0.65) {
          S.countT = 0; S.count--; // 3, 2, 1, then 0 shows "go!", then -1 starts play
          if (S.count === -1) { S.phase = 'play'; overlay.className = 'bh-overlay'; overlay.innerHTML = ''; }
          else showCount();
        }
        return;
      }
      if (S.phase !== 'play') { stepFx(dt); return; }

      S.t += dt;
      const p = S.t / DURATION;
      S.spawnT -= dt;
      if (S.spawnT <= 0) {
        spawnBug();
        if (Math.random() < p * 0.5) spawnBug();
        S.spawnT = Math.max(0.32, 0.85 - p * 0.55) * rand(0.7, 1.2);
      }
      for (let i = S.bugs.length - 1; i >= 0; i--) {
        const b = S.bugs[i];
        b.life -= dt; b.retarget -= dt; b.phase += dt * (b.speed / 6);
        if (!b.leaving && b.life <= 0) {
          b.leaving = true;
          const exits = [[-60, b.y], [W + 60, b.y], [b.x, -60], [b.x, H + 60]];
          const d = exits.map(([ex, ey]) => Math.hypot(ex - b.x, ey - b.y));
          [b.tx, b.ty] = exits[d.indexOf(Math.min(...d))];
          b.speed *= 1.3;
        } else if (!b.leaving && (b.retarget <= 0 || Math.hypot(b.tx - b.x, b.ty - b.y) < 14)) {
          b.tx = rand(30, W - 30); b.ty = rand(40, H - 25); b.retarget = rand(0.7, 1.6);
        }
        const want = Math.atan2(b.ty - b.y, b.tx - b.x);
        let da = ((want - b.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        b.a += Math.max(-1, Math.min(1, da)) * dt * (b.type === 'crit' ? 7 : 4.5);
        b.x += Math.cos(b.a) * b.speed * dt;
        b.y += Math.sin(b.a) * b.speed * dt;
        if (b.leaving && (b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50)) {
          if (b.type !== 'feature') { S.escaped++; floatText(Math.max(30, Math.min(W - 30, b.x)), Math.max(40, Math.min(H - 20, b.y)), '−1', '#ff6b85'); }
          S.bugs.splice(i, 1);
        }
      }
      if (S.t - S.lastHit > 1.4 && S.combo > 1) S.combo = 1;
      stepFx(dt);

      hud.score.textContent = S.score;
      hud.time.textContent = `${Math.max(0, DURATION - S.t).toFixed(1)}s`;
      hud.bar.style.transform = `scaleX(${Math.max(0, 1 - p)})`;
      hud.combo.textContent = S.combo > 1 ? `${tr('combo')} ×${S.combo}` : '';
      hud.time.classList.toggle('hot', DURATION - S.t < 5);
      if (S.t >= DURATION) end();
    }

    function stepFx(dt) {
      for (let i = S.fx.length - 1; i >= 0; i--) {
        const f = S.fx[i];
        f.t += dt;
        if (f.kind === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; }
        if (f.kind === 'text') f.y -= 40 * dt;
        if (f.t >= f.life) S.fx.splice(i, 1);
      }
    }

    function floatText(x, y, text, color) { S.fx.push({ kind: 'text', x, y, text, color, t: 0, life: 0.9 }); }

    function onHit(e) {
      if (!S || S.phase !== 'play') return;
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const R = coarse ? 30 : 22;
      let best = -1, bd = Infinity;
      S.bugs.forEach((b, i) => { const d = Math.hypot(b.x - x, b.y - y); if (d < R && d < bd) { bd = d; best = i; } });
      if (best < 0) {
        S.misses++; S.combo = 0;
        S.fx.push({ kind: 'ring', x, y, t: 0, life: 0.35 });
        return;
      }
      const b = S.bugs.splice(best, 1)[0];
      if (b.type === 'feature') {
        S.score = Math.max(0, S.score - 15); S.combo = 0; S.misses++;
        floatText(b.x, b.y - 10, tr('feature'), '#ffd166');
        burstFx(b.x, b.y, '#ffd166', 10);
        stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
        return;
      }
      S.combo = S.t - S.lastHit < 1.4 ? Math.min(5, S.combo + 1) : 1;
      S.lastHit = S.t;
      const pts = (b.type === 'crit' ? 25 : 10) * S.combo;
      S.score += pts; S.hits++;
      floatText(b.x, b.y - 12, `+${pts}`, b.type === 'crit' ? '#ff8da2' : '#b9c9ff');
      burstFx(b.x, b.y, b.type === 'crit' ? '#ff4d6d' : '#8aa6ff', 14);
      S.fx.push({ kind: 'splat', x: b.x, y: b.y, a: b.a, t: 0, life: 1.6, color: b.type === 'crit' ? '#ff4d6d' : '#8aa6ff' });
    }

    function burstFx(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(60, 220);
        S.fx.push({ kind: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, t: 0, life: rand(0.35, 0.7), color });
      }
    }

    function end() {
      S.phase = 'end';
      S.bugs = [];
      const shots = S.hits + S.misses;
      const acc = shots ? Math.round((S.hits / shots) * 100) : 0;
      const prev = +(store.get('bughunt-best') || 0);
      const isBest = S.score > prev;
      if (isBest) store.set('bughunt-best', String(S.score));
      const best = Math.max(prev, S.score);
      const tiers = [0, 120, 260, 420, 600];
      let rank = 0; tiers.forEach((v, i) => { if (S.score >= v) rank = i; });
      const ticket = `JCZ-${100 + Math.floor(Math.random() * 900)}`;
      overlay.className = 'bh-overlay show';
      overlay.innerHTML = `
        <div class="bh-report">
          <div class="bh-ticket"><span>${ticket}</span><span class="bh-resolved">● ${tr('resolved')}</span></div>
          <h4>${tr('report')}</h4>
          <div class="bh-rank">${tr('ranks')[rank]}</div>
          <dl>
            <div><dt>${tr('score')}</dt><dd>${S.score}${isBest && S.score > 0 ? ` <em>${tr('newBest')}</em>` : ''}</dd></div>
            <div><dt>${tr('closed')}</dt><dd>${S.hits}</dd></div>
            <div><dt>${tr('escaped')}</dt><dd>${S.escaped}</dd></div>
            <div><dt>${tr('accuracy')}</dt><dd>${acc}%</dd></div>
            <div><dt>${tr('best')}</dt><dd>${best}</dd></div>
          </dl>
          <div class="bh-actions">
            <button type="button" class="bh-btn bh-primary" data-bh-retry>↻ ${tr('retry')}</button>
            <button type="button" class="bh-btn" data-bh-exit>${tr('exit')}</button>
          </div>
          <p class="bh-cta">${tr('cta')} <a href="#contact" data-bh-exit>${tr('ctaBtn')} →</a></p>
        </div>`;
      overlay.querySelector('[data-bh-retry]').addEventListener('click', start);
      overlay.querySelectorAll('[data-bh-exit]').forEach((b) => b.addEventListener('click', stop));
    }

    /* ---------- drawing ---------- */
    function drawBug(b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.scale(b.size, b.size);
      if (b.type === 'feature') {
        ctx.rotate(-b.a + Math.sin(S.time * 3) * 0.3);
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14;
        star(0, 0, 11, 5);
        ctx.fill();
        ctx.restore();
        return;
      }
      const body = b.type === 'crit' ? '#ff4d6d' : '#8aa6ff';
      const dark = b.type === 'crit' ? '#8a1730' : '#2c3a8c';
      if (b.type === 'crit') { ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 12; }
      ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const lx = -5 + i * 5, sw = Math.sin(b.phase + i * 2.1 + (side > 0 ? 0 : Math.PI)) * 3;
          ctx.beginPath(); ctx.moveTo(lx, side * 3); ctx.lineTo(lx + sw, side * 10); ctx.stroke();
        }
      }
      ctx.beginPath(); ctx.moveTo(11, -2); ctx.lineTo(17, -6); ctx.moveTo(11, 2); ctx.lineTo(17, 6); ctx.stroke();
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(-1, 0, 9.5, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(9.5, 0, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(7, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(-4, -3, 1.4, 0, Math.PI * 2); ctx.arc(1, 3, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function star(x, y, r, n) {
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const rr = i % 2 ? r * 0.45 : r, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
    }

    function draw() {
      if (!S || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let gx = 12; gx < W; gx += 24) for (let gy = 12; gy < H; gy += 24) ctx.fillRect(gx, gy, 1.5, 1.5);

      S.fx.forEach((f) => {
        const k = f.t / f.life;
        if (f.kind === 'splat') {
          ctx.globalAlpha = 0.45 * (1 - k);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2, rr = 9 + ((i * 7) % 5) * 2;
            ctx.lineTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr);
          }
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      S.bugs.forEach(drawBug);
      S.fx.forEach((f) => {
        const k = f.t / f.life;
        if (f.kind === 'p') {
          ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color;
          ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
        } else if (f.kind === 'ring') {
          ctx.globalAlpha = 1 - k; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(f.x, f.y, 6 + k * 16, 0, Math.PI * 2); ctx.stroke();
        } else if (f.kind === 'text') {
          ctx.globalAlpha = 1 - k * k; ctx.fillStyle = f.color;
          ctx.font = '600 14px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
          ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
      });
    }

    return { start, stop, get running() { return !!S; } };
  })();
  window.BugHunt = BugHunt;

  document.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-bughunt]')) BugHunt.start();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && BugHunt.running) BugHunt.stop(); });
})();
