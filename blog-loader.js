let blogPosts = [];

async function loadPostsData() {
    try {
        const response = await fetch('data/posts.json');
        if (response.ok) {
            blogPosts = await response.json();
        }
    } catch (e) {
        console.error('Could not load posts.json:', e);
    }
}

async function loadMarkdownPost(slug) {
    try {
        const url = `posts/${slug}.md`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch post: ${response.status} ${response.statusText}`);
            console.error(`URL attempted: ${url}`);
            return null;
        }
        const markdown = await response.text();
        if (!markdown || markdown.trim().length === 0) {
            console.error('Fetched file is empty');
            return null;
        }
        
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);
        
        if (match) {
            const frontmatter = match[1];
            const content = match[2];
            
            const metadata = {};
            frontmatter.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length) {
                    metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                }
            });
            
            return { metadata, content };
        }
        
        return { metadata: {}, content: markdown };
    } catch (error) {
        console.error('Error loading post:', error);
        if (window.location.protocol === 'file:') {
            console.error('File:// protocol blocks fetch requests. This will work on GitHub Pages.');
        }
        return null;
    }
}

function parseMarkdown(markdown) {
    // Check if marked is available
    if (typeof marked !== 'undefined') {
        // Configure marked renderer to add language classes
        const renderer = new marked.Renderer();
        renderer.code = function(code, lang) {
            const langClass = lang ? `language-${lang}` : '';
            return `<pre><code class="${langClass}">${code}</code></pre>`;
        };
        
        // Configure marked options with Prism highlighting
        marked.setOptions({
            breaks: true,
            gfm: true,
            renderer: renderer,
            highlight: function(code, lang) {
                if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            }
        });
        
        // Process image captions before parsing (custom syntax: ![alt](url)\n*caption*)
        let processedMarkdown = markdown.replace(/!\[(.*?)\]\((.*?)\)\n\*(.*?)\*/gim, (match, alt, url, caption) => {
            return `![${alt}](${url})\n\n<div class="image-caption">${caption}</div>`;
        });
        
        // Parse markdown
        let html = marked.parse(processedMarkdown);
        
        // Wrap images with captions in post-image div
        html = html.replace(/<img src="([^"]+)" alt="([^"]+)">\s*<div class="image-caption">([^<]+)<\/div>/gim, 
            '<div class="post-image"><img src="$1" alt="$2"><p class="image-caption">$3</p></div>');
        
        return html;
    } else {
        // Fallback if marked is not loaded
        console.error('marked.js not loaded');
        return '<p>Error: Markdown parser not available</p>';
    }
}

function estimateReadingTimeMinutesFromText(text) {
    const normalized = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return 0;
    const words = normalized.split(' ').length;
    const WPM = 220;
    return Math.max(1, Math.round(words / WPM));
}

function setReadingTime(minutes) {
    const el = document.getElementById('post-reading-time');
    if (!el) return;
    if (!minutes) {
        el.textContent = '';
        return;
    }
    el.textContent = `${minutes} min read`;
}

function ensureReadingProgressBar() {
    if (document.querySelector('.reading-progress')) return;
    const wrap = document.createElement('div');
    wrap.className = 'reading-progress';
    wrap.setAttribute('aria-hidden', 'true');

    const bar = document.createElement('div');
    bar.className = 'reading-progress__bar';
    wrap.appendChild(bar);
    document.body.appendChild(wrap);
}

function initReadingProgress(articleEl) {
    if (!articleEl) return;
    ensureReadingProgressBar();
    const bar = document.querySelector('.reading-progress__bar');
    if (!bar) return;

    const update = () => {
        const rect = articleEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 1;
        const total = Math.max(1, rect.height - viewportH);
        const progressed = Math.min(total, Math.max(0, -rect.top));
        const pct = Math.max(0, Math.min(1, progressed / total));
        bar.style.width = `${Math.round(pct * 100)}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
}

function injectFocusModeHint() {
    const header = document.querySelector('.post-header');
    if (!header) return;
    
    const hint = document.createElement('div');
    hint.className = 'focus-mode-hint';
    hint.innerHTML = 'Press <kbd>F</kbd> for focus mode';
    hint.setAttribute('aria-label', 'Press F for focus mode');
    
    setTimeout(() => {
        hint.classList.add('visible');
    }, 2000);
    
    header.appendChild(hint);
}

function addCopyButtonsToCodeBlocks(rootEl) {
    if (!rootEl) return;
    const pres = rootEl.querySelectorAll('pre');
    pres.forEach(pre => {
        if (pre.querySelector('.copy-code-btn')) return;
        const code = pre.querySelector('code');
        if (!code) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');

        const getCodeText = () => {
            const text = code.textContent || '';
            return text.replace(/\n$/, '');
        };

        const setState = (label) => {
            btn.textContent = label;
            btn.dataset.state = label.toLowerCase();
        };

        btn.addEventListener('click', async () => {
            const text = getCodeText();
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                setState('Copied');
                setTimeout(() => setState('Copy'), 1100);
            } catch (e) {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    ta.setAttribute('readonly', 'true');
                    ta.style.position = 'absolute';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                    setState('Copied');
                    setTimeout(() => setState('Copy'), 1100);
                } catch (e2) {
                    setState('Nope');
                    setTimeout(() => setState('Copy'), 1100);
                }
            }
        });

        pre.appendChild(btn);
    });
}

async function renderBlogPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('post');
    
    if (!slug) {
        document.querySelector('main').innerHTML = '<div class="container"><h1>No post specified</h1><p>Please provide a post parameter in the URL.</p></div>';
        return;
    }
    
    const post = await loadMarkdownPost(slug);
    if (!post) {
        const errorMsg = window.location.protocol === 'file:' 
            ? `<p>Could not load post: ${slug}</p><p><strong>Note:</strong> File:// protocol blocks fetch requests. This will work correctly when hosted on GitHub Pages (http/https).</p><p>To test locally, push to GitHub and use GitHub Pages, or use a local server temporarily.</p>`
            : `<p>Could not load post: ${slug}. Check the browser console for details.</p>`;
        document.querySelector('main').innerHTML = `<div class="container"><h1>Post not found</h1>${errorMsg}</div>`;
        return;
    }
    
    const { metadata, content } = post;
    const htmlContent = parseMarkdown(content);
    
    document.title = `${metadata.title} - Sagar Gaur`;
    
    const articleContainer = document.getElementById('post-content');
    if (articleContainer) {
        articleContainer.innerHTML = htmlContent;
        // Highlight code blocks with Prism
        if (typeof Prism !== 'undefined') {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                const codeBlocks = articleContainer.querySelectorAll('pre code[class*="language-"]');
                codeBlocks.forEach(block => {
                    Prism.highlightElement(block);
                });
            }, 0);
        }

        const minutes = estimateReadingTimeMinutesFromText(articleContainer.textContent);
        setReadingTime(minutes);
        initReadingProgress(articleContainer);
        addCopyButtonsToCodeBlocks(articleContainer);
        injectFocusModeHint();
    }
    
    const titleElement = document.getElementById('post-title');
    if (titleElement) titleElement.textContent = metadata.title;
    
    const dateElement = document.getElementById('post-date');
    if (dateElement) dateElement.textContent = metadata.date;
    
    const tagElement = document.getElementById('post-tag');
    if (tagElement) tagElement.textContent = metadata.tag;
}

function renderRecentPosts() {
    const container = document.getElementById('recent-posts-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    blogPosts.slice(0, 3).forEach(post => {
        const article = document.createElement('article');
        article.className = 'post-card';
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'post-date';
        dateSpan.textContent = post.date;
        
        const h3 = document.createElement('h3');
        const link = document.createElement('a');
        link.href = post.date === 'Coming Soon' ? '#' : `post.html?post=${post.slug}`;
        link.textContent = post.title;
        h3.appendChild(link);
        
        const p = document.createElement('p');
        p.textContent = post.description;
        
        article.appendChild(dateSpan);
        article.appendChild(h3);
        article.appendChild(p);
        
        container.appendChild(article);
    });
}

function renderAllPosts() {
    const container = document.getElementById('all-posts-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const grouped = {};
    const upcoming = [];
    
    blogPosts.forEach(post => {
        if (post.date === 'Coming Soon') {
            upcoming.push(post);
            return;
        }
        const parsed = new Date(post.date);
        if (isNaN(parsed)) {
            upcoming.push(post);
            return;
        }
        const year = parsed.getFullYear();
        const month = parsed.getMonth();
        const day = parsed.getDate();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push({ ...post, month, day, monthStr: monthNames[month] });
    });
    
    const years = Object.keys(grouped).sort((a, b) => b - a);
    
    years.forEach(year => {
        const yearHeader = document.createElement('h2');
        yearHeader.className = 'index-year';
        yearHeader.textContent = year;
        container.appendChild(yearHeader);
        
        const posts = grouped[year].sort((a, b) => {
            if (b.month !== a.month) return b.month - a.month;
            return b.day - a.day;
        });
        
        const table = document.createElement('div');
        table.className = 'index-table';
        
        posts.forEach(post => {
            const row = document.createElement('div');
            row.className = 'index-row';
            
            const titleLink = document.createElement('a');
            titleLink.href = `post.html?post=${post.slug}`;
            titleLink.className = 'index-title';
            titleLink.textContent = post.title;
            
            const tag = document.createElement('span');
            tag.className = 'index-tag';
            tag.textContent = post.tag;
            
            const date = document.createElement('span');
            date.className = 'index-date';
            date.textContent = `${post.day} ${post.monthStr} ${year}`;
            
            row.appendChild(titleLink);
            row.appendChild(tag);
            row.appendChild(date);
            table.appendChild(row);
        });
        
        container.appendChild(table);
    });
    
    if (upcoming.length > 0) {
        const header = document.createElement('h2');
        header.className = 'index-year upcoming-header';
        header.textContent = 'Upcoming';
        container.appendChild(header);
        
        const table = document.createElement('div');
        table.className = 'index-table';
        
        upcoming.forEach(post => {
            const row = document.createElement('div');
            row.className = 'index-row upcoming';
            
            const title = document.createElement('span');
            title.className = 'index-title';
            title.textContent = post.title;
            
            const tag = document.createElement('span');
            tag.className = 'index-tag';
            tag.textContent = post.tag;
            
            row.appendChild(title);
            row.appendChild(tag);
            table.appendChild(row);
        });
        
        container.appendChild(table);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadPostsData();
    
    const path = window.location.pathname;
    const href = window.location.href;
    
    if (path.includes('post.html') || href.includes('post.html')) {
        await renderBlogPost();
    } else if (path.includes('index.html') || path.endsWith('/')) {
        renderRecentPosts();
    } else if (path.includes('blog.html')) {
        renderAllPosts();
    }
    
    if (typeof applyRandomColors === 'function') applyRandomColors();
});

