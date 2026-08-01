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
 * Het eerstvolgende vrije nummer binnen een project.
 *
 * De rij van het project wordt eerst vergrendeld (SELECT ... FOR UPDATE), zodat
 * twee gelijktijdige aanmaakacties niet allebei hetzelfde maximum lezen. Zonder
 * die vergrendeling blijven ze op elkaar botsen: bij tien tegelijk haalde
 * ongeveer de helft het niet binnen vijf pogingen.
 */
export async function nextFindingCode(
  tx: Prisma.TransactionClient,
  projectId: string
): Promise<string> {
  await tx.$queryRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;

  // Hoogste bestaande nummer + 1, niet het aantal: verwijderde findings mogen
  // niet tot hergebruik van een code leiden.
  const rijen = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(finding_code FROM 2) AS INTEGER)) AS max
    FROM findings
    WHERE project_id = ${projectId} AND finding_code ~ '^B[0-9]+$'
  `;
  const max = rijen[0]?.max ?? 0;
  return `B${String(max + 1).padStart(3, '0')}`;
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
  pogingen = 5
): Promise<any> {
  let laatsteFout: unknown = null;

  for (let poging = 0; poging < pogingen; poging++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const findingCode = await nextFindingCode(tx, projectId);
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
