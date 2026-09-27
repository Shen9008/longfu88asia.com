'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'site.json'), 'utf8'),
);
const origin = String(site.domain || 'https://longfu88asia.com').replace(/\/$/, '');
const sitemapUrl = `${origin}/sitemap.xml`;

console.log(`Sitemap URL: ${sitemapUrl}`);
console.log(
  'Google/Bing sitemap ping URLs are deprecated (often 404/410). Submit the sitemap in Google Search Console instead.',
);

const pings = [
  ['Google (legacy)', `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`],
  ['Bing (legacy)', `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`],
];

for (const [label, url] of pings) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    console.log(`${label}: HTTP ${res.status} (informational only)`);
  } catch (err) {
    console.warn(`${label}: ${err.message}`);
  }
}
