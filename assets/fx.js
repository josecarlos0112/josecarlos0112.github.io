/* Interactive extras: the Atlético de Madrid hover effect and the 3-game arcade in the hero terminal. */
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
     Arcade — three short mini-games that run inside the hero terminal:
       bugs    · Bug Hunt (QA)          click bugs, avoid "features"
       penalty · Penaltis (Atleti)      6 penalties against a diving keeper
       uptime  · Uptime 99.9 (SysAdmin) reboot failing servers before they go down
     ===================================================================== */
  const A = {
    es: {
      title: 'Arcade', sub: '3 minijuegos · ¿superas tu récord?', best: 'récord', play: 'Jugar',
      games: {
        bugs: { name: 'Bug Hunt', tag: 'QA', desc: 'Caza bugs antes de que lleguen a producción', hint: 'Haz clic en los bugs · evita las ★ features' },
        penalty: { name: 'Penaltis', tag: 'Atleti', desc: '6 tiros contra el portero. ¿Por la escuadra?', hint: 'La mira se mueve: haz clic para chutar' },
        uptime: { name: 'Uptime 99.9', tag: 'SysAdmin', desc: 'Reinicia los servidores antes de que caigan', hint: 'Clic en los servidores en rojo · los verdes dan bonus' },
      },
      go: '¡Ya!', feature: '¡Era una feature!', combo: 'combo',
      goal: '¡GOOOL!', corner: '¡Por la escuadra!', saved: '¡Parada!', post: '¡Al palo!', out: 'Fuera',
      shot: 'Tiro', down: 'CAÍDO', deploy: 'deploy',
      report: 'Informe', resolved: 'Cerrado', score: 'Puntuación', newBest: '¡Nuevo récord!', yourBest: 'Tu récord',
      retry: 'Otra ronda', menu: 'Otros juegos',
      cta: '¿Buscas a alguien así en tu equipo?', ctaBtn: 'Hablemos',
      rows: {
        closed: 'Bugs cerrados', escaped: 'Escapados a producción', accuracy: 'Precisión',
        goals: 'Goles', corners: 'Por la escuadra', saves: 'Paradas del portero',
        reboots: 'Servidores reiniciados', outages: 'Caídas', uptime: 'Uptime final',
      },
      ranks: {
        bugs: ['Becario en prácticas', 'QA Junior', 'QA Senior', 'Lead QA', 'Leyenda del testing'],
        penalty: ['Canterano', 'Titular', 'Pichichi', 'Leyenda rojiblanca'],
        uptime: ['Becario de guardia', 'SysAdmin Junior', 'SysAdmin Senior', 'SRE de leyenda'],
      },
    },
    en: {
      title: 'Arcade', sub: '3 mini-games · can you beat your best?', best: 'best', play: 'Play',
      games: {
        bugs: { name: 'Bug Hunt', tag: 'QA', desc: 'Squash bugs before they reach production', hint: 'Click the bugs · avoid the ★ features' },
        penalty: { name: 'Penalties', tag: 'Atleti', desc: '6 shots against the keeper. Top corner?', hint: 'The crosshair moves: click to shoot' },
        uptime: { name: 'Uptime 99.9', tag: 'SysAdmin', desc: 'Reboot servers before they go down', hint: 'Click the red servers · green ones are a bonus' },
      },
      go: 'Go!', feature: 'That was a feature!', combo: 'combo',
      goal: 'GOOOAL!', corner: 'Top corner!', saved: 'Saved!', post: 'Off the post!', out: 'Wide',
      shot: 'Shot', down: 'DOWN', deploy: 'deploy',
      report: 'Report', resolved: 'Closed', score: 'Score', newBest: 'New record!', yourBest: 'Your best',
      retry: 'One more round', menu: 'Other games',
      cta: 'Looking for someone like this on your team?', ctaBtn: "Let's talk",
      rows: {
        closed: 'Bugs closed', escaped: 'Escaped to production', accuracy: 'Accuracy',
        goals: 'Goals', corners: 'Top corners', saves: 'Keeper saves',
        reboots: 'Servers rebooted', outages: 'Outages', uptime: 'Final uptime',
      },
      ranks: {
        bugs: ['Intern', 'Junior QA', 'Senior QA', 'Lead QA', 'Testing legend'],
        penalty: ['Academy player', 'Starter', 'Top scorer', 'Rojiblanco legend'],
        uptime: ['On-call intern', 'Junior SysAdmin', 'Senior SysAdmin', 'Legendary SRE'],
      },
    },
  };
  const a = (k) => A[lang()][k];
  const ICONS_G = { bugs: '🐞', penalty: '⚽', uptime: '🖥️' };

  /* ---------------- Game 1 · Bug Hunt ---------------- */
  function BugsGame(api) {
    const DUR = 30;
    let t = 0, score = 0, hits = 0, misses = 0, escaped = 0, combo = 0, lastHit = -9, spawnT = 0.2;
    const bugs = [];
    function spawnBug() {
      const { W, H } = api, p = t / DUR, r = Math.random();
      const type = r < 0.11 ? 'feature' : r < 0.32 ? 'crit' : 'bug';
      const edge = Math.floor(Math.random() * 4), m = 20;
      const x = edge === 0 ? -m : edge === 1 ? W + m : rand(m, W - m);
      const y = edge === 2 ? -m : edge === 3 ? H + m : rand(m + 30, H - m);
      const base = type === 'crit' ? rand(110, 150) : type === 'feature' ? rand(50, 70) : rand(60, 95);
      bugs.push({ type, x, y, a: Math.atan2(H / 2 - y, W / 2 - x), speed: base * (1 + p * 0.7),
        tx: rand(40, W - 40), ty: rand(50, H - 30), retarget: rand(0.8, 1.8),
        life: type === 'crit' ? rand(3, 4) : rand(4.5, 6), leaving: false, phase: Math.random() * 10, size: coarse ? 1.25 : 1.1 });
    }
    return {
      tiers: [0, 120, 260, 420, 600],
      get score() { return score; },
      hudRight: () => `${Math.max(0, DUR - t).toFixed(1)}s`,
      hot: () => DUR - t < 5,
      progress: () => Math.max(0, 1 - t / DUR),
      label: () => (combo > 1 ? `${a('combo')} ×${combo}` : ''),
      over: () => t >= DUR,
      step(dt) {
        const { W, H } = api;
        t += dt;
        const p = t / DUR;
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnBug();
          if (Math.random() < p * 0.5) spawnBug();
          spawnT = Math.max(0.32, 0.85 - p * 0.55) * rand(0.7, 1.2);
        }
        for (let i = bugs.length - 1; i >= 0; i--) {
          const b = bugs[i];
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
          const da = ((want - b.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          b.a += Math.max(-1, Math.min(1, da)) * dt * (b.type === 'crit' ? 7 : 4.5);
          b.x += Math.cos(b.a) * b.speed * dt;
          b.y += Math.sin(b.a) * b.speed * dt;
          if (b.leaving && (b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50)) {
            if (b.type !== 'feature') { escaped++; api.float(Math.max(30, Math.min(W - 30, b.x)), Math.max(40, Math.min(H - 20, b.y)), '−1', '#ff6b85'); }
            bugs.splice(i, 1);
          }
        }
        if (t - lastHit > 1.4 && combo > 1) combo = 1;
      },
      hit(x, y) {
        const R = coarse ? 30 : 22;
        let best = -1, bd = Infinity;
        bugs.forEach((b, i) => { const d = Math.hypot(b.x - x, b.y - y); if (d < R && d < bd) { bd = d; best = i; } });
        if (best < 0) { misses++; combo = 0; api.ring(x, y); return; }
        const b = bugs.splice(best, 1)[0];
        if (b.type === 'feature') {
          score = Math.max(0, score - 15); combo = 0; misses++;
          api.float(b.x, b.y - 10, a('feature'), '#ffd166');
          api.burst(b.x, b.y, '#ffd166', 10);
          api.shake();
          return;
        }
        combo = t - lastHit < 1.4 ? Math.min(5, combo + 1) : 1;
        lastHit = t;
        const pts = (b.type === 'crit' ? 25 : 10) * combo;
        score += pts; hits++;
        api.float(b.x, b.y - 12, `+${pts}`, b.type === 'crit' ? '#ff8da2' : '#b9c9ff');
        api.burst(b.x, b.y, b.type === 'crit' ? '#ff4d6d' : '#8aa6ff', 14);
        api.splat(b.x, b.y, b.type === 'crit' ? '#ff4d6d' : '#8aa6ff');
      },
      draw(ctx, time) { bugs.forEach((b) => drawBug(ctx, b, time)); },
      result() {
        const shots = hits + misses;
        return { score, rows: [[a('rows').closed, hits], [a('rows').escaped, escaped], [a('rows').accuracy, `${shots ? Math.round((hits / shots) * 100) : 0}%`]] };
      },
    };
  }
  function drawBug(ctx, b, time) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    ctx.scale(b.size, b.size);
    if (b.type === 'feature') {
      ctx.rotate(-b.a + Math.sin(time * 3) * 0.3);
      ctx.fillStyle = '#ffd166'; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14;
      starPath(ctx, 0, 0, 11, 5); ctx.fill();
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
  function starPath(ctx, x, y, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const rr = i % 2 ? r * 0.45 : r, ang = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    ctx.closePath();
  }

  /* ---------------- Game 2 · Penaltis (Atleti) ---------------- */
  function PenaltyGame(api) {
    const SHOTS = 6;
    let t = 0, shot = 0, score = 0, goals = 0, corners = 0, saves = 0;
    let phase = 'aim', phaseT = 0, ball = null, keeper = { x: 0, dx: 0, lean: 0 }, results = [], msg = null;
    const geo = () => {
      const { W, H } = api;
      const gw = Math.min(W * 0.8, 440), gh = gw * 0.4;
      return { W, H, gw, gh, gx: (W - gw) / 2, gy: Math.max(46, H * 0.15), spotX: W / 2, spotY: H * 0.84 };
    };
    const aim = () => {
      const g = geo(), sp = 1.5 + shot * 0.32;
      return {
        x: g.gx + g.gw / 2 + Math.sin(t * sp) * (g.gw / 2 + g.gw * 0.07),
        y: g.gy + g.gh / 2 + Math.sin(t * sp * 1.43 + 1.1) * (g.gh / 2 + g.gh * 0.12),
      };
    };
    function resolve() {
      const g = geo(), { tx, ty } = ball;
      const inX = tx > g.gx + 5 && tx < g.gx + g.gw - 5, inY = ty > g.gy + 5 && ty < g.gy + g.gh;
      const nearPost = (Math.abs(tx - g.gx) <= 7 || Math.abs(tx - (g.gx + g.gw)) <= 7 || Math.abs(ty - g.gy) <= 7) &&
        tx > g.gx - 7 && tx < g.gx + g.gw + 7 && ty > g.gy - 7 && ty < g.gy + g.gh;
      const kx = g.W / 2 + keeper.dx, ky = g.gy + g.gh * (Math.abs(keeper.dx) > g.gw * 0.12 ? 0.6 : 0.5);
      const reach = g.gw * 0.17;
      let res;
      if (nearPost && !(inX && inY)) res = 'post';
      else if (!(inX && inY)) res = 'out';
      else if (Math.hypot(tx - kx, (ty - ky) * 1.1) < reach) res = 'saved';
      else res = 'goal';
      if (res === 'goal') {
        const isCorner = ty < g.gy + g.gh * 0.32 && (tx < g.gx + g.gw * 0.2 || tx > g.gx + g.gw * 0.8);
        goals++;
        const pts = 100 + (isCorner ? 50 : 0);
        score += pts;
        if (isCorner) corners++;
        msg = { text: isCorner ? a('corner') : a('goal'), color: '#ffffff', big: true };
        api.float(tx, ty - 14, `+${pts}`, '#ffffff');
        api.burst(tx, ty, '#cb3524', 14); api.burst(tx, ty, '#ffffff', 10);
        api.celebrate();
        api.emit("goal");
      } else if (res === 'saved') {
        saves++;
        msg = { text: a('saved'), color: '#ffd166' };
        api.shake();
      } else {
        msg = { text: res === 'post' ? a('post') : a('out'), color: '#a3a5b8' };
        if (res === 'post') api.shake();
      }
      results.push(res === 'goal');
    }
    function drawBall(ctx, x, y, r, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#272e61'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#272e61';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const an = (i / 5) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(an) * r * 0.42, Math.sin(an) * r * 0.42); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    return {
      tiers: [0, 250, 450, 700],
      get score() { return score; },
      hudRight: () => `${a('shot')} ${Math.min(SHOTS, shot + 1)}/${SHOTS}`,
      hot: () => false,
      progress: () => 1 - shot / SHOTS,
      label: () => `⚽ ${goals}`,
      over: () => shot >= SHOTS && phase === 'done',
      step(dt) {
        t += dt; phaseT += dt;
        const g = geo();
        if (phase === 'flight') {
          const k = Math.min(1, phaseT / 0.42);
          ball.k = k;
          const kk = Math.min(1, phaseT / 0.34);
          keeper.dx = keeper.target * (1 - Math.pow(1 - kk, 3));
          keeper.lean = keeper.targetLean * kk;
          if (k >= 1) { resolve(); phase = 'result'; phaseT = 0; }
        } else if (phase === 'result' && phaseT > 1.25) {
          shot++; ball = null; keeper = { x: 0, dx: 0, lean: 0 }; msg = null;
          phase = shot >= SHOTS ? 'done' : 'aim'; phaseT = 0;
        } else if (phase === 'aim') {
          keeper.dx = Math.sin(t * 2.2) * g.gw * 0.04; // keeper sways on the line
        }
      },
      hit() {
        if (phase !== 'aim') return;
        const g = geo(), p = aim();
        ball = { sx: g.spotX, sy: g.spotY, tx: p.x, ty: p.y, k: 0 };
        // The keeper reads the shot 35% of the time; otherwise picks a side.
        const reads = Math.random() < 0.35;
        const side = reads ? p.x - g.W / 2 : [-1, 0, 1][Math.floor(Math.random() * 3)] * g.gw * 0.3;
        keeper.target = Math.max(-g.gw * 0.36, Math.min(g.gw * 0.36, side));
        keeper.targetLean = Math.abs(keeper.target) > g.gw * 0.12 ? Math.sign(keeper.target) * 1.1 : 0;
        phase = 'flight'; phaseT = 0;
      },
      draw(ctx) {
        const g = geo();
        // pitch
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? 'rgba(46,160,90,.10)' : 'rgba(46,160,90,.05)';
          const y0 = g.gy + g.gh + (i * (g.H - g.gy - g.gh)) / 8;
          ctx.fillRect(0, y0, g.W, (g.H - g.gy - g.gh) / 8 + 1);
        }
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, g.gy + g.gh); ctx.lineTo(g.W, g.gy + g.gh); ctx.stroke();
        ctx.strokeRect(g.gx - g.gw * 0.25, g.gy + g.gh, g.gw * 1.5, (g.H - g.gy - g.gh) * 0.55);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.beginPath(); ctx.arc(g.spotX, g.spotY, 2.5, 0, Math.PI * 2); ctx.fill();
        // net
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
        for (let x = g.gx; x <= g.gx + g.gw; x += 14) { ctx.beginPath(); ctx.moveTo(x, g.gy); ctx.lineTo(x, g.gy + g.gh); ctx.stroke(); }
        for (let y = g.gy; y <= g.gy + g.gh; y += 14) { ctx.beginPath(); ctx.moveTo(g.gx, y); ctx.lineTo(g.gx + g.gw, y); ctx.stroke(); }
        // posts
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(g.gx, g.gy + g.gh); ctx.lineTo(g.gx, g.gy); ctx.lineTo(g.gx + g.gw, g.gy); ctx.lineTo(g.gx + g.gw, g.gy + g.gh); ctx.stroke();
        // keeper
        const kh = g.gh * 0.78, kw = g.gw * 0.075;
        ctx.save();
        ctx.translate(g.W / 2 + keeper.dx, g.gy + g.gh);
        ctx.rotate(keeper.lean);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.roundRect(-kw, -kh * 0.82, kw * 2, kh * 0.5, 5); ctx.fill();
        ctx.fillStyle = '#272e61';
        ctx.fillRect(-kw, -kh * 0.34, kw * 2, kh * 0.14);
        ctx.strokeStyle = '#1b1d2a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-kw * 0.5, -kh * 0.2); ctx.lineTo(-kw * 0.6, 0); ctx.moveTo(kw * 0.5, -kh * 0.2); ctx.lineTo(kw * 0.6, 0); ctx.stroke();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4.5;
        const armUp = phase === 'flight' || phase === 'result' ? 1 : 0.45;
        ctx.beginPath(); ctx.moveTo(-kw, -kh * 0.74); ctx.lineTo(-kw * 2.3, -kh * (0.74 + 0.28 * armUp)); ctx.moveTo(kw, -kh * 0.74); ctx.lineTo(kw * 2.3, -kh * (0.74 + 0.28 * armUp)); ctx.stroke();
        ctx.fillStyle = '#e0b08a';
        ctx.beginPath(); ctx.arc(0, -kh * 0.94, kw * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // crosshair
        if (phase === 'aim') {
          const p = aim();
          ctx.save(); ctx.translate(p.x, p.y);
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = i % 2 ? '#ffffff' : '#cb3524';
            ctx.beginPath(); ctx.arc(0, 0, 12, (i * Math.PI) / 2 + t * 3, ((i + 1) * Math.PI) / 2 + t * 3); ctx.stroke();
          }
          ctx.fillStyle = '#cb3524'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        // ball
        if (ball) {
          const k = ball.k, e = 1 - Math.pow(1 - k, 2);
          const x = ball.sx + (ball.tx - ball.sx) * e, y = ball.sy + (ball.ty - ball.sy) * e - Math.sin(k * Math.PI) * 30;
          drawBall(ctx, x, y, 10 - 3.5 * k, k * 9);
        } else {
          drawBall(ctx, g.spotX, g.spotY - 9, 10, 0);
        }
        // shot record
        for (let i = 0; i < SHOTS; i++) {
          const x = g.W / 2 + (i - (SHOTS - 1) / 2) * 18, y = g.H - 12;
          ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2);
          if (i < results.length) { ctx.fillStyle = results[i] ? '#cb3524' : '#3a3d52'; ctx.fill(); if (results[i]) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); } }
          else { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.2; ctx.stroke(); }
        }
        if (msg) {
          ctx.save();
          ctx.font = `italic 600 ${msg.big ? 30 : 22}px Fraunces, Georgia, serif`;
          ctx.textAlign = 'center'; ctx.fillStyle = msg.color;
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8;
          ctx.fillText(msg.text, g.W / 2, g.gy + g.gh + 44);
          ctx.restore();
        }
      },
      result() {
        return { score, rows: [[a('rows').goals, `${goals}/${SHOTS}`], [a('rows').corners, corners], [a('rows').saves, saves]] };
      },
    };
  }

  /* ---------------- Game 3 · Uptime 99.9 (SysAdmin) ---------------- */
  function UptimeGame(api) {
    const DUR = 30;
    let t = 0, pts = 0, reboots = 0, outages = 0, bonus = 0, uptime = 100, spawnT = 0.6;
    let cols = 0, rows = 3, servers = [];
    function layout() {
      const c = api.W > 430 ? 4 : 3;
      if (c !== cols) { cols = c; servers = Array.from({ length: cols * rows }, (_, i) => servers[i] || { st: 'ok', ttl: 0, ttl0: 1, blink: Math.random() * 6 }); }
    }
    function rect(i) {
      const { W, H } = api, pad = 14, top = 46, gap = 10;
      const cw = (W - pad * 2 - gap * (cols - 1)) / cols, ch = (H - top - 20 - gap * (rows - 1)) / rows;
      return { x: pad + (i % cols) * (cw + gap), y: top + Math.floor(i / cols) * (ch + gap), w: cw, h: ch };
    }
    return {
      tiers: [0, 250, 450, 650],
      get score() { return pts; },
      hudRight: () => `${Math.max(0, DUR - t).toFixed(1)}s`,
      hot: () => DUR - t < 5,
      progress: () => Math.max(0, 1 - t / DUR),
      label: () => `uptime ${uptime.toFixed(1)}%`,
      over: () => t >= DUR,
      step(dt) {
        layout();
        t += dt;
        const p = t / DUR;
        spawnT -= dt;
        if (spawnT <= 0) {
          const ok = servers.map((s, i) => (s.st === 'ok' ? i : -1)).filter((i) => i >= 0);
          if (ok.length) {
            const s = servers[ok[Math.floor(Math.random() * ok.length)]];
            const isDeploy = Math.random() < 0.12;
            s.st = isDeploy ? 'deploy' : 'fail';
            s.ttl = s.ttl0 = isDeploy ? 1.5 : Math.max(1.3, 2.7 - p * 1.3);
          }
          spawnT = Math.max(0.38, 1.05 - p * 0.7) * rand(0.75, 1.2);
        }
        servers.forEach((s, i) => {
          s.blink += dt;
          if (s.st === 'fail' || s.st === 'deploy' || s.st === 'down') s.ttl -= dt;
          if (s.st === 'fail' && s.ttl <= 0) {
            s.st = 'down'; s.ttl = 2; outages++; uptime = Math.max(0, uptime - 3.5);
            const r = rect(i); api.float(r.x + r.w / 2, r.y + r.h / 2, '−3.5%', '#ff6b85'); api.shake();
          } else if (s.st === 'deploy' && s.ttl <= 0) s.st = 'ok';
          else if (s.st === 'down' && s.ttl <= 0) s.st = 'ok';
        });
      },
      hit(x, y) {
        const i = servers.findIndex((_, k) => { const r = rect(k); return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; });
        if (i < 0) { api.ring(x, y); return; }
        const s = servers[i], r = rect(i), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        if (s.st === 'fail') {
          const gain = 10 + Math.round((s.ttl / s.ttl0) * 10);
          pts += gain; reboots++; s.st = 'ok';
          api.float(cx, cy - 6, `+${gain}`, '#b9c9ff'); api.burst(cx, cy, '#8aa6ff', 10);
        } else if (s.st === 'deploy') {
          pts += 25; bonus++; s.st = 'ok';
          api.float(cx, cy - 6, '+25', '#7ee2a8'); api.burst(cx, cy, '#7ee2a8', 12);
        } else api.ring(x, y);
      },
      draw(ctx) {
        layout();
        servers.forEach((s, i) => {
          const r = rect(i);
          const pulse = 0.5 + 0.5 * Math.sin(t * 10);
          ctx.save();
          ctx.fillStyle = s.st === 'down' ? '#0f0f16' : '#161827';
          ctx.strokeStyle = s.st === 'fail' ? `rgba(255,77,109,${0.55 + 0.45 * pulse})` : s.st === 'deploy' ? '#7ee2a8' : 'rgba(255,255,255,.1)';
          ctx.lineWidth = s.st === 'fail' || s.st === 'deploy' ? 2 : 1;
          if (s.st === 'fail') { ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 14 * pulse; }
          ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 8); ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0;
          // drive bays
          const bays = 3, bh = Math.min(9, (r.h - 26) / bays - 4);
          for (let b = 0; b < bays; b++) {
            const by = r.y + 10 + b * (bh + 5);
            ctx.fillStyle = 'rgba(255,255,255,.05)';
            ctx.fillRect(r.x + 10, by, r.w - 34, bh);
            const on = s.st === 'ok' ? Math.sin(s.blink * (6 + b * 3)) > 0 : s.st === 'fail' ? pulse > 0.5 : s.st === 'deploy';
            ctx.fillStyle = s.st === 'down' ? '#3a1520' : s.st === 'fail' ? (on ? '#ff4d6d' : '#5a1a28') : s.st === 'deploy' ? '#7ee2a8' : (on ? '#4ade80' : '#1f5133');
            ctx.beginPath(); ctx.arc(r.x + r.w - 15, by + bh / 2, 3, 0, Math.PI * 2); ctx.fill();
          }
          ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
          if (s.st === 'fail') {
            ctx.fillStyle = '#ff8da2'; ctx.fillText('⚠ 500', r.x + r.w / 2, r.y + r.h - 14);
            ctx.fillStyle = 'rgba(255,77,109,.25)'; ctx.fillRect(r.x + 8, r.y + r.h - 8, r.w - 16, 3);
            ctx.fillStyle = '#ff4d6d'; ctx.fillRect(r.x + 8, r.y + r.h - 8, (r.w - 16) * Math.max(0, s.ttl / s.ttl0), 3);
          } else if (s.st === 'down') {
            ctx.fillStyle = '#ff4d6d'; ctx.fillText(a('down'), r.x + r.w / 2, r.y + r.h - 12);
          } else if (s.st === 'deploy') {
            ctx.fillStyle = '#7ee2a8'; ctx.fillText(`⬆ ${a('deploy')}`, r.x + r.w / 2, r.y + r.h - 12);
          } else {
            ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillText(`srv-${String(i + 1).padStart(2, "0")}`, r.x + r.w / 2, r.y + r.h - 12);
          }
          ctx.restore();
        });
      },
      result() {
        const final = pts + Math.round(uptime * 3);
        pts = final;
        return { score: final, rows: [[a('rows').reboots, reboots], [a('rows').outages, outages], [a('rows').uptime, `${uptime.toFixed(1)}%`]] };
      },
    };
  }

  const GAMES = { bugs: BugsGame, penalty: PenaltyGame, uptime: UptimeGame };

  /* ---------------- Arcade shell: menu, stage, HUD, loop, report ---------------- */
  const Arcade = (() => {
    let term, stage, canvas, ctx, hud, overlay, S = null, G = null, gameId = null, raf = 0, ro = null, W = 0, H = 0;
    const meta = (id) => A[lang()].games[id];
    const bestOf = (id) => +(store.get(`arcade-best-${id}`) || 0);

    function render() {
      const el = document.getElementById('arcade');
      if (!el) return;
      el.innerHTML = `
        <div class="arcade-head"><span class="arcade-title"><span class="arcade-dot"></span>${a('title')}</span><span class="arcade-sub">${a('sub')}</span></div>
        <div class="arcade-grid">${Object.keys(GAMES).map((id) => {
          const m = meta(id), b = bestOf(id);
          return `<button type="button" class="arcade-btn ab-${id}" data-game="${id}">
            <span class="ab-ico" aria-hidden="true">${ICONS_G[id]}</span>
            <span class="ab-txt"><strong>${m.name}</strong><small>${m.desc}</small></span>
            <span class="ab-meta"><span class="ab-tag">${m.tag}</span><span class="ab-go">${b ? `★ ${b}` : `▶ ${a('play')}`}</span></span>
          </button>`;
        }).join('')}</div>`;
    }

    const api = {
      get W() { return W; }, get H() { return H; },
      float: (x, y, text, color) => S && S.fx.push({ kind: 'text', x, y, text, color, t: 0, life: 0.9 }),
      ring: (x, y) => S && S.fx.push({ kind: 'ring', x, y, t: 0, life: 0.35 }),
      splat: (x, y, color) => S && S.fx.push({ kind: 'splat', x, y, color, t: 0, life: 1.6 }),
      burst(x, y, color, n) {
        if (!S) return;
        for (let i = 0; i < n; i++) {
          const ang = Math.random() * Math.PI * 2, s = rand(60, 220);
          S.fx.push({ kind: 'p', x, y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s - 80, t: 0, life: rand(0.35, 0.7), color });
        }
      },
      shake() { if (!stage) return; stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); },
      emit: (type, extra = {}) => dispatchEvent(new CustomEvent("arcade", { detail: { type, game: gameId, ...extra } })),
      celebrate() {
        if (!term || reduced) return;
        const r = term.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + r.height * 0.35, 26, { spread: 1.1 });
      },
    };

    function start(id) {
      term = document.querySelector('.terminal');
      if (!term || !GAMES[id]) return;
      stop();
      gameId = id;
      term.classList.add('gaming');
      const tr0 = term.getBoundingClientRect();
      if (tr0.top < 60 || tr0.bottom > innerHeight) term.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      const barH = term.querySelector('.terminal-bar').offsetHeight;
      stage = document.createElement('div');
      stage.className = `bh-stage game-${id}`;
      stage.style.top = `${barH}px`;
      stage.innerHTML = `
        <div class="bh-hud">
          <span class="bh-game">${ICONS_G[id]} ${meta(id).name}</span>
          <span class="bh-score">0</span>
          <span class="bh-combo"></span>
          <span class="bh-time"></span>
          <button type="button" class="bh-close" aria-label="✕">✕</button>
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
      canvas.addEventListener('pointerdown', onPointer);
      stage.querySelector('.bh-close').addEventListener('click', () => stop(true));
      G = GAMES[id](api);
      api.emit("start");
      S = { phase: 'count', count: 3, countT: 0, time: 0, fx: [] };
      hud.time.textContent = G.hudRight();
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

    function stop(toMenu) {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      stage?.remove();
      term?.classList.remove('gaming');
      stage = null; S = null; G = null;
      render();
      if (toMenu) focusMenu();
    }

    function focusMenu() {
      const t = document.querySelector('.terminal');
      if (!t) return;
      if (t.classList.contains('gaming')) return;
      const r = t.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight) document.getElementById('arcade')?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      const m = document.getElementById('arcade');
      m?.classList.remove('flash'); void m?.offsetWidth; m?.classList.add('flash');
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
      overlay.innerHTML = `<div class="bh-count">${S.count > 0 ? S.count : a('go')}</div><p class="bh-hint">${meta(gameId).hint}</p>`;
    }

    function step(dt) {
      if (!S) return;
      S.time += dt;
      if (S.phase === 'count') {
        S.countT += dt;
        if (S.countT >= 0.65) {
          S.countT = 0; S.count--; // 3, 2, 1, then 0 shows "go!", then -1 starts play
          if (S.count === -1) { S.phase = 'play'; overlay.className = 'bh-overlay'; overlay.innerHTML = ''; } else showCount();
        }
      } else if (S.phase === 'play') {
        G.step(dt);
        hud.score.textContent = G.score;
        hud.time.textContent = G.hudRight();
        hud.time.classList.toggle('hot', G.hot());
        hud.bar.style.transform = `scaleX(${G.progress()})`;
        hud.combo.textContent = G.label();
        if (G.over()) end();
      }
      for (let i = S.fx.length - 1; i >= 0; i--) {
        const f = S.fx[i];
        f.t += dt;
        if (f.kind === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; }
        if (f.kind === 'text') f.y -= 40 * dt;
        if (f.t >= f.life) S.fx.splice(i, 1);
      }
    }

    function onPointer(e) {
      if (!S || S.phase !== 'play') return;
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      G.hit(e.clientX - r.left, e.clientY - r.top);
    }

    function end() {
      S.phase = 'end';
      const res = G.result();
      const prev = bestOf(gameId), isBest = res.score > prev;
      if (isBest) store.set(`arcade-best-${gameId}`, String(res.score));
      const best = Math.max(prev, res.score);
      let rank = 0;
      G.tiers.forEach((v, i) => { if (res.score >= v) rank = i; });
      const ticket = `JCZG-${100 + Math.floor(Math.random() * 900)}`;
      hud.score.textContent = res.score;
      overlay.className = 'bh-overlay show';
      overlay.innerHTML = `
        <div class="bh-report">
          <div class="bh-ticket"><span>${ticket} · ${ICONS_G[gameId]} ${meta(gameId).name}</span><span class="bh-resolved">● ${a('resolved')}</span></div>
          <h4>${a('report')}</h4>
          <div class="bh-rank">${a('ranks')[gameId][rank]}</div>
          <dl>
            <div><dt>${a('score')}</dt><dd>${res.score}${isBest && res.score > 0 ? ` <em>${a('newBest')}</em>` : ''}</dd></div>
            ${res.rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
            <div><dt>${a('yourBest')}</dt><dd>${best}</dd></div>
          </dl>
          <div class="bh-actions">
            <button type="button" class="bh-btn bh-primary" data-act="retry">↻ ${a('retry')}</button>
            <button type="button" class="bh-btn" data-act="menu">🎮 ${a('menu')}</button>
          </div>
          <p class="bh-cta">${a('cta')} <a href="#contact" data-act="contact">${a('ctaBtn')} →</a></p>
        </div>`;
      overlay.querySelector('[data-act="retry"]').addEventListener('click', () => start(gameId));
      overlay.querySelector('[data-act="menu"]').addEventListener('click', () => stop(true));
      overlay.querySelector('[data-act="contact"]').addEventListener('click', () => stop());
      if (isBest && res.score > 0) api.celebrate();
      api.emit("end", { record: isBest && res.score > 0, score: res.score });
    }

    function draw() {
      if (!S || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      if (gameId !== 'penalty') {
        ctx.fillStyle = 'rgba(255,255,255,.035)';
        for (let gx = 12; gx < W; gx += 24) for (let gy = 12; gy < H; gy += 24) ctx.fillRect(gx, gy, 1.5, 1.5);
      }
      S.fx.forEach((f) => {
        if (f.kind !== 'splat') return;
        const k = f.t / f.life;
        ctx.globalAlpha = 0.45 * (1 - k);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        for (let i = 0; i < 9; i++) {
          const ang = (i / 9) * Math.PI * 2, rr = 9 + ((i * 7) % 5) * 2;
          ctx.lineTo(f.x + Math.cos(ang) * rr, f.y + Math.sin(ang) * rr);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      if (G) G.draw(ctx, S.time);
      S.fx.forEach((f) => {
        const k = f.t / f.life;
        if (f.kind === 'p') {
          ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color; ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
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

    return { start, stop, render, focusMenu, get running() { return !!S; } };
  })();
  window.Arcade = Arcade;
  Arcade.render();

  document.addEventListener('click', (e) => {
    const g = e.target.closest?.('[data-game]');
    if (g) { Arcade.start(g.dataset.game); return; }
    const f = e.target.closest?.('[data-arcade-focus]');
    if (f) { e.preventDefault(); Arcade.focusMenu(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Arcade.running) Arcade.stop(true); });
})();
