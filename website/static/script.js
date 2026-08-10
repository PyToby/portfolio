/* ============================================================
   TOBY@PORTFOLIO — hacker edition · shared effects
   matrix rain · boot sequence · reveals · clock · spotlight · toast
   ============================================================ */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- static fill when motion is reduced ---------- */
  if (reducedMotion) {
    document.querySelectorAll('[data-cmd]').forEach((el) => {
      el.textContent = el.dataset.cmd || '';
    });
    document.querySelectorAll('[data-type]').forEach((el) => {
      el.textContent = el.dataset.type || '';
    });
  }

  /* ---------- matrix rain ---------- */
  const canvas = document.getElementById('matrix');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const chars = '01<>/{}[]$#@%&*+=';
    const fontSize = 15;
    let w = 0, h = 0, cols = 0, drops = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.ceil(w / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }

    function frame() {
      // fade previous frame → trail
      ctx.fillStyle = 'rgba(5, 8, 7, 0.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      for (let i = 0; i < cols; i++) {
        const ch = chars[(Math.random() * chars.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const r = Math.random();
        if (r > 0.965) ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';     // amber sparkle
        else if (r > 0.92) ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';  // cyan sparkle
        else ctx.fillStyle = 'rgba(110, 231, 183, 0.85)';
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.985) drops[i] = Math.random() * -30;
        drops[i] += 0.32 + Math.random() * 0.25;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
      frame(); // one static frame, no motion
    } else {
      let timer = setInterval(frame, 48);
      document.addEventListener('visibilitychange', () => {
        clearInterval(timer);
        if (!document.hidden) timer = setInterval(frame, 48);
      });
    }
  }

  /* ---------- boot sequence (once per session, skippable) ---------- */
  let bootDone = false;
  function markBooted() {
    if (bootDone) return;
    bootDone = true;
    document.documentElement.classList.add('booted');
    window.dispatchEvent(new Event('toby:booted'));
  }

  const boot = document.getElementById('boot');
  if (boot && !reducedMotion && !sessionStorage.getItem('toby-booted-v2')) {
    sessionStorage.setItem('toby-booted-v2', '1');
    const log = document.getElementById('boot-log');
    const lines = [
      '> INITIALIZING portfolio.shell v2.0',
      '> ESTABLISHING SECURE UPLINK ......... [OK]',
      '> DECRYPTING PROFILE ................. [OK]',
      '> LOADING MODULES [about][projects][skills][contact]',
      '> ACCESS GRANTED: WELCOME, VISITOR',
    ];
    lines.forEach((line, i) => {
      const p = document.createElement('p');
      p.className = 'boot-line';
      p.innerHTML = line.replace(/\[OK\]/g, '<span class="ok">[OK]</span>');
      log.appendChild(p);
      setTimeout(() => p.classList.add('show'), 140 + i * 250);
    });

    function finish() {
      if (boot.classList.contains('done')) return;
      boot.classList.add('done');
      setTimeout(() => { boot.remove(); markBooted(); }, 340);
    }
    // total: 140 + 5*250 + 700 ≈ 2.1s — then snappy exit
    setTimeout(finish, 140 + lines.length * 250 + 720);
    boot.addEventListener('click', finish);
    window.addEventListener('keydown', finish, { once: true });
  } else if (boot) {
    boot.remove();
    markBooted();
  }

  /* ---------- scroll reveals ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reducedMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            el.classList.add('in');
            const cmd = el.matches('[data-cmd]')
              ? el
              : el.querySelector('[data-cmd]:not([data-typed])');
            if (cmd) {
              cmd.dataset.typed = '1';
              const full = cmd.dataset.cmd;
              cmd.textContent = '';
              let i = 0;
              (function step() {
                cmd.textContent = full.slice(0, ++i);
                if (i < full.length) setTimeout(step, 16 + Math.random() * 26);
              })();
            }
            io.unobserve(el);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => {
        el.classList.add('in');
        const cmd = el.matches('[data-cmd]') ? el : el.querySelector('[data-cmd]');
        if (cmd) cmd.textContent = cmd.dataset.cmd;
      });
    }
  }

  /* ---------- live clock + date + uptime ---------- */
  const nowStr = () => new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC+2';
  document.querySelectorAll('[data-date]').forEach((el) => { el.textContent = nowStr(); });

  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    // elements with data-clock-full keep the timezone suffix; the nav clock
    // shows it in its label instead
    const tickClock = () => clocks.forEach((el) => {
      el.textContent = el.hasAttribute('data-clock-full') ? nowStr() : nowStr().replace(' UTC+2', '');
    });
    tickClock();
    setInterval(tickClock, 1000);
  }

  const uptimeEl = document.querySelector('[data-uptime]');
  if (uptimeEl) {
    const start = Date.now();
    const pad = (n) => String(n).padStart(2, '0');
    setInterval(() => {
      const s = ((Date.now() - start) / 1000) | 0;
      uptimeEl.textContent = pad((s / 3600) | 0) + ':' + pad(((s / 60) | 0) % 60) + ':' + pad(s % 60);
    }, 1000);
  }

  /* ---------- spotlight that follows the cursor (spring-smoothed) ---------- */
  if (finePointer) {
    document.querySelectorAll('.card-spot').forEach((card) => {
      let cx = 50, cy = 50, tx = 50, ty = 50, raf = null;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        cx = ((e.clientX - r.left) / r.width) * 100;
        cy = ((e.clientY - r.top) / r.height) * 100;
        if (!raf) loop();
      });
      function loop() {
        tx += (cx - tx) * 0.16;
        ty += (cy - ty) * 0.16;
        card.style.setProperty('--mx', tx.toFixed(2) + '%');
        card.style.setProperty('--my', ty.toFixed(2) + '%');
        if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) raf = requestAnimationFrame(loop);
        else raf = null;
      }
    });
  }

  /* ---------- toast ---------- */
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  window.showToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  /* ---------- easter egg: sudo ---------- */
  let keyBuf = '';
  window.addEventListener('keydown', (e) => {
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    keyBuf = (keyBuf + e.key.toLowerCase()).slice(-4);
    if (keyBuf === 'sudo') {
      keyBuf = '';
      if (window.showToast) window.showToast('access denied. visitor privileges only');
    }
  });

  /* ---------- active nav section ---------- */
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const map = {};
    navLinks.forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    const ids = Object.keys(map);
    if (ids.length) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const link = map[entry.target.id];
            if (!link) continue;
            navLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        },
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
      );
      ids.forEach((id) => io.observe(document.getElementById(id)));
    }
  }
})();
