'use strict';

/**
 * Merge blog featured strip into hero as a right-column image (split layout).
 * Run: node scripts/split-blog-hero-layout.js
 */
const fs = require('fs');
const path = require('path');

const BLOG = path.resolve(__dirname, '../blog');

function splitHero(html) {
  const useCRLF = html.includes('\r\n');
  let work = html.replace(/\r\n/g, '\n');

  if (work.includes('blog-article-hero__wrap--split')) {
    return { changed: false, html };
  }

  const blockRe =
    /(          <\/div>\n        <\/div>\n)      <\/div>\n    <\/section>\n\n    <section class="container section section--tight blog-featured-section">\s*([\s\S]*?)    <\/section>/;

  const m = work.match(blockRe);
  if (!m || !/<div class="container blog-article-hero__wrap">\n/.test(work)) {
    return { changed: false, html };
  }

  let work2 = work.replace(
    /<div class="container blog-article-hero__wrap">\n/,
    '<div class="container blog-article-hero__wrap blog-article-hero__wrap--split">\n        <div class="blog-article-hero__text">\n',
  );

  let block = m[2].trim();
  block = block.replace(
    /<div class="blog-featured blog-featured--photo blog-featured--article">/,
    '<div class="blog-featured blog-featured--photo blog-featured--article blog-featured--hero-aside">',
  );

  const indented = block
    .split('\n')
    .map((line) => {
      const t = line.trim();
      return t ? `          ${t}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const replacement = `${m[1]}        </div>\n        <div class="blog-article-hero__media">\n${indented}\n        </div>\n      </div>\n    </section>`;

  const nextLF = work2.replace(blockRe, replacement);
  if (nextLF === work2) {
    return { changed: false, html };
  }
  let next = nextLF;
  if (useCRLF) next = next.replace(/\n/g, '\r\n');
  return { changed: true, html: next };
}

function main() {
  for (const name of fs.readdirSync(BLOG)) {
    if (!name.endsWith('.html') || name === 'index.html') continue;
    const fp = path.join(BLOG, name);
    const raw = fs.readFileSync(fp, 'utf8');
    const { changed, html } = splitHero(raw);
    if (changed) {
      fs.writeFileSync(fp, html, 'utf8');
      console.log('split hero:', name);
    }
  }
}

main();
