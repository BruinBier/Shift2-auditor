/**
 * Seed-import van de patronenbibliotheek (docs/bibliotheek/SPEC.md, fase 1).
 *
 *   npx tsx scripts/seed-bibliotheek.ts             # droogloop, schrijft niets
 *   npx tsx scripts/seed-bibliotheek.ts --schrijf   # schrijft, in één transactie
 *   npx tsx scripts/seed-bibliotheek.ts --bestand=pad/naar/seed.json
 *
 * Zonder --schrijf leest het script alleen: de seed en de codes uit
 * `wcag_criteria`. Met --schrijf weigert het zolang een van de
 * bibliotheektabellen al rijen heeft: een tweede import zou wat Frits
 * intussen heeft aangepast overschrijven, en de oordelen in de seed zijn
 * voorstellen die alleen hij verandert. Opnieuw beginnen gaat dus bewust,
 * door de tabellen eerst zelf leeg te maken.
 *
 * Backup eerst (CLAUDE.md): `npm run backup`, en controleer dat de CSV's rijen
 * hebben.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';
import { bereidSeedVoor, VERWACHTE_AANTALLEN, type Seed } from '../lib/bibliotheek/seed';

const prisma = new PrismaClient();

const STANDAARD_BESTAND = path.join('docs', 'bibliotheek', 'seed-bibliotheek.json');

function optie(naam: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${naam}=`));
  return arg?.slice(naam.length + 3);
}

async function bestaandeRijen() {
  const [patronen, casussen, oefensets, auditors, bronnen, rapportBevindingen, afbeeldingen] =
    await Promise.all([
      prisma.patroon.count(),
      prisma.casus.count(),
      prisma.oefenset.count(),
      prisma.auditor.count(),
      prisma.bron.count(),
      prisma.rapportBevinding.count(),
      prisma.bibliotheekAfbeelding.count(),
    ]);
  return { patronen, casussen, oefensets, auditors, bronnen, rapportBevindingen, afbeeldingen };
}

async function main() {
  const schrijf = process.argv.includes('--schrijf');
  const bestand = optie('bestand') ?? STANDAARD_BESTAND;

  const seed = JSON.parse(readFileSync(bestand, 'utf8')) as Seed;
  const criteria = await prisma.wCAGCriterion.findMany({ select: { code: true } });
  if (criteria.length === 0) {
    console.error('wcag_criteria is leeg. Draai eerst npm run db:seed.');
    process.exit(1);
  }

  const voorbereid = bereidSeedVoor(seed, new Set(criteria.map((c) => c.code)));

  console.log(`Seed: ${bestand} (versie ${seed.versie})`);
  for (const [soort, aantal] of Object.entries(voorbereid.aantallen)) {
    const verwacht = VERWACHTE_AANTALLEN[soort as keyof typeof VERWACHTE_AANTALLEN];
    console.log(`  ${soort.padEnd(20)} ${String(aantal).padStart(3)}  (verwacht ${verwacht})`);
  }
  if (voorbereid.waarschuwingen.length > 0) {
    console.log(`\nWaarschuwingen (${voorbereid.waarschuwingen.length}):`);
    for (const w of voorbereid.waarschuwingen) console.log(`  - ${w}`);
  }
  if (voorbereid.fouten.length > 0) {
    console.error(`\nFouten (${voorbereid.fouten.length}); er wordt niets geschreven:`);
    for (const f of voorbereid.fouten) console.error(`  - ${f}`);
    process.exit(1);
  }

  if (!schrijf) {
    console.log('\nDroogloop: geen fouten, niets geschreven. Schrijven met --schrijf.');
    return;
  }

  const bestaand = await bestaandeRijen();
  const gevuld = Object.entries(bestaand).filter(([, n]) => n > 0);
  if (gevuld.length > 0) {
    console.error('\nDe bibliotheek heeft al rijen; er wordt niets geschreven:');
    for (const [soort, n] of gevuld) console.error(`  - ${soort}: ${n}`);
    process.exit(1);
  }

  const r = voorbereid.rijen;
  // Volgorde volgt de verwijzingen: auditor vóór bron, patroon vóór casus,
  // casus en bron vóór rapportbevinding.
  await prisma.$transaction([
    prisma.auditor.createMany({ data: r.auditors }),
    prisma.oefenset.createMany({ data: r.oefensets }),
    prisma.patroon.createMany({ data: r.patronen }),
    prisma.casus.createMany({ data: r.casussen }),
    prisma.bron.createMany({ data: r.bronnen }),
    prisma.rapportBevinding.createMany({ data: r.rapportBevindingen }),
    prisma.bibliotheekAfbeelding.createMany({ data: r.afbeeldingen }),
  ]);

  const na = await bestaandeRijen();
  console.log('\nGeschreven. In de database:');
  for (const [soort, n] of Object.entries(na)) console.log(`  ${soort.padEnd(20)} ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
