import puppeteer from 'puppeteer-core';
import fs from 'fs';

/**
 * Scant een video op vaste intervallen en legt elk frame vast.
 *
 * Route: via YouTube zelf, niet via de embed op de pagina. Daar is het beeld ruim
 * twee keer zo groot en verdwijnt de bedieningsbalk zodra de muis wegbeweegt, zodat
 * naambalkjes en open ondertiteling onbedekt in beeld staan.
 *
 * Gebruik: npx tsx tmp/video-scan.mjs <youtube-id> [interval-seconden]
 */
const ID = process.argv[2];
const INTERVAL = Number(process.argv[3] || 3);
if (!ID) {
  console.log(JSON.stringify({ fout: 'geef een youtube-id mee' }));
  process.exit(1);
}

const b = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const page = await b.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(`https://www.youtube.com/watch?v=${ID}`, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

// Cookiemelding wegklikken als die er staat.
await page.evaluate(() => {
  const knop = [...document.querySelectorAll('button')].find((x) =>
    /alles accepteren|accept all|alles afwijzen|reject all/i.test(x.innerText || ''),
  );
  if (knop) knop.click();
});
await new Promise((r) => setTimeout(r, 2000));

const meta = await page.evaluate(() => {
  const v = document.querySelector('video');
  if (!v) return null;
  v.muted = true;
  const p = v.play();
  if (p?.catch) p.catch(() => {});
  return { duur: Math.round(v.duration) };
});
if (!meta?.duur) {
  console.log(JSON.stringify({ fout: 'speler start niet' }));
  process.exit(1);
}

fs.mkdirSync('tmp/frames', { recursive: true });
const gemaakt = [];
for (let t = 2; t < meta.duur; t += INTERVAL) {
  await page.evaluate((sec) => {
    const v = document.querySelector('video');
    v.currentTime = sec;
    const p = v.play();
    if (p?.catch) p.catch(() => {});
  }, t);
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelector('video')?.pause());

  // Muis naar de hoek: dan vervaagt de bedieningsbalk en is de onderste strook vrij.
  await page.mouse.move(5, 5);
  await new Promise((r) => setTimeout(r, 3200));

  const werkelijk = await page.evaluate(() =>
    Math.round(document.querySelector('video')?.currentTime ?? -1),
  );
  const mm = String(Math.floor(werkelijk / 60)).padStart(2, '0');
  const ss = String(werkelijk % 60).padStart(2, '0');
  const naam = `tmp/frames/${mm}-${ss}.png`;
  const box = await (await page.$('video')).boundingBox();
  await page.screenshot({ path: naam, clip: box });
  gemaakt.push({ tijdstip: `${mm}:${ss}`, bestand: naam });
}

console.log(JSON.stringify({ duur: meta.duur, interval: INTERVAL, frames: gemaakt }, null, 1));
await page.close();
await b.disconnect();
