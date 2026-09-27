'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const today = new Date().toISOString().slice(0, 10);
let xml = fs.readFileSync(SITEMAP, 'utf8');
const updated = xml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
if (updated === xml) {
  console.log('No lastmod tags updated.');
} else {
  fs.writeFileSync(SITEMAP, updated, 'utf8');
  const count = (updated.match(/<lastmod>/g) || []).length;
  console.log(`Updated ${count} lastmod value(s) to ${today} in sitemap.xml`);
}
