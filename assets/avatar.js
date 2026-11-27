/* Caricature: the head follows the cursor (separate head layer rotating in 3D, smoothed every
   frame), the body turns slightly with it, and a second copy next to the arcade watches the
   game and reacts to it (events dispatched by fx.js). */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const calmMQ = matchMedia('(max-width: 860px), (pointer: coarse)');
  const calm = () => reduced || calmMQ.matches;
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const T = {
    es: { hello: '¡Hola! 👋 Soy José Carlos', play: '¿Echamos una partida? 🎮', luck: '¡Suerte! 🍀', goal: '¡GOOOL! ⚽', record: '¡Nuevo récord! 🏆', again: '¡Otra ronda! 💪' },
    en: { hello: "Hi! 👋 I'm José Carlos", play: 'Fancy a game? 🎮', luck: 'Good luck! 🍀', goal: 'GOOOAL! ⚽', record: 'New record! 🏆', again: 'One more! 💪' },
  };
  const tr = (k) => T[lang()][k];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Speech bubble with one of the caricature's facial expressions (smile / wink / surprised).
  const bubbleTimers = new WeakMap();
  function say(el, text, ms = 2200, face = 'smile') {
    if (!el) return;
    el.innerHTML = `<img class="av-face" src="assets/img/face-${face}.webp" alt="" width="180" height="180"><span></span>`;
    el.querySelector('span').textContent = text;
    el.classList.add('show');
    clearTimeout(bubbleTimers.get(el));
    bubbleTimers.set(el, setTimeout(() => el.classList.remove('show'), ms));
  }
  function hop(el) {
    if (!el || reduced) return;
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
  }

  /* A rig = head + body layers that ease toward a target look direction (x, y in -1..1). */
  function makeRig(head, body) {
    const s = { lx: 0, ly: 0, tx: 0, ty: 0, raf: 0 };
    const apply = () => {
      const { lx, ly } = s;
      head.style.transform =
        `translate3d(${(lx * 7).toFixed(2)}px, ${(ly * 4).toFixed(2)}px, 0) ` +
        `perspective(520px) rotateY(${(lx * 24).toFixed(2)}deg) rotateX(${(-ly * 14).toFixed(2)}deg) rotateZ(${(lx * 3).toFixed(2)}deg)`;
      body.style.transform = `perspective(1000px) rotateY(${(lx * 7).toFixed(2)}deg)`;
    };
    const tick = () => {
      s.raf = 0;
      const k = reduced ? 1 : 0.12; // easing factor: smooth, never snappy
      s.lx += (s.tx - s.lx) * k;
      s.ly += (s.ty - s.ly) * k;
      apply();
      if (Math.abs(s.tx - s.lx) > 0.002 || Math.abs(s.ty - s.ly) > 0.002) s.raf = requestAnimationFrame(tick);
    };
    return {
      look(x, y) { s.tx = clamp(x, -1, 1); s.ty = clamp(y, -1, 1); if (!s.raf) s.raf = requestAnimationFrame(tick); },
    };
  }

  /* ---------------- Hero ---------------- */
  const scene = $('#avScene'), fig = $('#avFigure'), bubble = $('#avBubble');
  const headEl = $('#avHead'), bodyEl = $('#avBodyWrap');
  if (scene && fig && headEl && bodyEl) {
    const rig = makeRig(headEl, bodyEl);
    // The 3D bust (assets/avatar3d.js), once loaded, follows the same gaze.
    const look2d = rig.look;
    rig.look = (x, y) => { look2d(x, y); window.Avatar3D?.look(x, y); };
    const REST = [-0.45, -0.05]; // resting gaze: towards the name on the left
    rig.look(...REST);
    let idleT = 0, mx = 0, my = 0, pending = 0;

    const follow = () => {
      pending = 0;
      if (calm()) return;
      const r = fig.getBoundingClientRect();
      const hx = r.left + r.width / 2, hy = r.top + r.height * 0.13; // the head's position
      const dx = (mx - hx) / (innerWidth * 0.45), dy = (my - hy) / (innerHeight * 0.55);
      rig.look(dx, dy);
      scene.style.transform = `rotateX(${(-clamp(dy, -1, 1) * 4).toFixed(2)}deg) rotateY(${(clamp(dx, -1, 1) * 6).toFixed(2)}deg)`;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!pending) pending = requestAnimationFrame(follow);
      clearTimeout(idleT);
      idleT = setTimeout(() => { rig.look(...REST); scene.style.transform = ''; }, 5000);
    }, { passive: true });
    document.addEventListener('mouseleave', () => { rig.look(...REST); scene.style.transform = ''; });

    fig.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hop(fig);
      say(bubble, tr('hello'), 2200, 'smile');
      window.Avatar3D?.smile?.(1600); // greets you with a half smile
    });
    fig.addEventListener('click', () => {
      rig.look(0, 0);
      hop(fig);
      say(bubble, tr('play'), 2600, 'wink');
      window.Arcade?.focusMenu();
      if (calm()) setTimeout(() => rig.look(...REST), 2600);
    });
  }

  /* ---------------- Peeking copy next to the arcade: watches the game ---------------- */
  const peek = $('#avPeek'), peekBubble = $('#peekBubble');
  const peekHead = $('#peekHead'), peekBody = $('#peekBodyWrap');
  if (peek && peekHead && peekBody) {
    const rig = makeRig(peekHead, peekBody);
    const WATCH = [0.75, 0.1]; // looking at the terminal on his right
    rig.look(...WATCH);
    let backT = 0;
    const react = (text, ms, face) => {
      rig.look(0, -0.1); // turns to the visitor
      hop(peek);
      say(peekBubble, text, ms, face);
      clearTimeout(backT);
      backT = setTimeout(() => rig.look(...WATCH), ms);
    };
    addEventListener('arcade', (e) => {
      const d = e.detail || {};
      if (d.type === 'start') { rig.look(...WATCH); say(peekBubble, tr('luck'), 1600, 'wink'); }
      else if (d.type === 'goal') react(tr('goal'), 1800, 'surprised');
      else if (d.type === 'end') react(d.record ? tr('record') : tr('again'), 2600, d.record ? 'surprised' : 'smile');
    });
  }

  ['smile', 'wink', 'surprised'].forEach((f) => { const i = new Image(); i.src = `assets/img/face-${f}.webp`; });
})();
