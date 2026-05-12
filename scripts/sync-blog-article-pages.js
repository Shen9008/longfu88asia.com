'use strict';

/**
 * Align published blog/*.html with the current article template (hero, featured band, TOC).
 * Run from repo root: node scripts/sync-blog-article-pages.js
 * Idempotent: skips files that already include blog-article-hero--editorial.
 */
const fs = require('fs');
const path = require('path');
const { formatDateLong } = require('./lib/normalize-post.js');

const BLOG = path.resolve(__dirname, '../blog');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBasic(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, '·');
}

function extractArticleDates(html) {
  const m = html.match(/"@type":\s*"Article"[\s\S]*?\n\s*}/);
  if (!m) return { published: '', modified: '' };
  const block = m[0];
  const pub = /"datePublished":\s*"([^"]+)"/.exec(block);
  const mod = /"dateModified":\s*"([^"]+)"/.exec(block);
  return {
    published: pub ? pub[1].slice(0, 10) : '',
    modified: mod ? mod[1].slice(0, 10) : '',
  };
}

function patchHtml(html) {
  const h1 = /<h1[^>]*>([^<]+)<\/h1>/.exec(html);
  const titlePlain = h1 ? decodeBasic(h1[1].trim()) : 'Article';

  const subtitleM = /<p class="blog-article-hero__subtitle">([^<]*)<\/p>/.exec(html);
  const sub = subtitleM ? decodeBasic(subtitleM[1]) : '';

  let category = 'Informational';
  let readTime = '5 min read';
  const ey = /<p class="section__eyebrow">([^<]+)<\/p>/.exec(html);
  if (ey) {
    const raw = decodeBasic(ey[1]);
    const parts = raw.split(/\s*·\s*/);
    if (parts.length >= 2) {
      category = parts[0].trim();
      readTime = parts.slice(1).join(' · ').trim();
    }
  }

  const pubM = /<p class="blog-published">([^<]+)<\/p>/.exec(html);
  const publishedDisplay = pubM ? decodeBasic(pubM[1].trim()) : '';
  const { published: pubISO, modified: modISO } = extractArticleDates(html);

  let updatedRow = '';
  if (modISO && pubISO && modISO !== pubISO) {
    const disp = formatDateLong(modISO) || modISO;
    updatedRow = `\n          <p class="blog-updated"><span class="blog-updated__label">Updated</span> <time datetime="${escapeHtml(modISO)}">${escapeHtml(disp)}</time></p>`;
  }

  const shareM = html.match(/<div class="blog-share"[^>]*>[\s\S]*?<\/div>\s*<\/div>/);
  if (!shareM) return { ok: false, reason: 'share block not found' };

  const sb = shareM[0];
  const tw = /href="(https:\/\/twitter.com[^"]+)"/.exec(sb);
  const fb = /href="(https:\/\/www.facebook.com[^"]+)"/.exec(sb);
  const li = /href="(https:\/\/www.linkedin.com[^"]+)"/.exec(sb);

  const timeOpen = pubISO
    ? `<time class="blog-published" datetime="${escapeHtml(pubISO)}">${escapeHtml(publishedDisplay)}</time>`
    : `<span class="blog-published">${escapeHtml(publishedDisplay)}</span>`;

  const newHero = `    <section class="blog-article-hero section section--tight blog-article-hero--editorial" aria-labelledby="blog-article-title">
      <div class="container blog-article-hero__wrap">
        <nav class="blog-breadcrumb" aria-label="Breadcrumb">
          <ol class="blog-breadcrumb__list">
            <li><a href="/index.html">Home</a></li>
            <li class="blog-breadcrumb__sep" aria-hidden="true">/</li>
            <li><a href="/blog/">Blog</a></li>
            <li class="blog-breadcrumb__sep" aria-hidden="true">/</li>
            <li class="blog-breadcrumb__current-wrap" aria-current="page"><span class="blog-breadcrumb__current">${escapeHtml(titlePlain)}</span></li>
          </ol>
        </nav>
        <div class="blog-article-hero__meta-row" role="group" aria-label="Article type and reading time">
          <span class="blog-article-hero__category">${escapeHtml(category)}</span>
          <span class="blog-article-hero__dot" aria-hidden="true">·</span>
          <span class="blog-article-hero__read">${escapeHtml(readTime)}</span>
        </div>
        <h1 id="blog-article-title" class="page-hero__title blog-article-hero__title">${escapeHtml(titlePlain)}</h1>
        <p class="blog-article-hero__subtitle">${escapeHtml(sub)}</p>
        <div class="blog-article-hero__byline">
          ${timeOpen}${updatedRow}
        </div>
        <div class="blog-share" aria-label="Share article">
          <span class="blog-share__label">Share</span>
          <div class="blog-share__links">
            <a class="blog-share__chip" href="${tw ? tw[1] : '#'}" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a class="blog-share__chip" href="${fb ? fb[1] : '#'}" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a class="blog-share__chip" href="${li ? li[1] : '#'}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </section>`;

  let out = html.replace(
    /    <section class="blog-article-hero section section--tight" aria-labelledby="blog-article-title">[\s\S]*?<\/section>/,
    newHero,
  );

  if (out === html) return { ok: false, reason: 'hero block not replaced' };

  const kwM = /<p class="blog-featured__keyword">([^<]*)<\/p>/.exec(out);
  const kw = kwM ? decodeBasic(kwM[1].trim()) : '';
  const alt = escapeHtml(titlePlain.slice(0, 160));

  out = out.replace(
    /<div class="blog-featured blog-featured--photo">/,
    '<div class="blog-featured blog-featured--photo blog-featured--article">',
  );

  out = out.replace(
    /(<img class="blog-featured__img" src="[^"]+") alt="[^"]*"/,
    `$1 alt="${alt}"`,
  );

  if (kwM) {
    out = out.replace(
      /<div class="blog-featured__shade"[^>]*><\/div>\s*\n\s*<p class="blog-featured__keyword">[^<]*<\/p>/,
      `<div class="blog-featured__shade" aria-hidden="true"></div>
        <div class="blog-featured__caption">
          <span class="blog-featured__label">Key topic</span>
          <p class="blog-featured__keyword">${escapeHtml(kw)}</p>
        </div>`,
    );
  }

  out = out.replace(/<article class="container section">/, '<article class="container section section--blog-article-post">');

  return { ok: true, html: out };
}

function main() {
  for (const name of fs.readdirSync(BLOG)) {
    if (!name.endsWith('.html') || name === 'index.html') continue;
    const fp = path.join(BLOG, name);
    const raw = fs.readFileSync(fp, 'utf8');
    if (!raw.includes('blog-article-hero')) continue;
    if (raw.includes('blog-article-hero--editorial')) {
      console.log('skip (already synced):', name);
      continue;
    }
    const { ok, html, reason } = patchHtml(raw);
    if (!ok) {
      console.warn('skip', name, '-', reason);
      continue;
    }
    fs.writeFileSync(fp, html, 'utf8');
    console.log('updated', name);
  }
}

main();
