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

    document.querySelectorAll('.now-label').forEach(el => {
        el.style.color = getRandomColor();
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
    filtered = filtered.slice(0, 9);

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
    // Cmd/Ctrl+K: open palette
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        e.preventDefault();
        openPalette();
        return;
    }

    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        e.preventDefault();
        openPalette();
    }
    if (e.key === 'Escape') closePalette();
});

// ─── Footer Hint ─────────────────────────────────────

function injectKeyboardHint() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const hint = document.createElement('div');
    hint.className = 'kbd-hint';
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    const mod = isMac ? '⌘' : 'Ctrl';
    hint.innerHTML = `Press <kbd>/</kbd> or <kbd>${mod}</kbd><kbd>K</kbd> to jump anywhere`;
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
    } catch (e) { /* now.json not available */ }
}

// ─── Init ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    applyRandomColors();
    injectKeyboardHint();
    loadNowSection();
});
