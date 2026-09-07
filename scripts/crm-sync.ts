/**
 * CRM-sync: de CRM-nummers (Dynamics, P0xxxx) in Shift2Auditor bijwerken en
 * rapporteren welke onderzoeken er nog geen hebben.
 *
 * Het CRM-nummer leeft op het klantproject (ClientProject.projectnummer),
 * niet op het onderzoek. Eén nummer geldt dus voor alle onderzoeken onder
 * dat klantproject.
 *
 *   npm run crm:sync -- report                 # wat mist er nog (tekst)
 *   npm run crm:sync -- report --json          # idem, als JSON
 *   npm run crm:sync -- apply <bestand.json>   # nummers zetten
 *   npm run crm:sync -- apply <bestand.json> --dry-run
 *   npm run crm:sync -- apply <bestand.json> --force   # ook overschrijven
 *
 * Het bestand is een lijst met regels; elke regel wijst met het kenmerk van
 * een onderzoek (ECHT-01) of van een opdrachtgever (WAAL) naar een
 * CRM-nummer. Zie scripts/crm-sync.example.json.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

type Regel = {
  /** Kenmerk van het onderzoek (ECHT-01) of van de opdrachtgever (WAAL). */
  kenmerk: string;
  /** Dynamics-nummer, bijvoorbeeld P02645. Leeg = overslaan. */
  projectnummer?: string | null;
  /** Vrije notitie, bijvoorbeeld het Cardan-kenmerk. Wordt niet opgeslagen. */
  opmerking?: string;
};

const CRM_NUMMER = /^P\d{5}$/i;

async function report(asJson: boolean) {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      kenmerk: true,
      title: true,
      status: true,
      commissionedBy: true,
      clientProject: {
        select: {
          id: true,
          name: true,
          projectnummer: true,
          opdrachtgever: { select: { kenmerk: true, naam: true } },
        },
      },
    },
    orderBy: [{ kenmerk: 'asc' }],
  });

  const zonderNummer = projects.filter(p => !p.clientProject?.projectnummer);
  const zonderKlantproject = zonderNummer.filter(p => !p.clientProject);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          totaal: projects.length,
          zonderCrmNummer: zonderNummer.map(p => ({
            kenmerk: p.kenmerk,
            title: p.title,
            status: p.status,
            opdrachtgever: p.clientProject?.opdrachtgever.naam ?? p.commissionedBy ?? null,
            klantproject: p.clientProject?.name ?? null,
            heeftKlantproject: Boolean(p.clientProject),
          })),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`${projects.length} onderzoeken, ${zonderNummer.length} zonder CRM-nummer.\n`);

  const perOpdrachtgever = new Map<string, typeof zonderNummer>();
  for (const p of zonderNummer) {
    const key = p.clientProject?.opdrachtgever.naam ?? p.commissionedBy ?? '(geen opdrachtgever)';
    perOpdrachtgever.set(key, [...(perOpdrachtgever.get(key) ?? []), p]);
  }
  for (const [naam, lijst] of Array.from(perOpdrachtgever.entries()).sort()) {
    console.log(naam);
    for (const p of lijst) {
      const kp = p.clientProject ? p.clientProject.name : 'GEEN KLANTPROJECT';
      console.log(`  ${(p.kenmerk ?? '-').padEnd(10)} ${p.status.padEnd(16)} ${kp}  —  ${p.title}`);
    }
  }

  if (zonderKlantproject.length) {
    console.log(
      `\nLet op: ${zonderKlantproject.length} onderzoek(en) hangen niet aan een klantproject. ` +
        'Daar kan geen CRM-nummer op; koppel ze eerst via de projectdetails.'
    );
  }
}

async function apply(bestand: string, dryRun: boolean, force: boolean) {
  const regels = JSON.parse(readFileSync(bestand, 'utf8')) as Regel[];
  if (!Array.isArray(regels)) throw new Error('Het bestand moet een lijst met regels zijn.');

  let gezet = 0;
  let overgeslagen = 0;
  let fouten = 0;

  // Meerdere onderzoeken kunnen naar hetzelfde klantproject wijzen; elk
  // klantproject wordt maar één keer bijgewerkt en botsingen worden gemeld.
  const gepland = new Map<string, { nummer: string; via: string }>();

  for (const regel of regels) {
    const kenmerk = (regel.kenmerk || '').trim().toUpperCase();
    const nummer = (regel.projectnummer || '').trim().toUpperCase();
    if (!kenmerk) {
      console.log('- regel zonder kenmerk overgeslagen');
      overgeslagen++;
      continue;
    }
    if (!nummer) {
      console.log(`- ${kenmerk}: geen CRM-nummer ingevuld, overgeslagen`);
      overgeslagen++;
      continue;
    }
    if (!CRM_NUMMER.test(nummer)) {
      console.log(`! ${kenmerk}: "${nummer}" ziet er niet uit als een CRM-nummer (P0xxxx)`);
      fouten++;
      continue;
    }

    // Welke klantprojecten horen bij dit kenmerk?
    const klantprojecten = kenmerk.includes('-')
      ? await prisma.clientProject.findMany({
          where: { projects: { some: { kenmerk } } },
          select: { id: true, name: true, projectnummer: true },
        })
      : await prisma.clientProject.findMany({
          where: { opdrachtgever: { kenmerk } },
          select: { id: true, name: true, projectnummer: true },
        });

    if (klantprojecten.length === 0) {
      const bestaat = kenmerk.includes('-')
        ? await prisma.project.findFirst({ where: { kenmerk }, select: { id: true } })
        : await prisma.opdrachtgever.findFirst({ where: { kenmerk }, select: { id: true } });
      console.log(
        bestaat
          ? `! ${kenmerk}: bestaat, maar hangt niet aan een klantproject. Koppel eerst via de projectdetails.`
          : `! ${kenmerk}: niet gevonden`
      );
      fouten++;
      continue;
    }

    for (const kp of klantprojecten) {
      const eerder = gepland.get(kp.id);
      if (eerder && eerder.nummer !== nummer) {
        console.log(
          `! ${kenmerk}: klantproject "${kp.name}" kreeg via ${eerder.via} al ${eerder.nummer}, nu ${nummer}. Regel overgeslagen.`
        );
        fouten++;
        continue;
      }
      if (eerder) continue;

      if (kp.projectnummer === nummer) {
        console.log(`= ${kenmerk}: "${kp.name}" heeft al ${nummer}`);
        overgeslagen++;
        continue;
      }
      if (kp.projectnummer && !force) {
        console.log(
          `! ${kenmerk}: "${kp.name}" heeft al ${kp.projectnummer}; ${nummer} niet gezet (gebruik --force om te overschrijven)`
        );
        fouten++;
        continue;
      }

      gepland.set(kp.id, { nummer, via: kenmerk });
      const actie = kp.projectnummer ? `${kp.projectnummer} → ${nummer}` : nummer;
      if (dryRun) {
        console.log(`~ ${kenmerk}: "${kp.name}" zou ${actie} krijgen`);
      } else {
        await prisma.clientProject.update({ where: { id: kp.id }, data: { projectnummer: nummer } });
        console.log(`+ ${kenmerk}: "${kp.name}" krijgt ${actie}`);
      }
      gezet++;
    }
  }

  console.log(
    `\n${dryRun ? 'Dry-run: ' : ''}${gezet} gezet, ${overgeslagen} overgeslagen, ${fouten} met een probleem.`
  );
  if (fouten) process.exitCode = 1;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter(a => a.startsWith('--')));
  const args = rest.filter(a => !a.startsWith('--'));

  try {
    if (cmd === 'report') {
      await report(flags.has('--json'));
    } else if (cmd === 'apply') {
      if (!args[0]) throw new Error('Geef het JSON-bestand op: apply <bestand.json>');
      await apply(args[0], flags.has('--dry-run'), flags.has('--force'));
    } else {
      console.log('Gebruik: crm-sync report [--json] | apply <bestand.json> [--dry-run] [--force]');
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Fout:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
