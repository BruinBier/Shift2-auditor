/**
 * Vult `bibliotheek_casussen.categorie` uit de prototypes in
 * docs/bibliotheek/prototypes/.
 *
 *   npx tsx scripts/vul-casuscategorieen.ts            # droogloop, schrijft niets
 *   npx tsx scripts/vul-casuscategorieen.ts --schrijf  # vult lege categorieën
 *
 * Een casus die al een categorie heeft, wordt niet overschreven: die kan
 * Frits intussen in de casuseditor hebben aangepast.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';
import { categorieenUitPrototype, PROTOTYPEN } from '../lib/bibliotheek/categorieen';

const prisma = new PrismaClient();
const MAP = path.join('docs', 'bibliotheek', 'prototypes');

async function main() {
  const schrijf = process.argv.includes('--schrijf');

  const gevonden = new Map<string, string>();
  for (const [set, bestand] of Object.entries(PROTOTYPEN)) {
    const html = readFileSync(path.join(MAP, bestand), 'utf8');
    categorieenUitPrototype(html, set).forEach((kop, id) => gevonden.set(id, kop));
  }

  const casussen = await prisma.casus.findMany({ select: { id: true, categorie: true }, orderBy: { id: 'asc' } });
  const tevullen = casussen.filter((c) => !c.categorie && gevonden.has(c.id));
  const alGevuld = casussen.filter((c) => c.categorie);
  const nietGevonden = casussen.filter((c) => !c.categorie && !gevonden.has(c.id));

  console.log(`In de prototypes: ${gevonden.size} casussen met een categorie.`);
  console.log(`Te vullen: ${tevullen.length} · al gevuld (blijft staan): ${alGevuld.length} · niet in een prototype: ${nietGevonden.length}`);
  for (const c of nietGevonden) console.log(`  - ${c.id}: geen categorie gevonden, wordt 'Overig'`);

  if (!schrijf) {
    console.log('\nDroogloop: niets geschreven. Schrijven met --schrijf.');
    return;
  }
  await prisma.$transaction(
    tevullen.map((c) => prisma.casus.update({ where: { id: c.id }, data: { categorie: gevonden.get(c.id)! } })),
  );
  console.log(`\nGeschreven: ${tevullen.length} categorieën.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
