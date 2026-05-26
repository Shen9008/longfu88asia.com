'use strict';

require('./load-env.js');

/** Site-relative fallback when CMS image field is empty */
const BLOG_DEFAULT_IMAGE = '/images/blog-default.webp';

const INTENT_GRADIENTS = {
  navigational:
    'linear-gradient(135deg, #0a0a0a 0%, rgba(212,175,55,0.25) 50%, #141414 100%)',
  commercial:
    'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,150,12,0.35) 55%, #0a0a0a 100%)',
  transactional:
    'linear-gradient(135deg, #141414 0%, rgba(212,175,55,0.2) 45%, #0a0a0a 100%)',
  informational:
    'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 55%, #0a0a0a 100%)',
};

const INTENT_CATEGORIES = {
  navigational: 'Getting Started',
  commercial: 'Reviews',
  transactional: 'Guides',
  informational: 'Informational',
};

/**
 * Normalizes a Strapi post to site schema.
 * @param {object} strapiPost - Raw Strapi post (id, title, slug, shortDescription, publishedAt, etc.)
 * @param {object} [opts] - Options
 * @param {string} [opts.searchIntent] - Override search_intent (from Strapi if available)
 * @param {string[]} [opts.relatedPosts] - Slugs for related posts (from existing blogs.json)
 * @returns {object} Normalized post for blogs.json and render
 */
function normalizePost(strapiPost, opts = {}) {
  const slug = strapiPost.slug || strapiPost.documentId || '';
  const title = strapiPost.title || 'Untitled';
  const publishedAt = strapiPost.publishedAt || strapiPost.createdAt || new Date().toISOString();
  const updatedAt = strapiPost.updatedAt || publishedAt;

  const publishedDate = formatDateISO(publishedAt);
  const searchIntent = (opts.searchIntent || strapiPost.search_intent || 'informational').toLowerCase();
  const gradient = INTENT_GRADIENTS[searchIntent] || INTENT_GRADIENTS.informational;
  const category = INTENT_CATEGORIES[searchIntent] || 'Informational';
  const imageFromCms = pickFeaturedImageSrc(strapiPost);

  return {
    slug,
    title,
    meta_title: strapiPost.meta_title || title,
    meta_description: strapiPost.meta_description || strapiPost.shortDescription || '',
    focus_keyword: strapiPost.primary_keyword || strapiPost.focus_keyword || title,
    category,
    search_intent: searchIntent.charAt(0).toUpperCase() + searchIntent.slice(1),
    published_date: publishedDate,
    reading_time: formatReadingTime(strapiPost.reading_time),
    excerpt: strapiPost.shortDescription || strapiPost.excerpt || '',
    placeholder_gradient: strapiPost.placeholder_gradient || gradient,
    related_posts: opts.relatedPosts || [],
    keywords: normalizeKeywords(strapiPost.keywords),
    image: imageFromCms || BLOG_DEFAULT_IMAGE,

    content: strapiPost.content || '',
    toc_json: strapiPost.toc_json || [],
    published_date_formatted: formatDateLong(publishedAt),
    updated_date_iso: formatDateISO(updatedAt),
  };
}

/**
 * Reads url from Strapi media (v4 populate), nested object, or plain string.
 * @param {*} value
 * @returns {string}
 */
function extractMediaUrl(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const s = value.trim();
    return s || '';
  }
  if (typeof value !== 'object') return '';
  if (typeof value.url === 'string') {
    const u = value.url.trim();
    if (u) return u;
  }
  const data = value.data;
  if (Array.isArray(data) && data[0]) {
    const attrs = data[0].attributes || data[0];
    const url = attrs && typeof attrs.url === 'string' ? attrs.url.trim() : '';
    if (url) return url;
  } else if (data && typeof data === 'object' && data.attributes && typeof data.attributes.url === 'string') {
    const u = data.attributes.url.trim();
    if (u) return u;
  }
  if (value.attributes && typeof value.attributes.url === 'string') {
    const u = value.attributes.url.trim();
    if (u) return u;
  }
  return '';
}

function strapiAssetsBase() {
  const explicit =
    (process.env.STRAPI_MEDIA_ORIGIN && process.env.STRAPI_MEDIA_ORIGIN.trim()) ||
    (process.env.STRAPI_UPLOAD_URL && process.env.STRAPI_UPLOAD_URL.trim());
  if (explicit) return explicit.replace(/\/$/, '');
  const api = (
    process.env.STRAPI_API_URL && process.env.STRAPI_API_URL.trim()
      ? process.env.STRAPI_API_URL.trim()
      : 'http://localhost:1337/api'
  ).replace(/\/$/, '');
  return api.replace(/\/?api\/?$/i, '') || 'http://localhost:1337';
}

/**
 * If path is upload-relative (/uploads/...), prepend Strapi host for remote use.
 */
function normalizeCmsAssetUrl(raw) {
  let s = String(raw).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = strapiAssetsBase();
  const pathPart = s.startsWith('/') ? s : `/${s}`;
  return `${base}${pathPart}`;
}

/**
 * First populated image-related field from the Strapi payload.
 */
function pickFeaturedImageSrc(strapiPost) {
  const keys = [
    'image',
    'featured_image',
    'featuredImage',
    'cover',
    'thumbnail',
    'hero_image',
    'heroImage',
  ];
  for (const k of keys) {
    const u = extractMediaUrl(strapiPost[k]);
    if (u) return normalizeCmsAssetUrl(u);
  }
  return '';
}

function normalizeKeywords(raw) {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function formatReadingTime(val) {
  if (val == null || val === '') return '5 min read';
  const num = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (!isNaN(num)) return `${num} min read`;
  return typeof val === 'string' ? val : '5 min read';
}

function formatDateISO(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

function formatDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validates required fields. Throws if invalid.
 */
function validatePost(normalized) {
  if (!normalized.slug || !normalized.title) {
    throw new Error('Post must have slug and title');
  }
  return true;
}

module.exports = {
  normalizePost,
  validatePost,
  formatDateISO,
  formatDateLong,
  BLOG_DEFAULT_IMAGE,
  extractMediaUrl,
  pickFeaturedImageSrc,
};
