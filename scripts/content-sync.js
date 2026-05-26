'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { fetchPosts, getPostsSyncConfig } = require('./lib/fetch-posts.js');
const { normalizePost, validatePost } = require('./lib/normalize-post.js');
const { renderArticle } = require('./lib/render-article.js');
const { generateSitemap } = require('./lib/generate-sitemap.js');

const ROOT = path.resolve(__dirname, '..');
const BLOGS_JSON_PATH = path.join(ROOT, 'assets/data/blogs.json');
const BLOG_DIR = path.join(ROOT, 'blog');

const BLOGS_JSON_FIELDS = [
  'slug', 'title', 'meta_title', 'meta_description', 'focus_keyword',
  'category', 'search_intent', 'published_date', 'reading_time',
  'excerpt', 'placeholder_gradient', 'related_posts', 'keywords',
  'image',
  'cms_updated_at',
  'content_hash',
  'synced_at',
];

function sortBlogsByLatestSyncFirst(a, b) {
  const tb = new Date(b.synced_at || b.published_date || 0).getTime();
  const ta = new Date(a.synced_at || a.published_date || 0).getTime();
  if (tb !== ta) return tb - ta;
  return String(b.slug).localeCompare(String(a.slug));
}

function toBlogsEntry(normalized, raw, contentHash) {
  const entry = {};
  for (const k of BLOGS_JSON_FIELDS) {
    if (normalized[k] !== undefined) entry[k] = normalized[k];
  }
  entry.cms_updated_at = raw.updatedAt || raw.publishedAt || entry.cms_updated_at || null;
  entry.content_hash = contentHash;
  return entry;
}

function getPostSlug(raw) {
  return raw.slug || raw.documentId || '';
}

function siteBrandToken(siteDomain) {
  const domain = String(siteDomain || '').trim().toLowerCase();
  if (!domain) return '';
  return domain.split('.')[0];
}

function isAllowedForSite(slug, siteDomain) {
  const token = siteBrandToken(siteDomain);
  if (!token) return true;
  return String(slug || '').toLowerCase().includes(token);
}

function filterPostsForSite(posts, siteDomain) {
  const cfg = getPostsSyncConfig();
  if (!cfg.applySiteFilter || !siteDomain) return posts;

  const allowed = [];
  let skipped = 0;
  for (const raw of posts) {
    const slug = getPostSlug(raw);
    if (!slug) continue;
    if (isAllowedForSite(slug, siteDomain)) {
      allowed.push(raw);
    } else {
      skipped++;
    }
  }

  if (skipped > 0) {
    console.warn(`Skipped ${skipped} off-site post(s) not matching ${siteBrandToken(siteDomain)} in slug.`);
  }

  return allowed;
}

function pruneDisallowedBlogEntries(blogs, siteDomain) {
  const token = siteBrandToken(siteDomain);
  if (!token) return blogs;

  const kept = [];
  for (const entry of blogs) {
    if (isAllowedForSite(entry.slug, siteDomain)) {
      kept.push(entry);
      continue;
    }

    const htmlPath = path.join(BLOG_DIR, `${entry.slug}.html`);
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
    console.log(`  - [Removed] off-site blog entry: ${entry.slug}`);
  }

  return kept;
}

function sanitizeRelatedPosts(blogs, siteDomain) {
  const allowedSlugs = new Set(blogs.map((b) => b.slug));
  for (const entry of blogs) {
    if (!Array.isArray(entry.related_posts)) continue;
    entry.related_posts = entry.related_posts.filter((slug) => {
      if (!allowedSlugs.has(slug)) return false;
      return isAllowedForSite(slug, siteDomain);
    });
  }
  return blogs;
}

function hashContent(content) {
  const s = typeof content === 'string' ? content : JSON.stringify(content || '');
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

function cmsUpdatedMs(existing) {
  if (!existing) return 0;
  const raw = existing.cms_updated_at || existing.synced_at || 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function apiUpdatedMs(raw) {
  const t = new Date(raw.updatedAt || raw.publishedAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * @returns {'create'|'update'|'skip'}
 */
function getSyncAction(raw, existing, opts) {
  const slug = getPostSlug(raw);
  if (!slug) return 'skip';

  if (!existing) return 'create';
  if (opts.force) return 'update';

  const apiHash = hashContent(raw.content);
  if (existing.content_hash) {
    if (apiHash !== existing.content_hash) return 'update';
  } else if (opts.refresh) {
    return 'update';
  }

  if (apiUpdatedMs(raw) > cmsUpdatedMs(existing)) return 'update';

  return 'skip';
}

function getRelatedSlugs(blogs, currentSlug, opts = {}, limit = 3) {
  const searchIntent = (opts.searchIntent || 'informational').toLowerCase();
  const category = (opts.category || '').toLowerCase();
  const siteDomain = getPostsSyncConfig().siteDomain;
  const others = blogs.filter((b) => b.slug !== currentSlug && isAllowedForSite(b.slug, siteDomain));

  const sameIntent = others.filter((b) => (b.search_intent || '').toLowerCase() === searchIntent).sort(sortBlogsByLatestSyncFirst);
  const sameIntentSlugs = new Set(sameIntent.map((b) => b.slug));
  const sameCategory = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && category && (b.category || '').toLowerCase() === category)
    .sort(sortBlogsByLatestSyncFirst);
  const sameCategorySlugs = new Set(sameCategory.map((b) => b.slug));
  const rest = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && !sameCategorySlugs.has(b.slug))
    .sort(sortBlogsByLatestSyncFirst);

  const merged = [...sameIntent, ...sameCategory, ...rest];
  return merged.slice(0, limit).map((b) => b.slug);
}

function loadBlogsJson() {
  try {
    const raw = fs.readFileSync(BLOGS_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBlogsJson(blogs) {
  const json = JSON.stringify(blogs, null, 2);
  fs.writeFileSync(BLOGS_JSON_PATH, json + '\n', 'utf8');
}

function upsertBlogEntry(blogs, entry) {
  const idx = blogs.findIndex((b) => b.slug === entry.slug);
  if (idx >= 0) {
    blogs[idx] = entry;
  } else {
    blogs.push(entry);
  }
  return blogs;
}

function classifyPosts(strapiPosts, existingBySlug, opts) {
  const classified = [];

  for (const raw of strapiPosts) {
    const slug = getPostSlug(raw);
    if (!slug) continue;

    const existing = existingBySlug.get(slug);
    const action = getSyncAction(raw, existing, opts);
    if (action === 'skip') continue;

    classified.push({ raw, slug, action, existing });
  }

  classified.sort((a, b) => {
    if (a.action !== b.action) {
      return a.action === 'create' ? -1 : 1;
    }
    return new Date(a.raw.publishedAt || 0) - new Date(b.raw.publishedAt || 0);
  });

  return classified;
}

function buildDailyWorklist(strapiPosts, existingBlogs) {
  const existingSlugsAtStart = new Set(existingBlogs.map((b) => b.slug));
  const byPublishedAsc = (a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0);

  const creates = strapiPosts
    .filter((raw) => {
      const slug = getPostSlug(raw);
      return slug && !existingSlugsAtStart.has(slug);
    })
    .sort(byPublishedAsc)
    .slice(0, 1)
    .map((raw) => ({ raw, slug: getPostSlug(raw), action: 'create' }));

  const updates = strapiPosts
    .filter((raw) => {
      const slug = getPostSlug(raw);
      return slug && existingSlugsAtStart.has(slug);
    })
    .sort(byPublishedAsc)
    .map((raw) => ({ raw, slug: getPostSlug(raw), action: 'update' }));

  return [...creates, ...updates];
}

function parseLimitArg() {
  const idx = process.argv.indexOf('--limit');
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  const n = parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function selectPostsToProcess(classified, opts) {
  let result;
  if (opts.force || opts.refresh) {
    result = classified;
  } else {
    const creates = classified.filter((p) => p.action === 'create');
    if (opts.all) result = creates;
    else result = creates.slice(0, 1);
  }

  if (opts.limit != null) {
    result = result.slice(0, opts.limit);
  }

  return result;
}

function processWorklist(toProcess, existingBlogs) {
  let blogs = [...existingBlogs];

  for (const { raw, slug, action } of toProcess) {
    const related = getRelatedSlugs(blogs, slug, {
      searchIntent: raw.search_intent,
      category: raw.category,
    });

    const normalized = normalizePost(raw, {
      relatedPosts: related,
    });
    validatePost(normalized);

    const label = action === 'create' ? 'New' : 'Updated';
    console.log(`  - [${label}] ${normalized.title} (${slug})`);
    renderArticle(normalized, { blogs });

    const entry = toBlogsEntry(normalized, raw, hashContent(raw.content));
    entry.synced_at = new Date().toISOString();
    blogs = upsertBlogEntry(blogs, entry);
  }

  blogs.sort(sortBlogsByLatestSyncFirst);
  saveBlogsJson(blogs);
  generateSitemap();
}

async function run() {
  const all = process.argv.includes('--all');
  const refresh = process.argv.includes('--refresh');
  const force = process.argv.includes('--force');
  const daily = process.argv.includes('--daily');
  const limit = parseLimitArg();
  const apiUrl = process.env.STRAPI_API_URL || 'http://localhost:1337/api';

  if (daily && (force || refresh || all)) {
    console.warn('--daily ignores --force, --refresh, and --all.');
  } else if (force && refresh) {
    console.warn('Both --force and --refresh set; --force wins (re-rendering all API posts).');
  }

  const syncCfg = getPostsSyncConfig({ baseUrl: apiUrl });

  console.log('Fetching posts from API...');
  let strapiPosts = await fetchPosts({ baseUrl: apiUrl });
  strapiPosts = filterPostsForSite(strapiPosts, syncCfg.siteDomain);

  let existingBlogs = loadBlogsJson();
  const blogsBeforePrune = JSON.stringify(existingBlogs);
  existingBlogs = pruneDisallowedBlogEntries(existingBlogs, syncCfg.siteDomain);
  existingBlogs = sanitizeRelatedPosts(existingBlogs, syncCfg.siteDomain);
  const blogsChangedByPrune = JSON.stringify(existingBlogs) !== blogsBeforePrune;

  let toProcess;
  let mode;

  if (daily) {
    toProcess = buildDailyWorklist(strapiPosts, existingBlogs);
    if (limit != null) toProcess = toProcess.slice(0, limit);
    mode = 'daily';
  } else {
    const existingBySlug = new Map(existingBlogs.map((b) => [b.slug, b]));
    const syncOpts = { all, refresh, force, limit };
    const classified = classifyPosts(strapiPosts, existingBySlug, syncOpts);
    toProcess = selectPostsToProcess(classified, syncOpts);
    mode = force ? 'force re-sync' : refresh ? 'refresh' : all ? 'publish all new' : 'publish';
  }

  if (toProcess.length === 0) {
    if (blogsChangedByPrune) {
      saveBlogsJson(existingBlogs);
      generateSitemap();
      console.log('Removed off-site blog entries from blogs.json and sitemap.xml.');
    }
    if (daily) {
      console.log('Daily sync: nothing to do (no synced posts to refresh and no new articles).');
    } else if (force) {
      console.log('No published posts returned from API.');
    } else if (refresh) {
      console.log('No articles to update (API content unchanged since last sync).');
    } else {
      console.log('No new articles to publish.');
    }
    return;
  }

  const creates = toProcess.filter((p) => p.action === 'create').length;
  const updates = toProcess.filter((p) => p.action === 'update').length;
  console.log(`Sync (${mode}): ${toProcess.length} article(s) (${creates} new, ${updates} updated)...`);

  processWorklist(toProcess, existingBlogs);
  console.log('Done. blogs.json and sitemap.xml updated.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
