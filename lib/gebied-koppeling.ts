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
 * Een afgewezen voorstel uit zijn gebied halen én het gebied laten meebewegen.
 *
 * Afwijzen zegt: hier is geen overtreding. Alleen de verwijzing weghalen
 * (`haalBevindingUitGebieden`) liet het gebied op `fout` staan en het paginaoordeel op
 * `afgekeurd`. Op NIS-01 (2026-10-23) bleef 1.3.1 op Alzheimer Café daardoor "voldoet niet"
 * nadat de onderzoeker V012 had afgewezen met de reden dat er geen overtreding was, terwijl
 * er op die pagina verder niets afkeurde.
 *
 * Een gebied dat op `fout` stond en na het weghalen geen bevinding meer heeft, gaat naar
 * `ok`, met de afwijsreden achter de toelichting. Staat er daarna in het hele oordeel geen
 * `fout` meer, en hangt er aan deze pagina geen andere afkeuring van dit criterium, dan
 * wordt het paginaoordeel `voldoet`. Het akkoord vervalt, want dat gold voor "voldoet niet";
 * de onderzoeker bevestigt het nieuwe oordeel zelf.
 *
 * Moet vóór `haalBevindingUitGebieden` draaien: daarna is niet meer te zien bij welk gebied
 * de bevinding hoorde.
 */
export async function herzieGebiedenNaAfwijzing(
  findingId: string,
  projectId: string,
  wcagCriterionId: string,
  reden: string,
): Promise<{ gebieden: number; naarVoldoet: number }> {
  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { wcagCriterionId, sampleItem: { projectId } },
    select: { id: true, sampleItemId: true, status: true, gebieden: true, reden: true },
  });
  // De pagina's waar het voorstel aan hing. Een criterium zonder deelgebieden (4.1.2
  // bijvoorbeeld) heeft geen gebied om naar te kijken; dan is dit de enige band.
  const paginas = new Set(
    (
      await prisma.findingOccurrence.findMany({
        where: { findingId },
        select: { sampleItemId: true },
      })
    ).map((o) => o.sampleItemId)
  );

  let gebiedenAangepast = 0;
  let naarVoldoet = 0;
  for (const check of checks) {
    const gebieden = check.gebieden as Gebied[] | null;
    const metGebieden = Array.isArray(gebieden) && gebieden.length > 0;
    const gekoppeld =
      metGebieden && gebieden!.some((g) => (g.bevindingen ?? []).includes(findingId));
    // Met deelgebieden telt alleen de koppeling: hing het voorstel aan geen gebied, dan
    // weet je niet welk gebied erover gaat. Zonder deelgebieden telt de pagina.
    if (metGebieden ? !gekoppeld : !paginas.has(check.sampleItemId)) continue;

    const nieuw = (gebieden ?? []).map((g) => {
      if (!(g.bevindingen ?? []).includes(findingId)) return g;
      const over = (g.bevindingen ?? []).filter((id) => id !== findingId);
      if (g.uitkomst !== 'fout' || over.length) return { ...g, bevindingen: over };
      gebiedenAangepast += 1;
      return {
        ...g,
        uitkomst: 'ok',
        bevindingen: over,
        toelichting: `${(g.toelichting ?? '').trim()} Afgewezen door de onderzoeker: ${reden}`.trim(),
      };
    });

    let wordtVoldoet = false;
    if (check.status === 'afgekeurd' && !nieuw.some((g) => g.uitkomst === 'fout')) {
      // Een andere afkeuring van dit criterium op deze pagina houdt het oordeel op
      // afgekeurd, ook als die niet aan een gebied gekoppeld is. Een opmerking keurt niet af.
      const andere = await prisma.finding.count({
        where: {
          id: { not: findingId },
          projectId,
          wcagCriterionId,
          type: { not: 'opmerking' },
          status: { not: 'afgewezen' },
          occurrences: { some: { sampleItemId: check.sampleItemId } },
        },
      });
      wordtVoldoet = andere === 0;
    }

    if (!metGebieden && !wordtVoldoet) continue;
    await prisma.sampleCriterionCheck.update({
      where: { id: check.id },
      data: {
        ...(metGebieden ? { gebieden: nieuw } : {}),
        ...(wordtVoldoet
          ? {
              status: 'voldoet',
              akkoord: null,
              // Zonder gebieden is de reden de enige plek waar staat waarom het omsloeg.
              ...(metGebieden
                ? {}
                : {
                    reden: `${(check.reden ?? '').trim()} Afgewezen door de onderzoeker: ${reden}`.trim(),
                  }),
            }
          : {}),
      },
    });
    if (wordtVoldoet) naarVoldoet += 1;
  }
  return { gebieden: gebiedenAangepast, naarVoldoet };
}

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

/**
 * Een bevinding is omgezet naar opmerking of andersom: gebied en sample-oordeel gaan mee.
 *
 * Het oordeel per pagina staat los van de bevindingen opgeslagen. Werd een bevinding op de
 * kaart een opmerking, dan bleef het oordeel `afgekeurd` en het gebied `fout` staan: op
 * LEU-01 (Stap 2b, 1.3.1, B021, 2026-10-08) stond er "voldoet niet" boven een kaart met
 * alleen een opmerking. Het omgekeerde gold ook: een opmerking die een bevinding werd liet
 * een `voldoet` staan.
 *
 * Per pagina waar de bevinding staat (of naar wie een gebied verwijst) wordt opnieuw
 * gekeken naar de bevindingen die nog gelden (niet afgewezen) onder dit criterium:
 * - is er nog een bevinding, dan `afgekeurd`;
 * - zijn er alleen opmerkingen, dan wordt een `afgekeurd` een `opmerking`;
 * - andere oordelen (`voldoet`, `niet_aanwezig`, `niet_te_bepalen`) blijven staan.
 * Een gebied gaat van `fout` naar `opmerking` als er onder dat gebied geen bevinding meer
 * hangt, en naar `fout` als er weer een bij komt. `reden` en akkoord blijven ongemoeid:
 * het is de onderzoeker die hier omzet.
 */
export async function volgSoortwissel(
  findingId: string,
  projectId: string,
  wcagCriterionId: string,
): Promise<number> {
  const bevinding = await prisma.finding.findUnique({
    where: { id: findingId },
    select: { occurrences: { select: { sampleItemId: true } } },
  });
  const samples = new Set((bevinding?.occurrences ?? []).map((o) => o.sampleItemId));

  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { wcagCriterionId, sampleItem: { projectId } },
    select: { id: true, sampleItemId: true, status: true, gebieden: true },
  });

  let aangepast = 0;
  for (const check of checks) {
    const gebieden = check.gebieden as Gebied[] | null;
    const verwijst = Array.isArray(gebieden) && gebieden.some((g) => (g.bevindingen ?? []).includes(findingId));
    if (!samples.has(check.sampleItemId) && !verwijst) continue;

    // Wat er nu nog geldt onder dit criterium op deze pagina.
    const geldend = await prisma.finding.findMany({
      where: {
        projectId,
        wcagCriterionId,
        status: { notIn: Array.from(VERVALLEN) as any },
        occurrences: { some: { sampleItemId: check.sampleItemId } },
      },
      select: { id: true, type: true },
    });
    const soortVan = new Map(geldend.map((f) => [f.id, f.type]));
    const heeftBevinding = geldend.some((f) => f.type !== 'opmerking');

    const status = heeftBevinding
      ? 'afgekeurd'
      : check.status === 'afgekeurd'
        ? geldend.length
          ? 'opmerking'
          : 'voldoet'
        : check.status;

    const nieuweGebieden = Array.isArray(gebieden)
      ? gebieden.map((g) => {
          const ids = (g.bevindingen ?? []).filter((id) => soortVan.has(id));
          if (!ids.length) return g;
          const nogFout = ids.some((id) => soortVan.get(id) !== 'opmerking');
          const uitkomst = nogFout ? 'fout' : g.uitkomst === 'fout' ? 'opmerking' : g.uitkomst;
          return uitkomst === g.uitkomst ? g : { ...g, uitkomst };
        })
      : gebieden;

    if (status === check.status && JSON.stringify(nieuweGebieden) === JSON.stringify(gebieden)) continue;
    await prisma.sampleCriterionCheck.update({
      where: { id: check.id },
      data: { status: status as any, ...(Array.isArray(nieuweGebieden) ? { gebieden: nieuweGebieden } : {}) },
    });
    aangepast += 1;
  }
  return aangepast;
}

export { VERVALLEN };
