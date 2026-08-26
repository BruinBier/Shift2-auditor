import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leesLogboek } from '@/scripts/lib/audit-log';
import { meetopdracht, metingenVoorCriterium } from '@/lib/metingen';
import { metingUitLogregel, voegMetingToe } from '@/lib/verantwoording';
import { draaiMeting } from '@/lib/meting-draaien';

/**
 * Eén meting starten vanaf de kaart, voor één pagina en één criterium.
 *
 * Tot nu toe kon alleen een agent een meting doen: die draait de CLI, en daarna hangt
 * `koppel-logboek` het spoor aan de oordelen. Wie zelf een site wil onderzoeken zonder
 * agent, kon dat niet — en dan staat er onder een oordeel niets, of alleen de opgehaalde
 * pagina. Deze route maakt de onderzoeker daarin zelfstandig: de kaart biedt aan wat er
 * voor dit criterium te meten valt, en de uitkomst komt eronder te staan.
 *
 * WAT DEZE ROUTE NIET DOET: het oordeel veranderen. Een meting is bewijs, geen uitspraak.
 * Ze raakt `status`, `reden` en vooral `akkoord` niet aan — een goedkeuring van de
 * onderzoeker mag niet sneuvelen doordat er bewijs bij komt. Bestond er nog geen oordeel,
 * dan komt er een lege plek met de meting eronder en `niet_te_bepalen` als stand: er is
 * gemeten, het oordeel moet nog gegeven worden.
 *
 * De commandotekst van de kaart wordt niet uitgevoerd; zie `lib/meting-draaien.ts`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Er staat geen browser op een productieserver, en een route die processen start hoort
  // daar hoe dan ook niet te bestaan. Zelfde slot als /api/meting/opnieuw.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Een meting starten kan alleen vanaf de lokale dev-server.' },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ongeldige body' }, { status: 400 });
  }

  const sampleItemId: string = body.sampleItemId ?? '';
  const criterionCode: string = body.criterionCode ?? '';
  const commando: string = body.commando ?? '';
  // Bekijken is geen meten. Zie de toelichting bij bekijkVlaggen in lib/metingen.ts.
  const bekijken: boolean = body.bekijken === true;

  const opdracht = meetopdracht(commando);
  if (!opdracht) {
    return NextResponse.json({ ok: false, error: `Onbekende meting: ${commando}` }, { status: 400 });
  }
  // Het commando moet bij het criterium horen. Anders belandt een reflow-meting onder
  // 2.2.2 en staat er bewijs dat de vraag niet beantwoordt.
  if (!metingenVoorCriterium(criterionCode).some((m) => m.commando === commando)) {
    return NextResponse.json(
      { ok: false, error: `${commando} hoort niet bij ${criterionCode}` },
      { status: 400 }
    );
  }
  if (!opdracht.vanafDeKaart) {
    return NextResponse.json(
      { ok: false, error: `${commando} is niet met één klik te draaien: ${opdracht.waaromNiet ?? ''}`.trim() },
      { status: 400 }
    );
  }

  const sample = await prisma.sampleItem.findUnique({
    where: { id: sampleItemId },
    select: { id: true, url: true, title: true, sampleType: true, projectId: true },
  });
  if (!sample) {
    return NextResponse.json({ ok: false, error: 'Onbekende pagina' }, { status: 404 });
  }
  if (sample.sampleType === 'pdf') {
    return NextResponse.json(
      { ok: false, error: 'Dit is een PDF-sample; browsermetingen gelden voor webpagina\'s.' },
      { status: 400 }
    );
  }
  if (!sample.url) {
    return NextResponse.json(
      { ok: false, error: 'Deze pagina heeft geen adres, dus er valt niets te openen.' },
      { status: 400 }
    );
  }

  const criterium = await prisma.wCAGCriterion.findFirst({
    where: { code: criterionCode },
    select: { id: true },
  });
  if (!criterium) {
    return NextResponse.json(
      { ok: false, error: `Onbekend criterium ${criterionCode}` },
      { status: 400 }
    );
  }

  if (bekijken) {
    if (!opdracht.bekijkVlaggen) {
      return NextResponse.json(
        { ok: false, error: `Bij ${commando} valt niets live te bekijken.` },
        { status: 400 }
      );
    }
    const bekeken = await draaiMeting(commando, sample.url, opdracht.bekijkVlaggen);
    if (!bekeken.ok) {
      return NextResponse.json(
        { ok: false, error: bekeken.error, details: bekeken.details },
        { status: 500 }
      );
    }
    // Er wordt niets vastgelegd: geen logboekkoppeling, geen check, geen oordeel. Wat
    // terugkomt is de melding van het commando zelf -- inclusief het geval dat er geen
    // auditsessie draait en er dus niets te zien is.
    const melding =
      bekeken.antwoord?.pagina_blijft_open ??
      'De meting draaide, maar meldde niet of er een pagina open is blijven staan.';
    return NextResponse.json({ ok: true, bekeken: true, bericht: melding });
  }

  const vlaggen = opdracht.vlaggen ?? {};
  const gedraaid = await draaiMeting(commando, sample.url, vlaggen);
  if (!gedraaid.ok) {
    return NextResponse.json(
      { ok: false, error: gedraaid.error, details: gedraaid.details },
      { status: 500 }
    );
  }

  // De logboekregel is wat de kaart bewaart, niet het antwoord hierboven. Die weergave
  // maakt waarden op — het logboek zegt paginabreedte 320, de weergave "320px" — en dan
  // vergelijkt een hermeting straks appels met peren.
  const laatste = [...leesLogboek()].reverse().find((r) => r.commando === commando);
  if (!laatste) {
    return NextResponse.json(
      { ok: false, error: 'De meting draaide, maar liet geen regel in het logboek achter.' },
      { status: 500 }
    );
  }

  const bestaand = await prisma.sampleCriterionCheck.findUnique({
    where: {
      sampleItemId_wcagCriterionId: { sampleItemId: sample.id, wcagCriterionId: criterium.id },
    },
    select: { verantwoording: true, status: true, akkoord: true },
  });

  const nieuweVerantwoording = voegMetingToe(
    Array.isArray(bestaand?.verantwoording) ? (bestaand!.verantwoording as any[]) : [],
    metingUitLogregel(laatste)
  );

  if (bestaand) {
    // Alleen het bewijs. Status, reden, bron en akkoord blijven zoals ze waren: meten is
    // geen oordelen, en een akkoord van de onderzoeker hoort niet te vervallen omdat er
    // bewijs bij komt.
    await prisma.sampleCriterionCheck.update({
      where: {
        sampleItemId_wcagCriterionId: { sampleItemId: sample.id, wcagCriterionId: criterium.id },
      },
      data: { verantwoording: nieuweVerantwoording as any },
    });
  } else {
    await prisma.sampleCriterionCheck.create({
      data: {
        sampleItemId: sample.id,
        wcagCriterionId: criterium.id,
        // Er is gemeten, er is nog niet geoordeeld. Dat is precies wat niet_te_bepalen
        // zegt, en het zet de kaart op de stapel zodat de vraag niet blijft liggen.
        status: 'niet_te_bepalen' as any,
        reden:
          'Gemeten vanaf de kaart. De meting staat eronder; het oordeel moet nog gegeven worden.',
        bron: 'handmatig' as any,
        verantwoording: nieuweVerantwoording as any,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    commando,
    url: sample.url,
    nieuwOordeel: !bestaand,
    stap: laatste.stap ?? null,
    uitkomst: laatste.uitkomst ?? null,
    antwoord: gedraaid.antwoord,
  });
}
