/**
 * De huidige stand van klantprojecten en opdrachtgevers, in de vorm die
 * lib/projecten-excel.ts verwacht. Los van die module, zodat de controle zelf
 * zonder database te testen is.
 */
import { prisma } from '@/lib/prisma';
import type { OpdrachtgeverStand, ProjectStand } from '@/lib/projecten-excel';

export async function haalStandOp(): Promise<{ projecten: ProjectStand[]; opdrachtgevers: OpdrachtgeverStand[] }> {
  const [cps, ogs] = await Promise.all([
    prisma.clientProject.findMany({
      select: {
        id: true,
        name: true,
        projectnummer: true,
        cardanKenmerk: true,
        contactnaam: true,
        contactEmail: true,
        updatedAt: true,
        opdrachtgever: { select: { kenmerk: true, naam: true } },
        _count: { select: { projects: true } },
      },
    }),
    prisma.opdrachtgever.findMany({ select: { id: true, kenmerk: true, naam: true } }),
  ]);
  return {
    projecten: cps.map(cp => ({
      id: cp.id,
      name: cp.name,
      opdrachtgeverKenmerk: cp.opdrachtgever.kenmerk,
      opdrachtgeverNaam: cp.opdrachtgever.naam,
      projectnummer: cp.projectnummer,
      cardanKenmerk: cp.cardanKenmerk,
      contactnaam: cp.contactnaam,
      contactEmail: cp.contactEmail,
      aantalOnderzoeken: cp._count.projects,
      updatedAt: cp.updatedAt,
    })),
    opdrachtgevers: ogs,
  };
}

export const MAX_BESTAND_BYTES = 5 * 1024 * 1024;

/** Haalt het geüploade bestand uit een formulier, met een Nederlandse fout als dat niet lukt. */
export async function leesUpload(
  request: Request
): Promise<{ ok: true; buffer: ArrayBuffer; form: FormData } | { ok: false; fout: string }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, fout: 'Er is geen bestand ontvangen.' };
  }
  const bestand = form.get('bestand');
  if (!bestand || typeof bestand === 'string') return { ok: false, fout: 'Kies eerst een Excelbestand.' };
  if (!/\.xlsx$/i.test(bestand.name)) {
    return { ok: false, fout: `"${bestand.name}" is geen .xlsx-bestand. Sla het in Excel op als Excel-werkmap (.xlsx).` };
  }
  if (bestand.size > MAX_BESTAND_BYTES) return { ok: false, fout: 'Het bestand is groter dan 5 MB.' };
  return { ok: true, buffer: await bestand.arrayBuffer(), form };
}
