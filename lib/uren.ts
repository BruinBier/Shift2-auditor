/**
 * Urenlogboek: wat er in de urenapp is geschreven, als doorzoekbaar overzicht.
 * De urenapp blijft de bron; zie het model Urenregel.
 */

export const URENREGEL_INCLUDE = {
  project: { select: { id: true, kenmerk: true, title: true, version: true, checkPhase: true, parentProjectId: true } },
} as const;

type Invoer = { projectId: string | null; datum: Date; uren: number; omschrijving: string | null };

/** Controleert wat de pagina opstuurt. Uren mogen met een komma: "4,5". */
export function leesUrenregel(body: any): Invoer | { fout: string } {
  const uren = Number(String(body?.uren ?? '').replace(',', '.'));
  if (!Number.isFinite(uren) || uren <= 0 || uren > 24) {
    return { fout: 'Vul een aantal uren in tussen 0 en 24' };
  }
  const datumTekst = String(body?.datum ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datumTekst)) {
    return { fout: 'Vul een datum in' };
  }
  const omschrijving = typeof body?.omschrijving === 'string' ? body.omschrijving.trim() : '';
  return {
    projectId: body?.projectId || null,
    // Middernacht UTC: de kolom is DATE, dus geen tijdzone die de dag verschuift.
    datum: new Date(`${datumTekst}T00:00:00Z`),
    uren: Math.round(uren * 100) / 100,
    omschrijving: omschrijving || null,
  };
}
