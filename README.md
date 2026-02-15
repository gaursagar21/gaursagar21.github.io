# Sagar Gaur - Personal Website

A minimal, neobrutal design website focused on writing and sharing ideas.

## Design Philosophy

This site uses a **neobrutal** aesthetic:
- Bold, thick black borders
- High contrast colors
- No shadows or gradients (except on hover)
- Simple, blocky design
- Monospace font (Courier New)

## Structure

- `index.html` - Home page with recent posts
- `blog.html` - Full list of writing
- `about.html` - About page
- `posts/` - Individual blog posts
- `style.css` - All styling in one file
- `artwork/` - Artwork images
- `photos/` - Photo images
- `scripts/optimize_images.py` - Local image optimizer (macOS)

## Adding New Posts

Posts are now written in **Markdown** (`.md` files) instead of HTML!

1. Create a new markdown file in the `posts/` folder (e.g., `my-new-post.md`)
2. Add frontmatter with metadata at the top
3. Write your post content in markdown below the frontmatter
4. Add the post to `blog.html` and optionally to `index.html`

### Markdown Post Template

Create a file like `posts/my-post.md`:

```markdown
---
title: "Your Post Title"
date: "Feb 10, 2026"
tag: "Category"
description: "Brief description of your post"
---

Your post content here in **markdown** format.

## Heading 2

Write paragraphs naturally.

### Heading 3

- Bullet point 1
- Bullet point 2

You can use `inline code` and:

\`\`\`python
# Code blocks
def hello():
    print("Hello, world!")
\`\`\`

**Bold text** and *italic text* work too.

[Links work like this](https://example.com)

![Images work too](../images/your-image.png)
*Add a caption by putting text in italics on the next line*
```

### Adding the Post to Your Lists

In `blog.html` and `index.html`, add a link like this:

```html
<article class="post-item">
    <div class="post-meta">
        <span class="post-date">Feb 10, 2026</span>
        <span class="post-tag">Category</span>
    </div>
    <h2><a href="post.html?post=my-post">Your Post Title</a></h2>
    <p>Brief description here.</p>
</article>
```

The URL format is `post.html?post=FILENAME` (without the .md extension).

### Markdown Features Supported

- Headings: `#`, `##`, `###`
- Bold: `**text**`
- Italic: `*text*`
- Links: `[text](url)`
- Images: `![alt](url)`
- Images with captions: `![alt](url)\n*caption*`
- Code: `` `code` ``
- Code blocks: ` ```language\ncode\n``` `
- Lists: `- item`
- Paragraphs: Just write naturally with blank lines between

## Customization

### Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --black: #000000;
    --white: #FFFFFF;
    --bg: #FAFAFA;
    --accent: #FF6B6B;  /* Red accent */
    --yellow: #FFE66D;  /* Yellow highlight */
    --blue: #4ECDC4;    /* Blue tags */
}
```

### Links

Update your personal links in:
- `index.html` - Hero section social links
- `about.html` - Contact section
- All files - Email addresses

## Hosting on GitHub Pages

1. Create a repository on GitHub
2. Push these files
3. Go to Settings → Pages
4. Select your branch and root folder
5. Your site will be live at `https://[username].github.io/[repo-name]`

## Features

- ✅ Multi-page structure
- ✅ Blog/writing focused
- ✅ Neobrutal design
- ✅ Fully responsive
- ✅ No JavaScript required
- ✅ No build process
- ✅ Fast and lightweight
- ✅ Easy to customize

## Browser Support

Works on all modern browsers. The design uses basic CSS features that are widely supported.

## License

Feel free to use this template for your own site.

## Image optimization (recommended)

If you add lots of images, it’s easy for file sizes to get huge (even if the dimensions look fine). This repo includes a small helper script that optimizes images using macOS’s built-in `sips`.

- **Drop originals** into:
  - `artwork/_raw/`
  - `photos/_raw/`
- **Run**:

```bash
python3 scripts/optimize_images.py
```

This will write optimized versions into `artwork/` and `photos/` (resized to max 2000px, JPEG quality 80 by default).
