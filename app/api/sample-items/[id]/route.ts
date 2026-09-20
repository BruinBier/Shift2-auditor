import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PAGINAVINKJES, vervaltDoorVinkje } from '@/lib/metingen';
import { bekendeGebieden } from '@/lib/deelgebieden';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    /**
     * Een vinkje zetten is geen goedkeuring van de pagina.
     *
     * Hieronder staat `voorgesteld: false` onvoorwaardelijk: wie een sample bewerkt,
     * heeft hem gezien. Dat klopt voor de bewerkdialoog, maar niet voor de twee
     * vinkjes op de rij. "Op deze pagina staat geen video" is iets anders dan "deze
     * pagina hoort in de steekproef", en anders keurt één klik op een vinkje stil
     * een voorgestelde pagina goed -- precies de poort die `voorgesteld` moet zijn.
     *
     * Gaat het bericht ALLEEN over de vinkjes, dan blijft `voorgesteld` dus staan.
     */
    const alleenVinkjes =
      Object.keys(body).length > 0 &&
      Object.keys(body).every(
        (k) => k === 'heeftBewegendBeeld' || k === 'heeftFormulier' || k === 'heeftTags'
      );

    // Prepare the update data
    const updateData: any = {
      ...(body.heeftBewegendBeeld !== undefined && { heeftBewegendBeeld: body.heeftBewegendBeeld }),
      ...(body.heeftFormulier !== undefined && { heeftFormulier: body.heeftFormulier }),
      ...(body.heeftTags !== undefined && { heeftTags: body.heeftTags }),
      ...(body.title && { title: body.title }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sampleType && { sampleType: body.sampleType }),
      ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
      ...(body.makeScreenshot !== undefined && { makeScreenshot: body.makeScreenshot }),
      ...(body.screenshotAlt !== undefined && { screenshotAlt: body.screenshotAlt }),
      ...(body.screenshotPath !== undefined && { screenshotPath: body.screenshotPath }),
      ...(body.auditHtmlPath !== undefined && { auditHtmlPath: body.auditHtmlPath }),
      ...(body.auditCapturedAt !== undefined && {
        auditCapturedAt: body.auditCapturedAt ? new Date(body.auditCapturedAt) : null,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      /**
       * Zelf bewerken is ook kijken.
       *
       * Een sample die een agent voorstelde en die jij aanpast, heb je gezien --
       * dan hoeft hij niet meer in de wachtrij. Dat scheelt: anders zou je na het
       * bijschaven van één pagina alsnog de knop moeten zoeken.
       *
       * Het herordenen loopt via een eigen route (sample-items/reorder), dus
       * slepen laat de vlag terecht staan: dat is de lijst schikken, niet de
       * inhoud beoordelen.
       *
       * Uitzondering: een bericht dat alleen de twee vinkjes zet. Zie `alleenVinkjes`
       * hierboven.
       */
      ...(alleenVinkjes ? {} : { voorgesteld: false }),
    };

    // If makeScreenshot is true and URL is provided, create/update screenshot
    if (body.makeScreenshot && body.url) {
      try {
        // Call the scan-url API to generate screenshot
        const scanResponse = await fetch(`${request.nextUrl.origin}/api/scan-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: body.url }),
        });

        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          updateData.screenshotPath = scanData.screenshot;
          // Set screenshotAlt to just the title (without "Screenshot van")
          if (body.title && !updateData.screenshotAlt) {
            updateData.screenshotAlt = body.title;
          }
        }
      } catch (error) {
        console.error('Failed to create screenshot:', error);
        // Continue updating the sample item even if screenshot fails
      }
    }

    const sampleItem = await prisma.sampleItem.update({
      where: { id: params.id },
      data: updateData,
    });

    const vinkjes = await synchroniseerVinkjeOordelen(params.id, body);

    return NextResponse.json({ ...sampleItem, vinkjeOordelen: vinkjes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sample item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sampleItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sample item' }, { status: 500 });
  }
}

/**
 * Het vinkje schrijft zijn eigen oordelen weg.
 *
 * Zonder dit zette een vinkje alleen het veld op de pagina, en verder niets. Wie het
 * vinkje zette VOORDAT de audit liep, merkte daar niets van: `audit-samples` leest het
 * veld en slaat de criteria over. Wie het erna zette, hield het oordeel van de agent --
 * en daarmee "Oordeel van de agent · gemeten" op de kaart, terwijl er niemand meer had
 * gemeten dan de onderzoeker zelf. Op ZOET-01 stonden zo zes criteria van
 * "Omgevingsprogramma's" met bron 'workflow' naast twee pagina's met bron 'steekproef',
 * bij precies dezelfde vaststelling. Frits, 2026-09-20.
 *
 * Alleen `false` sluit criteria af, en alleen de criteria die bij dít vakje horen:
 * ALTIJD_NIET_AANWEZIG blijft erbuiten, want dat gaat over de aard van de website en
 * niet over deze pagina. Zie `vervaltDoorVinkje` in lib/metingen.ts.
 *
 * Het oordeel wordt gezet, het akkoord niet: de kaart komt gewoon in de werklijst van
 * "Waar sta ik". Zie docs/plannen/meetdossier-per-pagina.md.
 */
async function synchroniseerVinkjeOordelen(
  sampleItemId: string,
  body: Record<string, any>
): Promise<{ gezet: number; teruggedraaid: number } | null> {
  const geraakt = PAGINAVINKJES.filter((v) => body[v.veld] !== undefined);
  if (!geraakt.length) return null;

  const sample = await prisma.sampleItem.findUnique({
    where: { id: sampleItemId },
    select: { heeftBewegendBeeld: true, heeftFormulier: true },
  });
  if (!sample) return null;

  const criteria = await prisma.wCAGCriterion.findMany({ select: { id: true, code: true } });
  const idVanCode = new Map(criteria.map((c) => [c.code, c.id]));

  // Wat er NU uit de vinkjes volgt, beperkt tot de vakjes die dit bericht aanraakt.
  const velden = new Set(geraakt.map((v) => v.veld));
  const sluiten = vervaltDoorVinkje(sample).filter((v) => velden.has(v.vinkje));
  const sluitenCodes = new Set(sluiten.map((v) => v.code));

  /*
   * Alles wat deze vakjes KUNNEN afsluiten. Het verschil met `sluiten` is wat er
   * teruggedraaid moet worden: zet je een vakje van "niet aanwezig" terug op "wel" of op
   * "niet vastgesteld", dan mag het oordeel dat eruit voortkwam niet blijven staan.
   */
  const mogelijk = geraakt.flatMap((v) => v.criteria);

  const gezet = await Promise.all(
    sluiten.map((v) => {
      const wcagCriterionId = idVanCode.get(v.code);
      if (!wcagCriterionId) return Promise.resolve(null);
      /*
       * De deelgebieden gaan mee op `nvt` met dezelfde toelichting. Niet omdat een route
       * het hier eist -- deze schrijft rechtstreeks -- maar omdat de kaart anders elf lege
       * ringen toont bij een oordeel dat wél compleet is, en `audit-criterium` het later
       * als onvolledig zou overdoen.
       */
      const gebieden = bekendeGebieden(v.code).map((gebied) => ({
        gebied,
        uitkomst: 'nvt' as const,
        toelichting: v.reden,
      }));
      return prisma.sampleCriterionCheck.upsert({
        where: { sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId } },
        create: {
          sampleItemId,
          wcagCriterionId,
          status: 'niet_aanwezig',
          reden: v.reden,
          bron: 'steekproef',
          ...(gebieden.length ? { gebieden } : {}),
        },
        /*
         * Het akkoord blijft staan zoals het stond. Had je dit oordeel al nagekeken, dan
         * verandert er inhoudelijk niets -- het blijft "niet aanwezig" -- en zou het
         * terugzetten op onbeoordeeld je je werk opnieuw laten doen.
         *
         * De verantwoording gaat wél weg. Dit oordeel berust op jouw vaststelling en niet
         * op een meting, en een achtergebleven logboek van de agent laat de kaart een
         * waarborg tonen over een meting die het oordeel niet meer draagt: op 1.2.3 van
         * "Omgevingsprogramma's" stond "door jou vastgesteld bij de steekproef" naast
         * "zonder auditsessie".
         */
        update: {
          status: 'niet_aanwezig',
          reden: v.reden,
          bron: 'steekproef',
          checkedAt: new Date(),
          verantwoording: [],
          ...(gebieden.length ? { gebieden } : {}),
        },
      });
    })
  );

  /*
   * Terugdraaien raakt alleen wat dit vinkje zelf heeft geschreven (`bron: 'steekproef'`).
   * Een oordeel van een agent of van jouw hand blijft staan: dat berust op een meting en
   * niet op dit vakje, en stilletjes weggooien zou werk vernietigen.
   */
  const terug = mogelijk.filter((code) => !sluitenCodes.has(code));
  const terugIds = terug.map((code) => idVanCode.get(code)).filter(Boolean) as string[];
  const teruggedraaid = terugIds.length
    ? await prisma.sampleCriterionCheck.deleteMany({
        where: { sampleItemId, wcagCriterionId: { in: terugIds }, bron: 'steekproef' },
      })
    : { count: 0 };

  return { gezet: gezet.filter(Boolean).length, teruggedraaid: teruggedraaid.count };
}
