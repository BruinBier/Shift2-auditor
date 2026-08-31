import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Findingcodes (B001, B002, ...) toekennen zonder dubbelen.
 *
 * Vier routes deden dit met drie verschillende algoritmes, allemaal
 * lezen-dan-schrijven zonder transactie. Twee aanmaakacties vlak na elkaar
 * lazen daardoor hetzelfde maximum en schreven dezelfde code: in zeven
 * gevallen staan er nu twee verschillende findings onder één code.
 *
 * Deze module kent de code toe binnen de transactie die de finding aanmaakt,
 * met de unique-constraint op (project_id, finding_code) als vangnet: gaat die
 * af, dan is er ondertussen een andere finding aangemaakt en proberen we het
 * opnieuw met het nieuwe maximum.
 */

/**
 * `V` voor een voorstel, `B` voor een akkoord bevonden bevinding.
 *
 * Twee reeksen, omdat afwijzingen bewaard blijven en hun code voorgoed bezet
 * houden. Bij machinale voorstellen over twintig samples maal drieëndertig
 * criteria zouden de gaten de B-reeks onbruikbaar maken — B001, B007, B023 — en
 * dat suggereert in een auditrapport dat er bevindingen zijn weggehaald. Gaten in
 * de V-reeks ziet niemand. Zie docs/adr/0001-akkoord-als-poort.md.
 */
export type CodePrefix = 'B' | 'V';

/**
 * Het eerstvolgende vrije nummer binnen een project.
 *
 * De rij van het project wordt eerst vergrendeld (SELECT ... FOR UPDATE), zodat
 * twee gelijktijdige aanmaakacties niet allebei hetzelfde maximum lezen. Zonder
 * die vergrendeling blijven ze op elkaar botsen: bij tien tegelijk haalde
 * ongeveer de helft het niet binnen vijf pogingen.
 */
export async function nextFindingCode(
  tx: Prisma.TransactionClient,
  projectId: string,
  prefix: CodePrefix = 'B'
): Promise<string> {
  await tx.$queryRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;

  // Hoogste bestaande nummer + 1, niet het aantal: verwijderde findings mogen
  // niet tot hergebruik van een code leiden.
  const patroon = `^${prefix}[0-9]+$`;
  const rijen = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(finding_code FROM 2) AS INTEGER)) AS max
    FROM findings
    WHERE project_id = ${projectId} AND finding_code ~ ${patroon}
  `;
  const max = rijen[0]?.max ?? 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/**
 * Maakt een finding aan met een gegarandeerd unieke code binnen het project.
 *
 * `data` bevat alles behalve findingCode; die wordt hier toegekend. Bij een
 * botsing met de unique-constraint wordt het opnieuw geprobeerd.
 */
export async function createFindingWithCode<T>(
  projectId: string,
  bouwData: (findingCode: string) => Prisma.FindingCreateArgs,
  prefix: CodePrefix = 'B',
  pogingen = 5
): Promise<any> {
  let laatsteFout: unknown = null;

  for (let poging = 0; poging < pogingen; poging++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const findingCode = await nextFindingCode(tx, projectId, prefix);
        return tx.finding.create(bouwData(findingCode) as any);
      });
    } catch (err: any) {
      // P2002 = unique constraint violation. Een andere aanmaakactie was ons
      // voor; opnieuw proberen levert het volgende vrije nummer op.
      // De code zit soms op de fout zelf, soms alleen in de melding: binnen
      // een transactie wikkelt Prisma de oorspronkelijke fout in.
      const isBotsing =
        err?.code === 'P2002' ||
        /P2002|Unique constraint failed/i.test(String(err?.message ?? ''));
      if (isBotsing) {
        laatsteFout = err;
        // Korte, oplopende pauze zodat gelijktijdige aanvragen uit elkaar
        // lopen in plaats van steeds opnieuw op hetzelfde nummer te botsen.
        await new Promise((r) => setTimeout(r, 20 * (poging + 1)));
        continue;
      }
      throw err;
    }
  }

  throw laatsteFout ?? new Error('Kon geen vrije findingcode toekennen');
}

/**
 * Geeft een voorstel zijn bevindingcode op het moment van akkoord.
 *
 * De B-reeks blijft zo aaneengesloten: alleen goedgekeurd werk krijgt een nummer.
 * Dezelfde vergrendeling en dezelfde herkansing bij botsing als bij het aanmaken.
 * Draagt de finding al een B-code, dan blijft die staan.
 */
export async function kenBevindingCodeToe(
  projectId: string,
  findingId: string,
  pogingen = 5
): Promise<string> {
  let laatsteFout: unknown = null;

  for (let poging = 0; poging < pogingen; poging++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const huidig = await tx.finding.findUnique({
          where: { id: findingId },
          select: { findingCode: true },
        });
        if (huidig?.findingCode?.startsWith('B')) return huidig.findingCode;

        const findingCode = await nextFindingCode(tx, projectId, 'B');
        await tx.finding.update({ where: { id: findingId }, data: { findingCode } });
        return findingCode;
      });
    } catch (err: any) {
      const isBotsing =
        err?.code === 'P2002' ||
        /P2002|Unique constraint failed/i.test(String(err?.message ?? ''));
      if (isBotsing) {
        laatsteFout = err;
        await new Promise((r) => setTimeout(r, 20 * (poging + 1)));
        continue;
      }
      throw err;
    }
  }

  throw laatsteFout ?? new Error('Kon geen vrije bevindingcode toekennen');
}

/**
 * Een bevinding terug naar voorstel: de code van `B` naar `V`.
 *
 * Wordt een criterium opnieuw beoordeeld, dan is het oordeel dat er lag niet meer het
 * oordeel dat er staat — het akkoord vervalt, en de kaart vraagt opnieuw om bevestiging. De
 * bevinding hoort dan mee terug te gaan. Bleef die een `B` houden, dan stond er een code die
 * "goedgekeurd" betekent op een kaart die om goedkeuring vraagt, en dat is precies de
 * tegenspraak die de poort moet voorkomen (docs/adr/0001-akkoord-als-poort.md).
 *
 * De oude B-code komt niet terug: hij blijft bezet, zoals bij een afwijzing. Gaten in de
 * B-reeks zijn hier het kleinere kwaad — beter een ontbrekend nummer dan een nummer dat iets
 * anders betekent dan het zegt.
 *
 * Doet niets bij een code die al met `V` begint, en niets bij een bevinding zonder code.
 */
export async function zetTerugNaarVoorstel(
  projectId: string,
  findingId: string,
  pogingen = 5
): Promise<string | null> {
  let laatsteFout: unknown = null;

  for (let poging = 0; poging < pogingen; poging++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const huidig = await tx.finding.findUnique({
          where: { id: findingId },
          select: { findingCode: true, status: true },
        });
        if (!huidig?.findingCode?.startsWith('B')) return huidig?.findingCode ?? null;

        const findingCode = await nextFindingCode(tx, projectId, 'V');
        await tx.finding.update({
          where: { id: findingId },
          data: { findingCode, status: 'voorstel' as any },
        });
        return findingCode;
      });
    } catch (err: any) {
      const isBotsing =
        err?.code === 'P2002' ||
        /P2002|Unique constraint failed/i.test(String(err?.message ?? ''));
      if (isBotsing) {
        laatsteFout = err;
        await new Promise((r) => setTimeout(r, 20 * (poging + 1)));
        continue;
      }
      throw err;
    }
  }

  throw laatsteFout ?? new Error('Kon de bevinding niet terugzetten naar voorstel');
}
