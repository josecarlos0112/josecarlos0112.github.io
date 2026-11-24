/* José Carlos Zorrilla — personal site. Renders everything from data/cv.json. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Wraps mentions of the club in an interactive span (see assets/fx.js).
  const atleti = (html) => String(html).replace(/Atlético de Madrid/g, '<span class="atleti" tabindex="0" role="button">Atlético de Madrid</span>');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phones and touch tablets get a calmer page: no scroll-driven sliding (it caused motion sickness).
  const calmMQ = matchMedia('(max-width: 860px), (pointer: coarse)');
  const calm = () => reduced || calmMQ.matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- UI strings ---------- */
  const UI = {
    es: {
      'nav.about': 'Sobre mí', 'nav.experience': 'Experiencia', 'nav.skills': 'Stack', 'nav.projects': 'Proyectos',
      'nav.education': 'Formación', 'nav.contact': 'Contacto',
      'hero.talk': 'Hablemos', 'hero.download': 'Descargar CV', 'hero.based': 'Base', 'hero.from': 'De',
      'nav.play': 'Jugar', 'sticker.top': '3 juegos', 'sticker.main': '¡Juega!',
      'hero.status': 'Ahora: QA en el Atlético de Madrid',
      'hero.lede': 'Pruebo, construyo y mantengo software que funciona <strong>en producción</strong>. QA en el Atlético de Madrid y, desde 2019, sistemas y desarrollo web en Andes Systems.',
      'about.title': 'Sobre mí', 'experience.title': 'Experiencia', 'skills.title': 'Stack & herramientas',
      'projects.title': 'Proyectos destacados', 'education.title': 'Formación',
      'education.certs': 'Certificaciones', 'education.languages': 'Idiomas', 'education.volunteer': 'Voluntariado',
      'contact.title1': '¿Construimos algo', 'contact.title2': 'juntos?',
      'contact.lede': 'Abierto a oportunidades en QA, desarrollo web y administración de sistemas. Escríbeme y respondo rápido.',
      'contact.copy': 'Copiar email', 'contact.copied': 'Email copiado ✓', 'contact.cv': 'CV completo:',
      'footer.top': 'Volver arriba ↑',
      present: 'Actualidad', now: 'En activo', more: 'Ver {n} más', less: 'Ver menos',
      year: 'año', years: 'años', month: 'mes', months: 'meses',
      'stat.years': 'años de experiencia práctica', 'stat.roles': 'puestos en activo ahora mismo',
      'stat.tech': 'tecnologías y herramientas', 'stat.langs': 'idiomas de trabajo',
      expected: 'Prevista', start: 'Inicio', grad: 'Graduación',
      loadError: 'No se pudieron cargar los datos del CV.',
      'game.invite': 'arcade abierto: 3 minijuegos aquí abajo ↓',
      term: [
        ['cmd', 'whoami'],
        ['out', 'José Carlos Zorrilla · ingeniero informático en 4.º'],
        ['cmd', 'cat ./ahora.txt'],
        ['ok', '→ QA · Atlético de Madrid        (oct 2026 —)'],
        ['ok', '→ SysAdmin & Web · Andes Systems (2019 —)'],
        ['cmd', 'uptime'],
        ['out', '6+ años manteniendo sistemas en producción'],
        ['cmd', 'git log --oneline -1'],
        ['mute', 'a1f27c9 feat: graduación prevista jun 2027'],
      ],
    },
    en: {
      'nav.about': 'About', 'nav.experience': 'Experience', 'nav.skills': 'Stack', 'nav.projects': 'Projects',
      'nav.education': 'Education', 'nav.contact': 'Contact',
      'hero.talk': "Let's talk", 'hero.download': 'Download CV', 'hero.based': 'Based in', 'hero.from': 'From',
      'nav.play': 'Play', 'sticker.top': '3 games', 'sticker.main': 'Play!',
      'hero.status': 'Now: QA at Atlético de Madrid',
      'hero.lede': 'I test, build and maintain software that runs <strong>in production</strong>. QA at Atlético de Madrid and, since 2019, systems and web development at Andes Systems.',
      'about.title': 'About me', 'experience.title': 'Experience', 'skills.title': 'Stack & tools',
      'projects.title': 'Featured projects', 'education.title': 'Education',
      'education.certs': 'Certifications', 'education.languages': 'Languages', 'education.volunteer': 'Volunteering',
      'contact.title1': 'Shall we build something', 'contact.title2': 'together?',
      'contact.lede': 'Open to opportunities in QA, web development and systems administration. Drop me a line — I reply fast.',
      'contact.copy': 'Copy email', 'contact.copied': 'Email copied ✓', 'contact.cv': 'Full CV:',
      'footer.top': 'Back to top ↑',
      present: 'Present', now: 'Current', more: 'Show {n} more', less: 'Show less',
      year: 'yr', years: 'yrs', month: 'mo', months: 'mos',
      'stat.years': 'years of hands-on experience', 'stat.roles': 'roles held right now',
      'stat.tech': 'technologies & tools', 'stat.langs': 'working languages',
      expected: 'Expected', start: 'Start', grad: 'Graduation',
      loadError: 'Could not load CV data.',
      'game.invite': 'arcade open: 3 mini-games right below ↓',
      term: [
        ['cmd', 'whoami'],
        ['out', 'José Carlos Zorrilla · 4th-year computer engineer'],
        ['cmd', 'cat ./now.txt'],
        ['ok', '→ QA · Atlético de Madrid        (Oct 2026 —)'],
        ['ok', '→ SysAdmin & Web · Andes Systems (2019 —)'],
        ['cmd', 'uptime'],
        ['out', '6+ years keeping systems running in production'],
        ['cmd', 'git log --oneline -1'],
        ['mute', 'a1f27c9 feat: expected graduation Jun 2027'],
      ],
    },
  };

  const ICONS = {
    web: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9.5Z"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"/>',
    qa: '<path d="M9 11l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z"/>',
    ai: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 10h4v4h-4z"/>',
    other: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z" fill="currentColor" stroke="none"/>',
    github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" fill="currentColor" stroke="none"/>',
  };
  const skillIcons = ['web', 'cloud', 'db', 'qa', 'tools', 'ai', 'other'];
  const bentoSpans = ['b-wide', 'b-wide', 'b-mid', 'b-mid', 'b-mid', 'b-wide', 'b-wide'];
  const svg = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  let CV = null;
  let lang = 'es';
  const t = (k) => UI[lang][k] ?? k;
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.es) : v);

  /* ---------- Dates ---------- */
  const parseDate = (s, end = false) => {
    if (!s) return new Date();
    const [y, m] = String(s).split('-').map(Number);
    return m ? new Date(y, m - 1, 1) : new Date(y, end ? 11 : 0, 1);
  };
  const fmtDate = (s) => {
    if (!s) return t('present');
    const [y, m] = String(s).split('-').map(Number);
    if (!m) return String(y);
    const mon = new Date(y, m - 1, 1).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { month: 'short' }).replace('.', '');
    return `${mon.charAt(0).toUpperCase() + mon.slice(1)} ${y}`;
  };
  const duration = (a, b) => {
    // Year-only start dates ("2019") count from the end of that year, so durations never overstate.
    const s = parseDate(a, true), e = b ? parseDate(b, true) : new Date();
    const inclusive = String(a).includes('-') ? 1 : 0;
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + inclusive;
    months = Math.max(1, months);
    const y = Math.floor(months / 12), m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? t('year') : t('years')}`);
    if (m && y < 3) parts.push(`${m} ${m === 1 ? t('month') : t('months')}`);
    return parts.join(' ');
  };

  /* ---------- Render ---------- */
  function renderStatic() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#cvDownload').setAttribute('href', `data/CV_JoseCarlosZorrilla_${lang.toUpperCase()}.pdf`);
    $('#themeToggle').setAttribute('aria-label', lang === 'es' ? 'Cambiar tema' : 'Toggle theme');
  }

  function renderHero(b) {
    const [first, ...rest] = b.shortName.split(' ');
    const firstPart = b.shortName.split(' ').slice(0, 2).join(' ');
    const lastPart = b.shortName.split(' ').slice(2).join(' ') || rest.join(' ');
    $('#heroFirst').textContent = firstPart || first;
    $('#heroLast').textContent = lastPart;
    $('#heroStatus').innerHTML = atleti(esc(t('hero.status')));
    $('#heroRoles').innerHTML = L(b.headline).split('·').map((s) => `<span>${esc(s.trim())}</span>`).join('');
    $('#heroLede').innerHTML = atleti(t('hero.lede'));
    $('#heroLocation').textContent = `${b.location.city}, ${L(b.location.country)}`;
    $('#heroFrom').textContent = L(b.origin) || '';
  }

  // Splits the motto into two balanced lines for the scroll-driven quote band.
  function renderQuote(b) {
    const m = L(b.motto) || '';
    const mid = m.length / 2;
    let cut = -1;
    for (let i = 0; i < m.length; i++) if (m[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    $('#quote1').textContent = cut > 0 ? `“${m.slice(0, cut)}` : `“${m}`;
    $('#quote2').innerHTML = cut > 0 ? `<em>${esc(m.slice(cut + 1))}”</em>` : '';
    $('#footerQuote').textContent = m ? `“${m}”` : '';
  }

  function renderMarquee() {
    const items = CV.skills.flatMap((s) => s.items);
    const html = items.map((i) => `<span>${esc(i)}</span>`).join('');
    $('#marquee').innerHTML = html + html;
  }

  function renderAbout(b) {
    let txt = esc(L(b.summary));
    ['Andes Systems', '6 años', '6 years'].forEach((k) => {
      txt = txt.replace(k, `<mark>${k}</mark>`);
    });
    $('#aboutText').innerHTML = atleti(txt);

    const earliest = CV.work.reduce((min, w) => (String(w.startDate) < min ? String(w.startDate) : min), '9999');
    const yrs = Math.floor((Date.now() - parseDate(earliest, true)) / (365.25 * 864e5));
    const stats = [
      [yrs, '+', t('stat.years')],
      [CV.work.filter((w) => w.current).length, '', t('stat.roles')],
      [CV.skills.reduce((n, s) => n + s.items.length, 0), '+', t('stat.tech')],
      [CV.languages.length, '', t('stat.langs')],
    ];
    $('#stats').innerHTML = stats.map(([v, sup, k]) =>
      `<div class="stat reveal"><div class="stat-v" data-count="${v}">0${sup ? `<sup>${sup}</sup>` : ''}</div><div class="stat-k">${esc(k)}</div></div>`
    ).join('');
  }

  function renderWork() {
    const LIMIT = 5;
    $('#timeline').innerHTML = CV.work.map((w) => {
      const hl = L(w.highlights) || [];
      const extra = hl.length - LIMIT;
      const isAtleti = /Atlético/.test(L(w.company));
      return `<li class="job${isAtleti ? ' job-atleti' : ''}">
        <div class="job-meta reveal">
          <div class="job-dates">${esc(fmtDate(w.startDate))} — ${esc(fmtDate(w.endDate))}</div>
          <div class="job-duration">${esc(duration(w.startDate, w.endDate))}</div>
          ${w.current ? `<span class="job-now"><span class="pulse"></span>${esc(t('now'))}</span>` : ''}
        </div>
        <article class="card job-card reveal">
          <h3>${esc(L(w.position))}</h3>
          <div class="job-company"><strong>${atleti(esc(L(w.company)))}</strong><span class="sep"></span><span>${esc(L(w.location))}</span></div>
          <ul class="bullets">${hl.map((h, i) => `<li class="${i >= LIMIT ? 'hidden' : ''}">${esc(h)}</li>`).join('')}</ul>
          ${extra > 0 ? `<button type="button" class="more-btn" data-n="${extra}" aria-expanded="false">${esc(t('more').replace('{n}', extra))} ↓</button>` : ''}
        </article>
      </li>`;
    }).join('');
  }

  function renderSkills() {
    const n = CV.skills.length;
    $('#hsTotal').textContent = String(n).padStart(2, '0');
    $('#bento').innerHTML = CV.skills.map((s, i) => `
      <article class="card hs-card">
        <div class="hs-card-top"><div class="b-icon">${svg(skillIcons[i] || 'other', 22)}</div><span class="hs-idx">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span></div>
        <h3>${esc(L(s.category))}</h3>
        <div class="chips">${s.items.map((it) => `<span class="chip">${esc(it)}</span>`).join('')}</div>
      </article>`).join('');
  }

  function renderProjects() {
    $('#projectList').innerHTML = CV.projects.map((p, i) => `
      <article class="card project reveal">
        <div class="project-num">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(L(p.name))}</h3>
        <p>${esc(L(p.description))}</p>
        <div class="chips">${(p.keywords || []).map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div>
      </article>`).join('');
  }

  function renderEducation() {
    const e = CV.education[0];
    if (e) {
      const s = parseDate(e.startDate), end = parseDate(e.endDate, true);
      s.setMonth(8); // academic year starts in September
      const pct = Math.min(100, Math.max(0, ((Date.now() - s) / (end - s)) * 100));
      $('#eduMain').innerHTML = `
        <div class="edu-head"><span class="edu-dates">${esc(fmtDate(e.startDate))} — ${esc(fmtDate(e.endDate))}${e.expected ? ` · ${esc(t('expected'))}` : ''}</span></div>
        <h3>${esc(L(e.area))}</h3>
        <p class="edu-inst">${esc(e.institution)} · ${esc(L(e.location))}</p>
        <div class="grad-bar">
          <div class="grad-track"><div class="grad-fill" data-pct="${pct.toFixed(1)}"></div></div>
          <div class="grad-labels"><span>${esc(t('start'))} ${esc(fmtDate(e.startDate))}</span><span>${Math.round(pct)}%</span><span>${esc(t('grad'))} ${esc(fmtDate(e.endDate))}</span></div>
        </div>
        <ul class="bullets">${(L(e.highlights) || []).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`;
    }
    $('#certList').innerHTML = CV.certificates.map((c) => `<li><strong>${esc(L(c.name))}</strong><span>${esc(c.issuer)}</span></li>`).join('');

    const lvl = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    $('#langList').innerHTML = CV.languages.map((l) => {
      const parts = String(l.cefr).split('-').map((x) => lvl[x.trim()] || 0);
      const score = parts.reduce((a, b) => a + b, 0) / parts.length;
      const dots = Array.from({ length: 6 }, (_, i) => {
        const cls = score >= i + 1 ? 'on' : score > i ? 'half' : '';
        return `<i class="${cls}"></i>`;
      }).join('');
      return `<li><div class="lang-row"><strong>${esc(L(l.language))}</strong><span>${esc(L(l.fluency))} · ${esc(l.cefr)}</span></div><div class="lang-dots">${dots}</div></li>`;
    }).join('');

    $('#volList').innerHTML = (L(CV.volunteer) || []).map((v) => `<li>${esc(v)}</li>`).join('');
  }

  function renderContact(b) {
    $('#mailBtn').setAttribute('href', `mailto:${b.email}`);
    $('#mailText').textContent = b.email;
    $('#socials').innerHTML = (b.profiles || []).map((p) => {
      const icon = p.network.toLowerCase();
      return `<a class="social" href="${esc(p.url)}" target="_blank" rel="noopener">${svg(icon, 18)}<span>${esc(p.network)}</span><small>@${esc(p.username)}</small></a>`;
    }).join('');
    if (b.phone) {
      $('#socials').insertAdjacentHTML('beforeend',
        `<a class="social" href="tel:${esc(String(b.phone).replace(/\s+/g, ''))}"><span>${esc(b.phone)}</span></a>`);
    }
    $('#year').textContent = new Date().getFullYear();
    $('#version').textContent = CV.meta.version ? `v${CV.meta.version}` : '';
  }

  function renderAll() {
    const b = CV.basics;
    renderStatic();
    renderHero(b);
    renderMarquee();
    renderAbout(b);
    renderQuote(b);
    renderWork();
    renderSkills();
    renderProjects();
    renderEducation();
    renderContact(b);
    observeReveals();
    runTerminal();
    window.Arcade?.render();
    layoutScrollFx();
  }

  /* ---------- Scroll-driven effects ----------
     1) Stack section: pinned, cards slide horizontally while you scroll down (desktop only;
        phones get a native swipe carousel).
     2) Quote band: its two lines slide in from opposite sides and meet in the middle. */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let hsDist = 0;
  function layoutScrollFx() {
    const sec = $('#skills'), track = $('#bento');
    if (!sec || !track) return;
    const on = !calm();
    sec.classList.toggle('hs-on', on);
    if (!on) { sec.style.height = ''; track.style.transform = ''; updateScrollFx(); return; }
    hsDist = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
    sec.style.height = `${innerHeight + hsDist}px`;
    updateScrollFx();
  }
  function setMeter(p) {
    const n = CV?.skills.length || 1;
    $('#hsBar').style.transform = `scaleX(${p})`;
    $('#hsCount').textContent = String(1 + Math.round(p * (n - 1))).padStart(2, '0');
  }
  function updateScrollFx() {
    const sec = $('#skills');
    if (sec?.classList.contains('hs-on') && hsDist > 0) {
      const p = clamp(-sec.getBoundingClientRect().top / hsDist, 0, 1);
      $('#bento').style.transform = `translate3d(${(-p * hsDist).toFixed(1)}px,0,0)`;
      setMeter(p);
    }
    const q = $('#quote');
    if (q && calm()) {
      $("#quote1").style.transform = ""; $("#quote2").style.transform = ""; q.style.setProperty("--qp", "1");
    } else if (q) {
      const r = q.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight * 0.42 + r.height * 0.5), 0, 1);
      const off = (1 - p) * 38;
      $('#quote1').style.transform = `translate3d(${-off}vw,0,0)`;
      $('#quote2').style.transform = `translate3d(${off}vw,0,0)`;
      q.style.setProperty('--qp', p.toFixed(3));
    }
  }

  /* ---------- Terminal ---------- */
  let termToken = 0;
  async function runTerminal() {
    const el = $('#terminal');
    const token = ++termToken;
    window.Arcade?.stop();
    const lines = t('term');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cls = { cmd: '', out: '', ok: 'ok', mute: 'm' };
    let html = '';
    const paint = (extra = '') => { el.innerHTML = html + extra + '<span class="caret"></span>'; };
    const invite = () => `<span class="m"># ${esc(t('game.invite'))}</span>\n<span class="p">❯</span> `;

    if (reduced) {
      html = lines.map(([k, s]) => (k === 'cmd' ? `<span class="p">❯</span> <span class="c">${esc(s)}</span>` : `<span class="${cls[k]}">${esc(s)}</span>`)).join('\n') + '\n' + invite();
      paint();
      return;
    }
    paint();
    await sleep(500);
    for (const [kind, text] of lines) {
      if (token !== termToken) return;
      if (kind === 'cmd') {
        const prefix = '<span class="p">❯</span> <span class="c">';
        for (let i = 1; i <= text.length; i++) {
          if (token !== termToken) return;
          paint(prefix + esc(text.slice(0, i)) + '</span>');
          await sleep(38 + Math.random() * 50);
        }
        html += prefix + esc(text) + '</span>\n';
        await sleep(260);
      } else {
        html += `<span class="${cls[kind]}">${esc(text)}</span>\n`;
        paint();
        await sleep(140);
      }
    }
    await sleep(300);
    if (token !== termToken) return;
    html += invite();
    paint();
  }

  /* ---------- Interactions ---------- */
  let revealObserver;
  function observeReveals() {
    if (!('IntersectionObserver' in window) || reduced) {
      $$('.reveal').forEach((el) => el.classList.add('in'));
      startCounters(true);
      fillBars();
      return;
    }
    revealObserver?.disconnect();
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.target.querySelector?.('[data-count]') || en.target.matches('.stat')) countUp(en.target.querySelector('[data-count]'));
        if (en.target.querySelector?.('.grad-fill')) fillBars();
        revealObserver.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el, i) => {
      if (el.classList.contains('in')) return;
      el.style.transitionDelay = `${Math.min((i % 4) * 70, 210)}ms`;
      revealObserver.observe(el);
    });
  }
  function countUp(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    const sup = el.querySelector('sup')?.outerHTML || '';
    const t0 = performance.now(), dur = 1300;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.innerHTML = v + sup;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function startCounters(instant) {
    $$('[data-count]').forEach((el) => {
      const sup = el.querySelector('sup')?.outerHTML || '';
      if (instant) el.innerHTML = el.dataset.count + sup; else countUp(el);
    });
  }
  function fillBars() {
    $$('.grad-fill').forEach((el) => { el.style.width = `${el.dataset.pct}%`; });
  }

  function setLang(l) {
    if (!UI[l] || l === lang && CV) return;
    lang = l;
    store.set('lang', l);
    if (CV) renderAll();
  }

  function bind() {
    $$('.lang-switch button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

    $('#themeToggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#09090f' : '#e6e6ee');
      store.set('theme', next);
    });

    document.addEventListener('click', (e) => {
      const more = e.target.closest('.more-btn');
      if (!more) return;
      const open = more.getAttribute('aria-expanded') === 'true';
      const items = $$('.bullets li', more.parentElement).slice(5);
      items.forEach((li) => li.classList.toggle('hidden', open));
      more.setAttribute('aria-expanded', String(!open));
      more.textContent = open ? `${t('more').replace('{n}', more.dataset.n)} ↓` : `${t('less')} ↑`;
    });

    $('#copyMail').addEventListener('click', async () => {
      const mail = CV?.basics?.email;
      if (!mail) return;
      try { await navigator.clipboard.writeText(mail); } catch (e) {
        const ta = Object.assign(document.createElement('textarea'), { value: mail });
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      toast(t('contact.copied'));
    });

    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });

    const nav = $('#nav'), bar = $('.progress');
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.transform = `scaleX(${p})`;
      nav.classList.toggle('scrolled', h.scrollTop > 20);
      updateScrollFx();
    };
    addEventListener('scroll', onScroll, { passive: true });
    let rT;
    addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layoutScrollFx, 120); });
    const vp = $('.hs-viewport');
    vp?.addEventListener('scroll', () => {
      if ($('#skills').classList.contains('hs-on')) return;
      const max = vp.scrollWidth - vp.clientWidth;
      setMeter(max > 0 ? vp.scrollLeft / max : 0);
    }, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window) {
      const links = $$('.nav-links a');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('section[id]').forEach((s) => io.observe(s));
    }
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- Boot ---------- */
  const saved = store.get('lang');
  const urlLang = new URLSearchParams(location.search).get('lang');
  lang = UI[urlLang] ? urlLang : UI[saved] ? saved : 'es';
  renderStatic();
  bind();

  fetch('data/cv.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { CV = data; renderAll(); document.fonts?.ready.then(layoutScrollFx); })
    .catch(() => {
      $('#heroLede').textContent = t('loadError');
      $$('.reveal').forEach((el) => el.classList.add('in'));
    });
})();
