import { NextRequest, NextResponse } from 'next/server';
import { leesLogboek } from '@/scripts/lib/audit-log';
import { draaiMeting } from '@/lib/meting-draaien';

/**
 * Een vastgelegde meting nog eens draaien, en de uitkomst naast de oude zetten.
 *
 * Dit is niet alleen een controle op de auditor. Bij een herinspectie is het het
 * eigenlijke werk: je wilt niet weten of er goed gemeten is, je wilt weten of de site
 * is veranderd. Dezelfde knop antwoordt op beide vragen — verschilt de uitkomst, dan
 * is óf de pagina aangepast óf de meting was fout, en beide wil je weten.
 *
 * Wat er mag draaien en met welke vlaggen staat in `lib/metingen.ts`, en het draaien zelf
 * in `lib/meting-draaien.ts`. Die lijst stond hier, maar er kwam een tweede route bij die
 * hetzelfde moet toestaan; twee lijsten die uit elkaar lopen betekent dat een commando in
 * het ene scherm wel werkt en in het andere niet.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Er staat geen browser op een productieserver, en een route die processen start
  // hoort daar hoe dan ook niet te bestaan. Zelfde slot als /api/audit-session/start.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Een meting herhalen kan alleen vanaf de lokale dev-server.' },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ongeldige body' }, { status: 400 });
  }

  const commando: string = body.commando ?? '';
  const url: string = body.url ?? '';
  const argumenten: Record<string, string> = body.argumenten ?? {};

  const gedraaid = await draaiMeting(commando, url, argumenten);
  if (!gedraaid.ok) {
    // Een geweigerd commando is een fout van de aanroeper, een mislukte meting van de
    // machine. Dat onderscheid bepaalt of de gebruiker iets anders moet proberen of het
    // nog eens moet doen.
    const geweigerd = !gedraaid.details;
    return NextResponse.json(
      { ok: false, error: gedraaid.error, details: gedraaid.details },
      { status: geweigerd ? 400 : 500 }
    );
  }

  // De nieuwe logboekregel erbij, en dát is wat de kaart vergelijkt.
  //
  // Niet het antwoord hierboven: dat is de weergave voor een mens, met opgemaakte
  // waarden. Het logboek slaat paginabreedte op als 320, de weergave als "320px" — en
  // dan meldt een vergelijking altijd een afwijking terwijl er niets veranderd is. Zo'n
  // knop die bij elke klik "AFWIJKING" roept is erger dan geen knop.
  //
  // Log tegen log vergelijken is appels met appels: dezelfde velden, dezelfde soorten.
  const logboek = leesLogboek();
  const laatste = [...logboek].reverse().find((r) => r.commando === commando) ?? null;

  return NextResponse.json({
    ok: true,
    commando,
    url,
    argumenten,
    logregel: laatste,
    uitkomst: gedraaid.antwoord,
  });
}
