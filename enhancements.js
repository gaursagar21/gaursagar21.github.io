// ─── Enhancements: back-to-top, scroll reveal, easter eggs ───────────────

(function() {
    'use strict';

    // ─── Back to top ─────────────────────────────────────────────────────
    function initBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = '↑';
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(btn);

        let ticking = false;
        function updateVisibility() {
            const show = window.scrollY > 400;
            btn.classList.toggle('visible', show);
        }
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => { updateVisibility(); ticking = false; });
                ticking = true;
            }
        }, { passive: true });
        updateVisibility();
    }

    // ─── Scroll reveal ──────────────────────────────────────────────────
    function initScrollReveal() {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            document.querySelectorAll('main > section, .hero-section, .page-header, .content-box').forEach(el => {
                el.classList.add('reveal', 'visible');
            });
            return;
        }

        const sections = document.querySelectorAll('main > section, .hero-section, .page-header, .content-box');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('reveal', 'visible');
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );
        sections.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // ─── Toast (for easter eggs) ────────────────────────────────────────
    function showToast(message, durationMs) {
        let el = document.getElementById('toast-egg');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast-egg';
            el.className = 'toast-egg';
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(el._tid);
        el._tid = setTimeout(() => {
            el.classList.remove('show');
        }, durationMs || 2200);
    }

    // ─── Konami code → confetti ─────────────────────────────────────────
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    function tryBeep() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.value = 880;
            g.gain.value = 0.035;
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            setTimeout(() => {
                o.stop();
                ctx.close();
            }, 90);
        } catch (_) {
            // ignore
        }
    }

    function fireConfetti() {
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

        const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'];
        const pieces = [];
        const N = 80;
        for (let i = 0; i < N; i++) {
            pieces.push({
                x: w / 2,
                y: h / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: -4 - Math.random() * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                rotation: Math.random() * 360,
                spin: (Math.random() - 0.5) * 20,
            });
        }

        let start = null;
        function step(t) {
            if (!start) start = t;
            const dt = (t - start) / 1000;
            ctx.clearRect(0, 0, w, h);
            let alive = 0;
            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 28 * 0.016;
                p.rotation += p.spin;
                if (p.y < h + 20) alive++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            if (alive > 0) requestAnimationFrame(step);
            else canvas.remove();
        }
        requestAnimationFrame(step);
    }

    function activateKonamiMode() {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        showToast('KONAMI MODE unlocked', 2600);
        tryBeep();
        fireConfetti();
        setTimeout(() => fireConfetti(), 320);

        // Kick off rainbow mode if available (from script.js)
        window.__sgEggs?.rainbow?.start?.();

        if (prefersReduced) return;
        document.documentElement.classList.add('konami-mode');
        clearTimeout(activateKonamiMode._tid);
        activateKonamiMode._tid = setTimeout(() => {
            document.documentElement.classList.remove('konami-mode');
        }, 9000);
    }

    function onKeyDown(e) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        
        const expected = KONAMI[konamiIndex];
        const pressed = e.key;
        // Normalize: arrow keys are exact match, letters are case-insensitive
        let matches = false;
        if (expected.startsWith('Arrow')) {
            matches = pressed === expected;
        } else {
            matches = pressed.toLowerCase() === expected.toLowerCase();
        }
        
        if (matches) {
            konamiIndex++;
            if (konamiIndex === KONAMI.length) {
                konamiIndex = 0;
                e.preventDefault();
                activateKonamiMode();
            }
        } else {
            konamiIndex = 0;
        }
    }

    // Expose a tiny API for the command palette (hidden)
    window.__sgEggs = window.__sgEggs || {};
    window.__sgEggs.konami = activateKonamiMode;
    window.__sgEggs.confetti = fireConfetti;
    window.__sgEggs.toast = showToast;

    // ─── Triple-click logo → toast ─────────────────────────────────────
    function initLogoEgg() {
        const logo = document.querySelector('.logo');
        if (!logo) return;
        let clicks = 0;
        let t = 0;
        let navTid = null;

        // Delay navigation slightly so triple-click can occur without redirect.
        logo.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - t > 500) clicks = 0;
            t = now;
            clicks++;

            // Prevent immediate navigation; we'll navigate manually if needed.
            e.preventDefault();
            e.stopPropagation();

            if (navTid) clearTimeout(navTid);

            if (clicks >= 3) {
                clicks = 0;
                showToast('Built with ☕');
                return;
            }

            navTid = setTimeout(() => {
                clicks = 0;
                window.location.href = logo.href;
            }, 260);
        });
    }

    // ─── Boot ───────────────────────────────────────────────────────────
    function boot() {
        initBackToTop();
        initScrollReveal();
        initLogoEgg();
        document.addEventListener('keydown', onKeyDown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
