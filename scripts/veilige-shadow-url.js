#!/usr/bin/env node
/**
 * Bewaakt de schaduwdatabase-URL.
 *
 * `prisma migrate diff --to-migrations` en `prisma migrate dev` LEGEN de
 * schaduwdatabase voordat ze de migraties erop afspelen. Staat daar de
 * productiedatabase in, dan is alle data weg.
 *
 * Op 1 september 2026 gebeurde dat: de URL kwam uit een grep met een
 * terugvaloptie (`^SHADOW_DATABASE_URL\|^DATABASE_URL`), er bestond geen
 * SHADOW_DATABASE_URL, en dus leverde de grep zwijgend de productiedatabase.
 * 40 projecten, 750 bevindingen en 521 samples waren weg; herstel lukte alleen
 * doordat Neon nog zes uur geschiedenis had.
 *
 * Dit script drukt de schaduw-URL af, en breekt af zodra die gelijk is aan
 * DATABASE_URL. Gebruik het overal waar een shadow-URL wordt doorgegeven:
 *
 *   npx prisma migrate diff ... --shadow-database-url "$(node scripts/veilige-shadow-url.js)"
 *
 * Wat er wordt vergeleken is host + databasenaam, niet de hele tekst: dezelfde
 * database met andere verbindingsopties is nog steeds dezelfde database.
 */
const fs = require('fs');
const path = require('path');

function lees(bestand) {
  const p = path.join(__dirname, '..', bestand);
  if (!fs.existsSync(p)) return {};
  const uit = {};
  for (const regel of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = regel.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) uit[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return uit;
}

/** Host + pad, zodat verbindingsopties het oordeel niet vertroebelen. */
function kern(url) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`.toLowerCase();
  } catch {
    return null;
  }
}

const env = { ...lees('.env'), ...process.env };
const schaduw = env.SHADOW_DATABASE_URL;
const productie = env.DATABASE_URL;

if (!schaduw) {
  console.error(
    'Er is geen SHADOW_DATABASE_URL ingesteld.\n\n' +
    'Een schaduwdatabase is een APARTE, LEGE database. Prisma leegt hem voordat\n' +
    'het de migraties afspeelt. Maak er een aan in Neon en zet hem in .env, of\n' +
    'sla de controle over die hem nodig heeft.\n\n' +
    'Vul hier NOOIT DATABASE_URL in.'
  );
  process.exit(1);
}

if (productie && kern(schaduw) && kern(schaduw) === kern(productie)) {
  console.error(
    'GESTOPT: SHADOW_DATABASE_URL wijst naar dezelfde database als DATABASE_URL.\n\n' +
    `  ${kern(schaduw)}\n\n` +
    'Prisma zou die database LEGEN. Dit is precies wat er op 1 september 2026\n' +
    'is misgegaan. Maak een aparte lege database aan.'
  );
  process.exit(1);
}

process.stdout.write(schaduw);
