// ─── Focus Mode ─────────────────────────────────────────
//
// Press F on a blog post → distraction-free reading.
// Paint: hold Shift + drag → smooth neon light trails.
// Easter egg: type "matrix" on any page.

let focusActive = false;
let secretBuf = '';

function initFocusMode() {
    if (!document.getElementById('post-content')) return;

    document.addEventListener('keydown', (e) => {
        const tag = (document.activeElement || {}).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            focusActive ? exitFocus() : enterFocus();
        }
        if (e.key === 'Escape' && focusActive) {
            e.preventDefault();
            exitFocus();
        }
    });
}

function enterFocus() {
    if (focusActive) return;
    focusActive = true;
    document.documentElement.classList.add('focus-mode');
}

function exitFocus() {
    if (!focusActive) return;
    focusActive = false;
    document.documentElement.classList.remove('focus-mode');
}

// ─── Light-Paint Canvas ─────────────────────────────────
// Hold Shift + drag for smooth glowing strokes.
// Speed controls thickness. Hue drifts as you draw.

function initPaintTrail() {
    let canvas = null;
    let ctx = null;
    let painting = false;
    let points = [];
    let hue = Math.random() * 360;
    let fadeTimer = null;

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'paint-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function scheduleFade() {
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => {
            if (painting) return;
            fadeOut();
        }, 4000);
    }

    function fadeOut() {
        if (!canvas || !ctx) return;
        let opacity = 1;
        const step = () => {
            opacity -= 0.025;
            if (opacity <= 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.opacity = '1';
                return;
            }
            canvas.style.opacity = String(opacity);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    document.addEventListener('mousedown', (e) => {
        if (!e.shiftKey) return;
        if (e.target.closest('a, button, input, textarea, select')) return;
        e.preventDefault();
        ensureCanvas();
        canvas.style.opacity = '1';
        clearTimeout(fadeTimer);
        painting = true;
        hue = Math.random() * 360;
        points = [{ x: e.clientX, y: e.clientY, t: Date.now() }];
    });

    document.addEventListener('mousemove', (e) => {
        if (!painting || !ctx) return;
        const now = Date.now();
        const p = { x: e.clientX, y: e.clientY, t: now };
        points.push(p);
        if (points.length > 4) points.shift();

        drawSegment();
        hue = (hue + 0.8) % 360;
    });

    document.addEventListener('mouseup', endStroke);
    document.addEventListener('mouseleave', endStroke);

    function endStroke() {
        if (!painting) return;
        painting = false;
        points = [];
        scheduleFade();
    }

    function drawSegment() {
        if (points.length < 2) return;
        const a = points[points.length - 2];
        const b = points[points.length - 1];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = Math.max(1, b.t - a.t);
        const speed = dist / dt;

        // Slow = thick, fast = thin
        const lineW = Math.max(2, Math.min(18, 14 - speed * 6));

        ctx.save();

        // Glow layer
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.15)`;
        ctx.lineWidth = lineW + 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        strokeSmooth(a, b);

        // Mid glow
        ctx.strokeStyle = `hsla(${hue}, 95%, 65%, 0.35)`;
        ctx.lineWidth = lineW + 4;
        strokeSmooth(a, b);

        // Core line
        ctx.strokeStyle = `hsla(${hue}, 90%, 80%, 0.9)`;
        ctx.lineWidth = lineW;
        strokeSmooth(a, b);

        // Bright center
        ctx.strokeStyle = `hsla(${hue}, 50%, 95%, 0.7)`;
        ctx.lineWidth = Math.max(1, lineW * 0.3);
        strokeSmooth(a, b);

        ctx.restore();
    }

    function strokeSmooth(a, b) {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(a.x, a.y, mx, my);
        ctx.quadraticCurveTo(b.x, b.y, b.x, b.y);
        ctx.stroke();
    }
}

// ─── Matrix Easter Egg ──────────────────────────────────

function initMatrixEgg() {
    document.addEventListener('keydown', (e) => {
        const tag = (document.activeElement || {}).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        secretBuf += e.key.toLowerCase();
        if (secretBuf.length > 12) secretBuf = secretBuf.slice(-12);

        if (secretBuf.includes('matrix')) {
            secretBuf = '';
            runMatrix();
        }
    });
}

function runMatrix() {
    if (document.getElementById('matrix-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01';
    const fs = 14;
    const cols = Math.floor(canvas.width / fs);
    const drops = Array(cols).fill(1);

    const tid = setInterval(() => {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = fs + 'px monospace';
        for (let i = 0; i < cols; i++) {
            const ch = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(ch, i * fs, drops[i] * fs);
            if (drops[i] * fs > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }, 45);

    setTimeout(() => {
        clearInterval(tid);
        canvas.remove();
        window.removeEventListener('resize', resize);
    }, 8000);
}

// ─── Boot ───────────────────────────────────────────────

function boot() {
    initFocusMode();
    initPaintTrail();
    initMatrixEgg();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
