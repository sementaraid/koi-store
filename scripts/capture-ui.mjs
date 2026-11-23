// Full-page screenshots of every Koi Store screen (storefront + admin), desktop
// and mobile, as a reference set for UI redesign work.
//
// Run it through scripts/capture-ui.sh, which runs this file inside the
// Playwright Docker image (no Playwright install in the repo).
//
// Env (all optional):
//   STORE_URL       default https://koi.sunar.dev
//   ADMIN_URL       default https://koi-backoffice.sunar.dev
//   BUYER_EMAIL     default budi@koi.dev            (seeded buyer)
//   FARMER_EMAIL    default sakura.koi.farm@koi.dev (seeded demo farmer, D-003)
//   ADMIN_EMAIL     default admin@koi.dev
//   PASSWORD        default supersecret             (seed password, dev data only)
//   OUT_DIR         default ui-reference/<date>
//   ONLY            comma list of sessions to run: guest,buyer,farmer,admin
import { chromium } from '/app/node_modules/playwright-core/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const env = process.env;
const STORE = env.STORE_URL ?? 'https://koi.sunar.dev';
const ADMIN = env.ADMIN_URL ?? 'https://koi-backoffice.sunar.dev';
const PASSWORD = env.PASSWORD ?? 'supersecret';
const OUT = env.OUT_DIR ?? `ui-reference/${new Date().toISOString().slice(0, 10)}`;
const ONLY = env.ONLY?.split(',').map((s) => s.trim());

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
};

// A page is either a fixed path or `{ from, match }`: open each `from` page and
// use the first link whose path matches, so dynamic ids come from real data.
const INFO = ['panduan', 'rekber', 'pembayaran', 'karantina', 'garansi', 'sertifikat',
  'bantuan', 'kontak', 'kemitraan', 'syarat', 'privasi', 'regulasi'];

const SESSIONS = [
  {
    name: 'guest',
    base: STORE,
    app: 'storefront',
    pages: [
      ['beranda', '/'],
      ['lelang', '/lelang'],
      ['lelang-detail', { from: ['/lelang', '/'], match: /^\/lelang\/[^/]+$/ }],
      ['lelang-live', { from: ['/lelang', '/'], match: /^\/lelang\/[^/]+\/live$/,
        fallback: { from: ['/lelang', '/'], match: /^\/lelang\/[^/]+$/, suffix: '/live' } }],
      ['katalog', '/katalog'],
      ['toko', '/toko'],
      ['produk-detail', { from: ['/toko', '/katalog', '/'], match: /^\/produk\/[^/]+$/ }],
      ['kategori', '/kategori'],
      ['kategori-detail', { from: ['/kategori'], match: /^\/kategori\/[^/]+$/ }],
      ['mitra', '/mitra'],
      ['mitra-detail', { from: ['/mitra'], match: /^\/mitra\/[^/]+$/ }],
      ['pengiriman', '/pengiriman'],
      ['keranjang', '/keranjang'],
      ['masuk', '/masuk'],
      ['daftar', '/daftar'],
      ['lupa-sandi', '/lupa-sandi'],
      ['atur-sandi', '/atur-sandi'],
      ['404', '/halaman-tidak-ada'],
      ...INFO.map((slug) => [`info-${slug}`, `/${slug}`])
    ]
  },
  {
    name: 'buyer',
    base: STORE,
    app: 'storefront',
    login: { path: '/masuk', email: env.BUYER_EMAIL ?? 'budi@koi.dev' },
    pages: [
      ['akun', '/akun'],
      ['akun-pesanan', '/akun/pesanan'],
      ['akun-pesanan-detail', { from: ['/akun/pesanan'], match: /^\/akun\/pesanan\/[^/]+$/ }],
      ['akun-menang', '/akun/menang'],
      ['akun-saldo', '/akun/saldo'],
      ['akun-topup', '/akun/topup'],
      ['akun-alamat', '/akun/alamat'],
      ['akun-pesan', '/akun/pesan'],
      ['akun-ulasan', '/akun/ulasan'],
      ['akun-pengaturan', '/akun/pengaturan'],
      ['akun-kebun-daftar', '/akun/kebun'],
      ['keranjang', '/keranjang'],
      ['lelang-detail', { from: ['/lelang', '/'], match: /^\/lelang\/[^/]+$/ }]
    ]
  },
  {
    name: 'farmer',
    base: STORE,
    app: 'storefront',
    login: { path: '/masuk', email: env.FARMER_EMAIL ?? 'sakura.koi.farm@koi.dev' },
    pages: [
      ['kebun', '/akun/kebun'],
      ['kebun-beranda', '/akun/kebun/beranda'],
      ['kebun-lelang-baru', '/akun/kebun/lelang/baru'],
      ['kebun-lelang-detail', { from: ['/akun/kebun/beranda', '/akun/kebun'],
        match: /^\/akun\/kebun\/lelang\/(?!baru$)[^/]+$/ }],
      ['kebun-terjual', '/akun/kebun/terjual']
    ]
  },
  {
    name: 'admin',
    base: ADMIN,
    app: 'admin',
    pages: [['masuk', '/masuk']],
    login: { path: '/masuk', email: env.ADMIN_EMAIL ?? 'admin@koi.dev' },
    authedPages: [
      ['dasbor', '/'],
      ['kebun', '/kebun'],
      ['klaim', '/klaim'],
      ['laporan', '/laporan'],
      ['lelang', '/lelang'],
      ['lelang-langsung', '/lelang/langsung'],
      ['pengaturan-biaya', '/pengaturan/biaya'],
      ['pengguna', '/pengguna'],
      ['pengguna-detail', { from: ['/pengguna'], match: /^\/pengguna\/[^/]+$/ }],
      ['saldo-koreksi', '/saldo/koreksi'],
      ['saldo-topup', '/saldo/topup']
    ]
  }
];

/** Wait for the page to settle without hanging on live/polling screens. */
async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  // Scroll through once so lazy images and in-view animations render.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function findLink(page, base, { from, match, suffix = '' }) {
  for (const src of from) {
    await page.goto(base + src, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const href of hrefs) {
      const p = new URL(href, base).pathname;
      if (new URL(href, base).origin === new URL(base).origin && match.test(p)) return p + suffix;
    }
  }
  return null;
}

async function resolvePath(page, base, target) {
  if (typeof target === 'string') return target;
  return (await findLink(page, base, target)) ??
    (target.fallback ? findLink(page, base, target.fallback) : null);
}

async function login(page, base, { path: loginPath, email }) {
  await page.goto(base + loginPath, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith(loginPath), { timeout: 20000 }),
    page.click('button[type="submit"]')
  ]);
}

async function shoot(page, base, dir, index, name, target, results, label) {
  const file = path.join(dir, `${String(index).padStart(2, '0')}-${name}.png`);
  const entry = { session: label, name, file };
  try {
    const route = await resolvePath(page, base, target);
    if (!route) throw new Error('no matching link found (no data for this page?)');
    entry.url = base + route;
    const res = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    entry.status = res?.status();
    entry.finalUrl = page.url();
    await settle(page);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`ok   ${label} ${name} ${entry.status} ${route}`);
  } catch (err) {
    entry.error = String(err.message ?? err).split('\n')[0];
    console.log(`FAIL ${label} ${name}: ${entry.error}`);
  }
  results.push(entry);
}

const browser = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox'] });
const results = [];

for (const session of SESSIONS) {
  if (ONLY && !ONLY.includes(session.name)) continue;
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const label = `${session.name}/${vpName}`;
    const dir = path.join(OUT, session.app, vpName, session.name);
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({ ...vp, ignoreHTTPSErrors: true, locale: 'id-ID' });
    const page = await context.newPage();
    let i = 1;

    // Admin's login page is captured logged out, the rest after login.
    const before = session.authedPages ? session.pages : [];
    for (const [name, target] of before) await shoot(page, session.base, dir, i++, name, target, results, label);

    if (session.login) {
      try {
        await login(page, session.base, session.login);
      } catch (err) {
        console.log(`FAIL ${label} login as ${session.login.email}: ${err.message.split('\n')[0]}`);
        results.push({ session: label, name: 'login', error: err.message.split('\n')[0] });
        await context.close();
        continue;
      }
    }

    const after = session.authedPages ?? session.pages;
    for (const [name, target] of after) await shoot(page, session.base, dir, i++, name, target, results, label);
    await context.close();
  }
}

await browser.close();
await writeFile(path.join(OUT, 'index.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.error);
console.log(`\n${results.length - failed.length} captured, ${failed.length} failed -> ${OUT}`);
