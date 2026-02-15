const colors = [
    '#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#1DD1A1',
    '#FFA502', '#FF6348', '#5F27CD', '#00D2D3',
    '#C44569', '#F8B500', '#6C5CE7', '#A29BFE',
    '#FD79A8', '#FDCB6E', '#74B9FF', '#81ECEC'
];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function applyRandomColors() {
    document.querySelectorAll('.link-button').forEach(button => {
        button.style.backgroundColor = getRandomColor();
        button.style.color = '#000';
    });

    const logo = document.querySelector('.logo');
    if (logo) logo.style.backgroundColor = getRandomColor();

    document.querySelectorAll('.post-header').forEach(el => {
        el.style.borderBottomColor = getRandomColor();
    });

    document.querySelectorAll('.content-box h2').forEach(el => {
        el.style.borderBottomColor = getRandomColor();
    });

    document.querySelectorAll('.page-header h1').forEach(el => {
        el.style.borderBottomColor = getRandomColor();
    });

    document.querySelectorAll('.recent-posts h2').forEach(el => {
        el.style.borderBottomColor = getRandomColor();
    });

    document.querySelectorAll('.post-tag').forEach(tag => {
        tag.style.backgroundColor = getRandomColor();
        tag.style.color = '#000';
    });

    applyNowLabelColors();
}

function applyNowLabelColors() {
    const labels = Array.from(document.querySelectorAll('.now-label'));
    if (!labels.length) return;

    // Normal mode: keep all "Now" headers the same color.
    // Konami / rainbow mode: keep it loud and varied.
    const isKonami = document.documentElement.classList.contains('konami-mode');
    const isRainbow = document.documentElement.getAttribute('data-rainbow') === 'true';

    if (isKonami || isRainbow) {
        labels.forEach(el => {
            el.style.color = getRandomColor();
        });
        return;
    }

    const c = getRandomColor();
    labels.forEach(el => {
        el.style.color = c;
    });
}

// ─── Dark Mode ───────────────────────────────────────

function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    updateToggleIcon(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const theme = html.getAttribute('data-theme');
            const next = theme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateToggleIcon(next);
        });
    }
}

function updateToggleIcon(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = theme === 'dark' ? '[light]' : '[dark]';
}

// ─── Command Palette ─────────────────────────────────

const STATIC_PAGES = [
    { type: 'page', title: 'Home', url: 'index.html' },
    { type: 'page', title: 'Writing', url: 'blog.html' },
    { type: 'page', title: 'About', url: 'about.html' },
    { type: 'page', title: 'Tech Radar', url: 'radar.html' },
    { type: 'page', title: 'Artwork', url: 'art.html' },
    { type: 'page', title: 'Photos', url: 'photos.html' },
    { type: 'page', title: 'Books', url: 'books.html' },
];

let paletteItems = null;
let paletteEl = null;
let paletteSel = 0;

async function loadPaletteItems() {
    if (paletteItems) return paletteItems;
    const items = [...STATIC_PAGES];
    try {
        const posts = await (await fetch('data/posts.json')).json();
        posts.forEach(p => {
            if (p.date !== 'Coming Soon') {
                items.push({ type: 'post', title: p.title, url: `post.html?post=${p.slug}`, meta: p.tag });
            }
        });
    } catch (e) { /* posts unavailable */ }
    try {
        const books = await (await fetch('data/books.json')).json();
        books.forEach(b => {
            items.push({ type: 'book', title: b.title, url: 'books.html', meta: b.author });
        });
    } catch (e) { /* books unavailable */ }
    paletteItems = items;
    return items;
}

function createPalette() {
    const overlay = document.createElement('div');
    overlay.className = 'cmd-overlay';
    overlay.innerHTML = `
        <div class="cmd-palette">
            <div class="cmd-input-row">
                <span class="cmd-prompt">&gt;</span>
                <input type="text" class="cmd-input" placeholder="Where to?" spellcheck="false" autocomplete="off">
            </div>
            <div class="cmd-results"></div>
            <div class="cmd-foot">
                <span><kbd>↑↓</kbd> navigate</span>
                <span><kbd>enter</kbd> go</span>
                <span><kbd>esc</kbd> close</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.cmd-input');
    const results = overlay.querySelector('.cmd-results');

    overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) closePalette();
    });

    input.addEventListener('input', () => {
        paletteSel = 0;
        renderPaletteResults(input.value, results);
    });

    input.addEventListener('keydown', (e) => {
        const items = results.querySelectorAll('.cmd-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            paletteSel = Math.min(paletteSel + 1, items.length - 1);
            updatePaletteSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            paletteSel = Math.max(paletteSel - 1, 0);
            updatePaletteSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const active = items[paletteSel];
            if (active?.dataset.secret) {
                closePalette();
                if (active.dataset.secret === 'coffee') showToast('☕ Built with coffee');
                if (active.dataset.secret === 'rainbow') startRainbowMode();
                if (active.dataset.secret === 'paint') showToast('Hold Shift and drag anywhere');
                if (active.dataset.secret === 'matrix' && typeof runMatrix === 'function') runMatrix();
                if (active.dataset.secret === 'konami') triggerKonamiMode();
                return;
            }
            if (active?.dataset.url) window.location.href = active.dataset.url;
        } else if (e.key === 'Escape') {
            closePalette();
        }
    });

    return overlay;
}

function renderPaletteResults(query, container) {
    if (!paletteItems) return;
    const q = query.toLowerCase().trim();
    let filtered = paletteItems;
    if (q) {
        filtered = paletteItems
            .map(item => {
                const title = item.title.toLowerCase();
                const meta = (item.meta || '').toLowerCase();
                const type = item.type.toLowerCase();
                let score = 0;
                if (title.startsWith(q)) score = 3;
                else if (title.includes(q)) score = 2;
                else if (meta.includes(q) || type.includes(q)) score = 1;
                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);
    }
    // Hidden easter eggs: only show when you know what to type.
    const secrets = [];
    if (q === 'coffee') secrets.push({ type: 'secret', title: '☕ Coffee break', secret: 'coffee' });
    if (q === 'rainbow') secrets.push({ type: 'secret', title: '🌈 Rainbow mode', secret: 'rainbow' });
    if (q === 'konami') secrets.push({ type: 'secret', title: '🕹 Konami Mode', secret: 'konami' });
    if (q === 'matrix') secrets.push({ type: 'secret', title: '🟩 Matrix rain', secret: 'matrix' });
    if (q === 'egg' || q === 'eggs' || q === 'easter' || q === 'easteregg' || q === 'easter-egg') {
        secrets.push(
            { type: 'secret', title: '🕹 Konami Mode', secret: 'konami' },
            { type: 'secret', title: '🟩 Matrix rain', secret: 'matrix' },
            { type: 'secret', title: '🌈 Rainbow mode', secret: 'rainbow' },
            { type: 'secret', title: '🎨 Paint trail (Shift + drag)', secret: 'paint' },
            { type: 'secret', title: '☕ Coffee break', secret: 'coffee' }
        );
    }
    filtered = [...secrets, ...filtered].slice(0, 9);

    container.innerHTML = '';
    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cmd-empty';
        empty.textContent = 'Nothing found.';
        container.appendChild(empty);
        return;
    }

    filtered.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'cmd-item' + (i === paletteSel ? ' active' : '');
        el.dataset.url = item.url || '';
        if (item.secret) el.dataset.secret = item.secret;

        const type = document.createElement('span');
        type.className = 'cmd-type';
        type.textContent = item.type;

        const title = document.createElement('span');
        title.className = 'cmd-title';
        title.textContent = item.title;

        el.appendChild(type);
        el.appendChild(title);

        if (item.meta) {
            const meta = document.createElement('span');
            meta.className = 'cmd-meta';
            meta.textContent = item.meta;
            el.appendChild(meta);
        }

        el.addEventListener('click', () => {
            if (item.secret) {
                closePalette();
                if (item.secret === 'coffee') showToast('☕ Built with coffee');
                if (item.secret === 'rainbow') startRainbowMode();
                if (item.secret === 'paint') showToast('Hold Shift and drag anywhere');
                if (item.secret === 'matrix' && typeof runMatrix === 'function') runMatrix();
                if (item.secret === 'konami') triggerKonamiMode();
                return;
            }
            if (item.url) window.location.href = item.url;
        });
        el.addEventListener('mouseenter', () => {
            paletteSel = i;
            updatePaletteSelection(container.querySelectorAll('.cmd-item'));
        });

        container.appendChild(el);
    });
}

function updatePaletteSelection(items) {
    items.forEach((el, i) => {
        el.classList.toggle('active', i === paletteSel);
        if (i === paletteSel) el.scrollIntoView({ block: 'nearest' });
    });
}

async function openPalette() {
    if (!paletteEl) paletteEl = createPalette();
    await loadPaletteItems();
    paletteEl.classList.add('open');
    const input = paletteEl.querySelector('.cmd-input');
    input.value = '';
    paletteSel = 0;
    renderPaletteResults('', paletteEl.querySelector('.cmd-results'));
    requestAnimationFrame(() => input.focus());
}

function closePalette() {
    if (paletteEl) paletteEl.classList.remove('open');
}

// Global keyboard listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (rainbowInterval) stopRainbowMode();
        else closePalette();
        return;
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        e.preventDefault();
        openPalette();
    }
});

// ─── Secret palette & rainbow mode ────────────────────

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
    el._tid = setTimeout(() => el.classList.remove('show'), durationMs || 2200);
}

let rainbowInterval = null;
function startRainbowMode() {
    if (rainbowInterval) return;
    document.documentElement.setAttribute('data-rainbow', 'true');
    rainbowInterval = setInterval(() => applyRandomColors(), 450);
    showToast('🌈 Rainbow mode — press Esc to exit', 3000);
}
function stopRainbowMode() {
    if (rainbowInterval) {
        clearInterval(rainbowInterval);
        rainbowInterval = null;
    }
    document.documentElement.removeAttribute('data-rainbow');
}

function triggerKonamiMode() {
    // Prefer the full experience from enhancements.js if available
    if (window.__sgEggs?.konami) {
        window.__sgEggs.konami();
        return;
    }

    // Fallback (in case enhancements.js is cached/failed to load)
    startRainbowMode();
    document.documentElement.classList.add('konami-mode');
    showToast('KONAMI MODE', 2400);
    clearTimeout(triggerKonamiMode._tid);
    triggerKonamiMode._tid = setTimeout(() => {
        document.documentElement.classList.remove('konami-mode');
    }, 9000);
}

// Allow other scripts (konami / palette) to trigger rainbow mode
window.__sgEggs = window.__sgEggs || {};
window.__sgEggs.rainbow = {
    start: startRainbowMode,
    stop: stopRainbowMode,
};

// ─── Footer Hint ─────────────────────────────────────

function injectKeyboardHint() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const hint = document.createElement('div');
    hint.className = 'kbd-hint';
    hint.innerHTML = `Press <kbd>/</kbd> to jump anywhere`;
    hint.style.cursor = 'pointer';
    hint.addEventListener('click', () => openPalette());
    footer.appendChild(hint);
}

// ─── "Now" Section ───────────────────────────────────

async function loadNowSection() {
    const container = document.getElementById('now-section');
    if (!container) return;
    try {
        const res = await fetch('data/now.json');
        if (!res.ok) return;
        const data = await res.json();

        container.innerHTML = '';

        const header = document.createElement('h2');
        header.textContent = 'Now';
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'now-grid';

        data.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'now-row';

            const label = document.createElement('span');
            label.className = 'now-label';
            label.textContent = item.label;

            const value = document.createElement('span');
            value.className = 'now-value';
            value.textContent = item.value;

            row.appendChild(label);
            row.appendChild(value);
            grid.appendChild(row);
        });

        container.appendChild(grid);

        if (data.updated) {
            const updated = document.createElement('span');
            updated.className = 'now-updated';
            updated.textContent = `Updated ${data.updated}`;
            container.appendChild(updated);
        }

        // Now labels are created dynamically, so color them after render.
        applyNowLabelColors();
    } catch (e) { /* now.json not available */ }
}

// ─── Init ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    applyRandomColors();
    injectKeyboardHint();
    loadNowSection();
});
