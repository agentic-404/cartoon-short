// usage: node render.mjs <outdir> <frames: "a-b" or "1,2,3"> [step] [quality]
// v4: WORKERS=n renders in n parallel Chromium processes (default: min(2, cpu cores) for >24 frames, else 1). RESUME=1 skips frames that exist.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os';
import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
const [,, outdir, spec, step = '1', qual = '0.96'] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
let frames = [];
for (const part of spec.split(',')) { if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let f = a; f <= b; f += +step) frames.push(f); } else frames.push(+part); }
const pad = (f) => `f${String(f).padStart(4, '0')}.jpg`;
if (process.env.RESUME) frames = frames.filter((f) => !fs.existsSync(path.join(outdir, pad(f))));
const NW = process.env.CHILD ? 1 : Math.max(1, +(process.env.WORKERS || (frames.length > 24 ? Math.min(2, os.cpus().length) : 1)));
if (NW > 1 && frames.length) {   // parent: split into contiguous blocks, one child each
  const size = Math.ceil(frames.length / NW), t0 = Date.now(); let fail = 0;
  await Promise.all(Array.from({ length: NW }, (_, i) => frames.slice(i * size, (i + 1) * size)).filter((c) => c.length).map((chunk, i) => new Promise((res) => {
    const c = spawn(process.execPath, [fileURLToPath(import.meta.url), outdir, chunk.join(','), '1', qual], { env: { ...process.env, CHILD: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
    c.stdout.on('data', (d) => { const s = d.toString(); if (/^done|ERR|page error/m.test(s)) process.stdout.write(`[w${i}] ${s}`); });
    c.on('exit', (code) => { if (code) fail++; res(); });
  })));
  console.log(`done ${frames.length} frames with ${NW} workers, ${((Date.now() - t0) / frames.length / 1000).toFixed(2)} s/frame effective${fail ? `, ${fail} worker(s) FAILED (re-run with RESUME=1)` : ''}`);
  process.exit(fail ? 1 : 0);
}
const root = process.env.WEB || path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SC = Math.min(1, +(process.env.SCALE || 1));   // SCALE=0.5 -> half-res preview
const pg = await b.newPage({ viewport: { width: Math.round(1080 * SC), height: Math.round(1920 * SC) } });
pg.on('console', m => { const t = m.text(); if (!/GL Driver Message|Failed to load resource/.test(t)) console.log('PAGE', t); }); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html?s=${SC}${process.env.HASH||""}`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
if (await pg.evaluate(() => window.err)) { console.log('page error'); process.exit(1); }
const t0 = Date.now();
for (const f of frames) {
  const d = await pg.evaluate(([f, q]) => { if (window.location.hash==="#nd") window.DEBUG_ND=1; if (window.location.hash==="#e") window.DEBUG_E=1; window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', q); }, [f, +qual]);
  fs.writeFileSync(path.join(outdir, pad(f)), Buffer.from(d.split(',')[1], 'base64'));
}
console.log(`done ${frames.length} frames, ${((Date.now() - t0) / Math.max(1, frames.length) / 1000).toFixed(2)} s/frame`);
await b.close(); srv.close();
