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
 * CRM-nummer en/of een Cardan-kenmerk. Zie scripts/crm-sync.example.json.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

type Regel = {
  /** Kenmerk van het onderzoek (ECHT-01) of van de opdrachtgever (WAAL). */
  kenmerk: string;
  /** Dynamics-nummer, bijvoorbeeld P02645. Leeg = overslaan. */
  projectnummer?: string | null;
  /** Kenmerk bij Cardan, bijvoorbeeld C-4521. Leeg = overslaan. */
  cardanKenmerk?: string | null;
  /** Vrije notitie. Wordt niet opgeslagen. */
  opmerking?: string;
};

/** De twee nummers die op het klantproject staan, met hun vorm. */
const VELDEN = [
  { veld: 'projectnummer', label: 'CRM-nummer', vorm: /^P\d{5}$/i, voorbeeld: 'P0xxxx' },
  { veld: 'cardanKenmerk', label: 'Cardan-kenmerk', vorm: /^C-\d{4}$/i, voorbeeld: 'C-xxxx' },
] as const;
type Veld = (typeof VELDEN)[number]['veld'];

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
          cardanKenmerk: true,
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
            cardanKenmerk: p.clientProject?.cardanKenmerk ?? null,
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
      const cardan = p.clientProject?.cardanKenmerk ? `  [Cardan ${p.clientProject.cardanKenmerk}]` : '';
      console.log(`  ${(p.kenmerk ?? '-').padEnd(10)} ${p.status.padEnd(16)} ${kp}${cardan}  —  ${p.title}`);
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
    if (!kenmerk) {
      console.log('- regel zonder kenmerk overgeslagen');
      overgeslagen++;
      continue;
    }

    // Welke nummers staan er in deze regel, en zien ze er goed uit?
    const nieuw: Partial<Record<Veld, string>> = {};
    let regelFout = false;
    for (const { veld, label, vorm, voorbeeld } of VELDEN) {
      const waarde = (regel[veld] || '').trim().toUpperCase();
      if (!waarde) continue;
      if (!vorm.test(waarde)) {
        console.log(`! ${kenmerk}: "${waarde}" ziet er niet uit als een ${label} (${voorbeeld})`);
        regelFout = true;
        continue;
      }
      nieuw[veld] = waarde;
    }
    if (regelFout) {
      fouten++;
      continue;
    }
    if (Object.keys(nieuw).length === 0) {
      console.log(`- ${kenmerk}: geen nummer ingevuld, overgeslagen`);
      overgeslagen++;
      continue;
    }

    // Welke klantprojecten horen bij dit kenmerk?
    const select = { id: true, name: true, projectnummer: true, cardanKenmerk: true } as const;
    const klantprojecten = kenmerk.includes('-')
      ? await prisma.clientProject.findMany({ where: { projects: { some: { kenmerk } } }, select })
      : await prisma.clientProject.findMany({ where: { opdrachtgever: { kenmerk } }, select });

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
      const wijziging: Partial<Record<Veld, string>> = {};
      const meldingen: string[] = [];

      for (const { veld, label } of VELDEN) {
        const nummer = nieuw[veld];
        if (!nummer) continue;
        const sleutel = `${kp.id}:${veld}`;
        const eerder = gepland.get(sleutel);
        if (eerder && eerder.nummer !== nummer) {
          console.log(
            `! ${kenmerk}: "${kp.name}" kreeg via ${eerder.via} al ${label} ${eerder.nummer}, nu ${nummer}. Overgeslagen.`
          );
          fouten++;
          continue;
        }
        if (eerder) continue;

        const huidig = kp[veld];
        if (huidig === nummer) {
          meldingen.push(`heeft al ${label} ${nummer}`);
          continue;
        }
        if (huidig && !force) {
          console.log(
            `! ${kenmerk}: "${kp.name}" heeft al ${label} ${huidig}; ${nummer} niet gezet (gebruik --force om te overschrijven)`
          );
          fouten++;
          continue;
        }
        gepland.set(sleutel, { nummer, via: kenmerk });
        wijziging[veld] = nummer;
        meldingen.push(huidig ? `${label} ${huidig} → ${nummer}` : `${label} ${nummer}`);
      }

      if (Object.keys(wijziging).length === 0) {
        if (meldingen.length) console.log(`= ${kenmerk}: "${kp.name}" ${meldingen.join(', ')}`);
        overgeslagen++;
        continue;
      }
      if (dryRun) {
        console.log(`~ ${kenmerk}: "${kp.name}" zou krijgen: ${meldingen.join(', ')}`);
      } else {
        await prisma.clientProject.update({ where: { id: kp.id }, data: wijziging });
        console.log(`+ ${kenmerk}: "${kp.name}" krijgt: ${meldingen.join(', ')}`);
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
