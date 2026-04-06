/**
 * Build WebP (and small PNG favicons) from images/ source folders.
 * Run: npm install && npm run optimize-images
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imgRoot = path.join(root, 'images');
const gamesDir = path.join(imgRoot, 'games');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function toWebp(src, dest, { width, height, quality = 82, fit = 'cover', position = 'attention' } = {}) {
  let p = sharp(src);
  const meta = await p.metadata();
  if (width || height) {
    p = sharp(src).resize(width, height, {
      fit,
      position: fit === 'cover' ? position : 'centre',
      withoutEnlargement: true,
    });
  }
  await p.webp({ quality, effort: 5 }).toFile(dest);
}

async function toPngResize(src, dest, size) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

async function main() {
  ensureDir(gamesDir);

  const hb = (...p) => path.join(imgRoot, 'Hero Banner', ...p);
  const slot = (...p) => path.join(imgRoot, 'Slots', ...p);
  const live = (...p) => path.join(imgRoot, 'Live Casino', 'Top live casino games', ...p);
  const sports = (...p) => path.join(imgRoot, 'Sports', ...p);

  const heroW = 1400;
  const heroOpts = { width: heroW, quality: 82, fit: 'cover', position: 'centre' };

  const jobs = [
    [hb('Home-Main Visual.jpg'), path.join(imgRoot, 'hero-home-main.webp'), heroOpts],
    [hb('Home.jpg'), path.join(imgRoot, 'hero-home.webp'), heroOpts],
    [hb('About.jpg'), path.join(imgRoot, 'hero-about.webp'), heroOpts],
    [hb('Live Casino.jpg'), path.join(imgRoot, 'hero-live-casino.webp'), heroOpts],
    [hb('Slot.jpg'), path.join(imgRoot, 'hero-slots.webp'), heroOpts],
    [hb('Sportsbook.jpg'), path.join(imgRoot, 'hero-sports.webp'), heroOpts],
    [hb('Payments.jpg'), path.join(imgRoot, 'hero-payments.webp'), heroOpts],
    [hb('Promotions.jpg'), path.join(imgRoot, 'hero-promotions.webp'), heroOpts],
    [hb('Trust.jpg'), path.join(imgRoot, 'hero-trust.webp'), heroOpts],
    [hb('Malaysia.jpg'), path.join(imgRoot, 'hero-malaysia.webp'), heroOpts],
    [
      hb('Promotions.jpg'),
      path.join(imgRoot, 'cta-promo.webp'),
      { width: 400, height: 160, quality: 80, fit: 'cover', position: 'centre' },
    ],
    [
      path.join(imgRoot, 'Site logo.png'),
      path.join(imgRoot, 'logo.webp'),
      { height: 44, quality: 88, fit: 'inside' },
    ],
    [slot('Popular games', 'Sweet Bonanza.jpg'), path.join(gamesDir, 'slot-sweet-bonanza.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Popular games', 'Gates of Olympus.jpg'), path.join(gamesDir, 'slot-gates-olympus.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Popular games', 'Orb collectors.jpg'), path.join(gamesDir, 'slot-orb-collectors.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Popular games', 'Fruit & lines_.jpg'), path.join(gamesDir, 'slot-fruit-lines.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Top jackpot games', 'Safari-linked progressives.jpg'), path.join(gamesDir, 'jp-safari.webp'), { width: 560, quality: 82, fit: 'cover' }],
    [slot('Top jackpot games', 'Must-drop timers.jpg'), path.join(gamesDir, 'jp-must-drop.webp'), { width: 560, quality: 82, fit: 'cover' }],
    [slot('Top jackpot games', 'Hold & win Orb collectors.jpg'), path.join(gamesDir, 'jp-hold-win.webp'), { width: 560, quality: 82, fit: 'cover' }],
    [slot('Megaways', 'Bonanza Megaways.jpg'), path.join(gamesDir, 'mw-bonanza.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Megaways', 'The Dog House.jpg'), path.join(gamesDir, 'mw-dog-house.webp'), { width: 480, quality: 82, fit: 'cover' }],
    /* Filename uses U+2019 apostrophe (e.g. Gonzo's Quest.jpg on disk) */
    [slot('Megaways', 'Gonzo\u2019s Quest.jpg'), path.join(gamesDir, 'mw-gonzo.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [slot('Megaways', 'Curse of the Werewolf.jpg'), path.join(gamesDir, 'mw-werewolf.webp'), { width: 480, quality: 82, fit: 'cover' }],
    [live('Lightning Roulette.jpg'), path.join(gamesDir, 'live-lightning-roulette.webp'), { width: 520, quality: 82, fit: 'cover' }],
    [live('No-commission baccarat.jpg'), path.join(gamesDir, 'live-baccarat-nc.webp'), { width: 520, quality: 82, fit: 'cover' }],
    [live('Blackjack party.jpg'), path.join(gamesDir, 'live-blackjack-party.webp'), { width: 520, quality: 82, fit: 'cover' }],
    [live('Baccarat icon.png'), path.join(gamesDir, 'live-icon-baccarat.webp'), { width: 160, height: 160, quality: 85, fit: 'contain' }],
    [live('Blackjack icon.png'), path.join(gamesDir, 'live-icon-blackjack.webp'), { width: 160, height: 160, quality: 85, fit: 'contain' }],
    [live('Lightning Roulette icon.png'), path.join(gamesDir, 'live-icon-roulette.webp'), { width: 160, height: 160, quality: 85, fit: 'contain' }],
    [sports('1.png'), path.join(gamesDir, 'sports-strip-1.webp'), { width: 420, quality: 82, fit: 'cover' }],
    [sports('2.png'), path.join(gamesDir, 'sports-strip-2.webp'), { width: 420, quality: 82, fit: 'cover' }],
    [sports('3.png'), path.join(gamesDir, 'sports-strip-3.webp'), { width: 420, quality: 82, fit: 'cover' }],
  ];

  for (const [src, dest, opts] of jobs) {
    if (!fs.existsSync(src)) {
      console.error('Missing source:', src);
      process.exitCode = 1;
      continue;
    }
    await toWebp(src, dest, opts);
    console.log('Wrote', path.relative(root, dest));
  }

  const favSrc = path.join(imgRoot, 'Favicon.png');
  if (!fs.existsSync(favSrc)) {
    console.error('Missing', favSrc);
    process.exitCode = 1;
  } else {
    await sharp(favSrc).resize(32, 32, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(imgRoot, 'favicon.webp'));
    await toPngResize(favSrc, path.join(imgRoot, 'favicon.png'), 32);
    await toPngResize(favSrc, path.join(imgRoot, 'apple-touch-icon.png'), 180);
    console.log('Wrote favicon.webp, favicon.png, apple-touch-icon.png');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
