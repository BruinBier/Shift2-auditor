import { prisma } from '@/lib/prisma';
import { hoofddomein, type KlantDomein } from './klantdata';

/** De codes uit `wcag_criteria`: de enige lijst van succescriteria (besluit 5). */
export async function bekendeCriteria(): Promise<Set<string>> {
  const rijen = await prisma.wCAGCriterion.findMany({ select: { code: true } });
  return new Set(rijen.map((r) => r.code));
}

export async function bekendeOefensets(): Promise<Set<string>> {
  const rijen = await prisma.oefenset.findMany({ select: { id: true } });
  return new Set(rijen.map((r) => r.id));
}

/**
 * Het domein van elk onderzoek, voor de klantdata-waarschuwing (besluit 13).
 * Een onderzoek heeft geen eigen domeinveld; het is de host die het vaakst
 * voorkomt in zijn scope en steekproef.
 */
export async function klantDomeinen(): Promise<KlantDomein[]> {
  const projecten = await prisma.project.findMany({
    select: {
      kenmerk: true,
      title: true,
      scopeUrls: { select: { url: true } },
      sampleItems: { select: { url: true } },
    },
  });
  const uit: KlantDomein[] = [];
  for (const p of projecten) {
    const domein = hoofddomein([...p.scopeUrls.map((u) => u.url), ...p.sampleItems.map((s) => s.url)]);
    if (domein && !uit.some((d) => d.domein === domein)) {
      uit.push({ domein, onderzoek: p.kenmerk ?? p.title });
    }
  }
  return uit;
}
