# SEO cycle report — longfu88asia.com

## Step 1 — Audit (baseline)

### Critical / high priority

1. **Blog URL parity:** Sitemap and canonicals used extensionless `/blog/slug` while static files are `blog/slug.html`, so crawlers and `seo-maintain.ps1` could not align `\<loc\>` with disk. **Fixed:** canonicals, OG URLs, JSON-LD, share links, `sitemap.xml` blog entries, `blog-loader.js`, `blog-article.js`, build helpers (`generate-sitemap.js`, `render-article.js`, `inject-internal-links.js`, `article.template.html`), and one inline article link now use **`.html`** for article URLs.
2. **Broken internal link:** `seasonal-promotions-frequently-featured-on-longfu88asia.html` linked to `/blog/understanding-the-gaming-environment-offered-by-longfu88asia` without a resolvable file path. **Fixed:** `.html` appended.
3. **Maintenance script:** `seo-maintain.ps1` referenced the wrong hostname and scanned `node_modules` HTML. **Fixed:** `longfu88asia.com` in URL resolution; **`node_modules` excluded** from HTML scans.

### Quick wins (already strong / verified)

- Root and hub pages: unique titles, meta descriptions, single H1, self-canonicals, `robots.txt` + sitemap reference.
- Home: `WebSite`, `Organization`, `FAQPage` JSON-LD present; hero image preload for LCP.
- Blog articles: Article + BreadcrumbList schema, `fetchpriority="high"` on hero image, alt + dimensions on featured image.

### Long-term / optional

- Re-run **PageSpeed Insights** on key templates after deploy; tune third-party (GTM) if INP/LCP regress.
- Quarterly content refresh per Step 7.2 in `seo-task.md`.
- Consider Cloudflare Pages **redirect rules** if you want public extensionless `/blog/slug` again while keeping files as `.html` (301 from short URL to `.html`).

### Affected URLs

- All `https://longfu88asia.com/blog/{slug}.html` article URLs (canonical + sitemap).
- `https://longfu88asia.com/sitemap.xml` (blog `<loc>` list).

---

## Steps 2–6 — Actions this cycle

| Step | Action |
|------|--------|
| 2 | Blog listing and sidebar/related scripts now point to `.html` article URLs; template updated for future syncs. `audit-internal-links.js` updated to detect prose in blog layout and `.html` hrefs. |
| 3 | No thin-page rewrites this pass (blog posts already long-form). |
| 4 | Blog grid images: added `width` / `height` (1200×630) for stable layout. |
| 5 | Sitemap regenerated from `blogs.json`; canonical/schema/share alignment for blog posts. |
| 6 | No change to GTM snippet (standard implementation); fonts already use `display=swap`. |

---

## Step 7 — Maintenance

From repo root (monthly):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\seo-maintain.ps1 -CheckSitemap
```

After adding posts, regenerate the blog section of the sitemap:

```bash
node -e "require('./scripts/lib/generate-sitemap.js').generateSitemap()"
```

---

## Completion summary

- **Executed:** Blog URL canonicalization for static hosting; sitemap sync; internal link fix; SEO script hostname + scan scope; blog card image dimensions.
- **Expected impact:** Fewer crawl/index mismatches, valid rich-result URLs, cleaner maintenance signal; marginal CLS help on blog index.
- **Residual risk:** Extensionless URLs may still work locally via `serve.json` rewrites but production should prefer the **`.html`** URLs now declared in sitemap/canonical unless you add edge redirects.
- **Next cycle:** CWV spot-check on mobile; optional meta title tweaks for blog `meta_title` alignment with H1; internal link density audit (`npm run audit:links`).
