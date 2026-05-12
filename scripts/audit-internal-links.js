'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

// Blog posts use class="article-prose blog-prose prose"; allow extra classes for stable extraction.
const PROSE_REGEX = /<div class="article-prose[^"]*">\s*([\s\S]*?)\s*<\/div>\s*\n\s*<!-- CTA Block -->/;
const PROSE_REGEX_ALT = /<div class="article-prose[^"]*">\s*([\s\S]*?)\s*<\/div>\s*\n\s*<section class="article-cta"/;
const PROSE_REGEX_BLOG = /<div class="article-prose[^"]*">\s*([\s\S]*?)\s*<\/div>\s*\n\s*<section class="section section--tight blog-inline-cta"/;
const INTERNAL_LINK_RE = /href="\/blog\/([^"#?]+)"/g;

function getArticlePaths() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  const paths = [];
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.html') && e.name !== 'index.html') {
      paths.push(path.join(BLOG_DIR, e.name));
    }
    if (e.isDirectory()) {
      const indexPath = path.join(BLOG_DIR, e.name, 'index.html');
      if (fs.existsSync(indexPath)) {
        paths.push(indexPath);
      }
    }
  }
  return paths;
}

function slugFromArticlePath(filePath) {
  if (path.extname(filePath) === '.html' && path.basename(path.dirname(filePath)) === 'blog') {
    return path.basename(filePath, '.html');
  }
  return path.basename(path.dirname(filePath));
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slug = slugFromArticlePath(filePath);

  const match = content.match(PROSE_REGEX) || content.match(PROSE_REGEX_ALT) || content.match(PROSE_REGEX_BLOG);
  if (!match) {
    return { slug, count: 0, linkedSlugs: [], error: 'could not find article-prose block' };
  }

  const proseHtml = match[1];
  const linkedSlugs = [];
  let m;
  INTERNAL_LINK_RE.lastIndex = 0;
  while ((m = INTERNAL_LINK_RE.exec(proseHtml)) !== null) {
    const raw = (m[1] || '').replace(/\/$/, '');
    const slug = raw.replace(/\.html$/i, '');
    if (!slug) continue;
    linkedSlugs.push(slug);
  }

  return { slug, count: linkedSlugs.length, linkedSlugs };
}

function run() {
  const paths = getArticlePaths();
  const results = paths.map((p) => auditFile(p));

  results.sort((a, b) => a.count - b.count);

  console.log(`Audit report: ${results.length} articles\n`);

  let zeroCount = 0;
  for (const r of results) {
    const status = r.count === 0 ? '  <-- needs attention' : '';
    console.log(`  ${r.slug.padEnd(55)} ${String(r.count).padStart(2)} links${status}`);
    if (r.count === 0) zeroCount++;
  }

  console.log(`\nSummary: ${zeroCount} article(s) with 0 internal links.`);
}

run();
