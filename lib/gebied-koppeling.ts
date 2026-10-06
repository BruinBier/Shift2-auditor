import { prisma } from '@/lib/prisma';

/**
 * De koppeling tussen een deelgebied en zijn bevindingen opruimen.
 *
 * Bij een criterium met deelgebieden schrijft de agent per gebied de id's van de
 * bevindingen die eronder vallen (`SampleCriterionCheck.gebieden[].bevindingen`). Dat is de
 * enige plek waar dat verband staat; de bevinding zelf weet niet bij welk gebied ze hoort.
 *
 * Wordt zo'n bevinding daarna afgewezen of verwijderd, dan blijft dat id staan en wijst het
 * naar niets meer. Op de kaart in "Waar sta ik" levert dat de melding "Hier hoort een
 * bevinding bij, maar die is niet gevonden" -- bij een gebied waar wél iets aan de hand is,
 * alleen staat de bevinding er niet meer onder. De onderzoeker ziet dan een gebrek dat er
 * niet is en kan niet zien wat er wel aan de hand was.
 *
 * Tot nu toe was de remedie `audit-criterium` opnieuw draaien, want die schrijft de
 * koppeling mee. Dat werkt, maar het is een halve miljoen tokens voor het opruimen van één
 * verwijzing, en het schrijft het hele oordeel opnieuw terwijl er niets aan te herzien valt.
 *
 * LET OP het verschil met een voorstel dat nog wacht. Een bevinding met status `voorstel`
 * telt hier gewoon mee: de koppeling klopt, alleen is de bevinding nog niet akkoord. Alleen
 * `afgewezen` en een verwijderde bevinding zijn hier reden om de verwijzing te laten vallen.
 */

/** De statussen waarbij een bevinding niet meer bij een gebied hoort te staan. */
const VERVALLEN = new Set(['afgewezen']);

type Gebied = { gebied: string; uitkomst?: string; toelichting?: string; bevindingen?: string[] };

/**
 * Haal een bevinding uit alle gebiedslijsten waar hij in staat.
 *
 * Draait over de sample-oordelen van hetzelfde criterium binnen hetzelfde project, want
 * verder kan de koppeling niet reiken: `gebieden` hangt aan één `SampleCriterionCheck`.
 *
 * Geeft terug hoeveel gebieden er zijn bijgewerkt, zodat de aanroeper kan zien of er iets
 * te doen was.
 */
export async function haalBevindingUitGebieden(
  findingId: string,
  projectId: string,
  wcagCriterionId: string,
): Promise<number> {
  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { wcagCriterionId, sampleItem: { projectId } },
    select: { id: true, gebieden: true },
  });

  let aangepast = 0;
  for (const check of checks) {
    const gebieden = check.gebieden as Gebied[] | null;
    if (!Array.isArray(gebieden)) continue;
    if (!gebieden.some((g) => (g.bevindingen ?? []).includes(findingId))) continue;

    const schoon = gebieden.map((g) =>
      (g.bevindingen ?? []).includes(findingId)
        ? { ...g, bevindingen: (g.bevindingen ?? []).filter((id) => id !== findingId) }
        : g,
    );
    await prisma.sampleCriterionCheck.update({
      where: { id: check.id },
      data: { gebieden: schoon },
    });
    aangepast += 1;
  }
  return aangepast;
}

/**
 * Een verwijzing vervangen door een andere, voor het geval een bevinding in een andere is
 * opgegaan.
 *
 * Dat gebeurt bij samenvoegen: twee bevindingen over dezelfde oorzaak worden er één, de
 * overbodige wordt afgewezen. De gebieden die naar de afgewezen wezen horen dan naar de
 * overgebleven te wijzen, niet leeg te raken. Een gebied dat al naar de nieuwe verwees
 * houdt er één verwijzing aan over.
 */
export async function vervangBevindingInGebieden(
  oudId: string,
  nieuwId: string,
  projectId: string,
  wcagCriterionId: string,
): Promise<number> {
  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { wcagCriterionId, sampleItem: { projectId } },
    select: { id: true, gebieden: true },
  });

  let aangepast = 0;
  for (const check of checks) {
    const gebieden = check.gebieden as Gebied[] | null;
    if (!Array.isArray(gebieden)) continue;
    if (!gebieden.some((g) => (g.bevindingen ?? []).includes(oudId))) continue;

    const schoon = gebieden.map((g) => {
      const ids = g.bevindingen ?? [];
      if (!ids.includes(oudId)) return g;
      return {
        ...g,
        bevindingen: Array.from(new Set(ids.map((id) => (id === oudId ? nieuwId : id)))),
      };
    });
    await prisma.sampleCriterionCheck.update({
      where: { id: check.id },
      data: { gebieden: schoon },
    });
    aangepast += 1;
  }
  return aangepast;
}

/**
 * Een bevinding die de onderzoeker zelf invoert aan een deelgebied hangen.
 *
 * Het omgekeerde van `haalBevindingUitGebieden`, voor "Ik zie hier nog iets" op de kaart.
 * Zonder koppeling komt de bevinding wel onder "Bevindingen" maar niet bij haar gebied, en
 * blijft dat gebied op `ok` staan terwijl er iets mis is.
 *
 * Het gebied gaat naar `fout` bij een bevinding en naar `opmerking` bij een opmerking (een
 * `fout` blijft `fout`). Het sample-oordeel gaat mee: een bevinding maakt een `voldoet`
 * `afgekeurd`, een opmerking maakt hem `opmerking`. De toelichting van de agent blijft
 * staan, met een zin erachter, zodat niet "in orde" naast een kruisje staat zonder uitleg.
 * `reden` blijft ongemoeid: een akkoord vervalt als die verandert.
 *
 * Geeft false als er voor deze pagina en dit criterium nog geen oordeel met dat gebied is.
 */
export async function koppelBevindingAanGebied(
  findingId: string,
  sampleItemId: string,
  wcagCriterionId: string,
  gebiedNaam: string,
  type: 'bevinding' | 'opmerking',
): Promise<boolean> {
  const check = await prisma.sampleCriterionCheck.findUnique({
    where: { sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId } },
    select: { id: true, gebieden: true, status: true },
  });
  const gebieden = check?.gebieden as Gebied[] | null;
  if (!check || !Array.isArray(gebieden) || !gebieden.some((g) => g.gebied === gebiedNaam)) {
    return false;
  }

  const nieuw = gebieden.map((g) => {
    if (g.gebied !== gebiedNaam) return g;
    const uitkomst = type === 'bevinding' || g.uitkomst === 'fout' ? 'fout' : 'opmerking';
    const aanvulling = 'Door de onderzoeker aangevuld met een eigen bevinding.';
    return {
      ...g,
      uitkomst,
      toelichting: g.toelichting ? `${g.toelichting} ${aanvulling}` : aanvulling,
      bevindingen: Array.from(new Set([...(g.bevindingen ?? []), findingId])),
    };
  });

  const status =
    type === 'bevinding' && check.status !== 'afgekeurd'
      ? 'afgekeurd'
      : type === 'opmerking' && (check.status === 'voldoet' || check.status === 'niet_aanwezig')
        ? 'opmerking'
        : check.status;

  await prisma.sampleCriterionCheck.update({
    where: { id: check.id },
    data: { gebieden: nieuw, status },
  });
  return true;
}

export { VERVALLEN };
