import { NextRequest } from 'next/server';
import { haalSessie, sluitSessie, SCHERM_BREEDTE, SCHERM_HOOGTE } from '@/lib/schermsessie';

/**
 * De beeldstroom van de browser in het paneel.
 *
 * Een verbinding die openblijft (server-sent events) en per beeld één regel stuurt. Geen
 * websocket: het verkeer gaat maar één kant op — de invoer loopt via een gewone POST naar
 * `/api/meting/scherm/invoer`, en dat is genoeg voor klikken en typen.
 *
 * Zie `lib/schermsessie.ts` voor waarom dit geen `<iframe>` is.
 */

export const dynamic = 'force-dynamic';
// Een beeldstroom is per definitie langlopend; zonder dit knipt Next hem af.
export const maxDuration = 3600;

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Alleen lokaal beschikbaar', { status: 400 });
  }

  const url = request.nextUrl.searchParams.get('url') ?? '';
  const id = request.nextUrl.searchParams.get('sessie') ?? '';
  if (!id) return new Response('Geen sessie opgegeven', { status: 400 });

  let doel: URL;
  try {
    doel = new URL(url);
  } catch {
    return new Response('Ongeldig adres', { status: 400 });
  }
  if (doel.protocol !== 'http:' && doel.protocol !== 'https:') {
    return new Response('Alleen http en https', { status: 400 });
  }

  const sessie = await haalSessie(id, doel.toString());

  const stroom = new ReadableStream({
    start(controller) {
      const codeer = new TextEncoder();
      const stuur = (soort: string, gegevens: unknown) => {
        try {
          controller.enqueue(codeer.encode(`event: ${soort}\ndata: ${JSON.stringify(gegevens)}\n\n`));
        } catch {
          // De lezer is weg; de opruiming hieronder handelt dat af.
        }
      };

      stuur('start', {
        breedte: SCHERM_BREEDTE,
        hoogte: SCHERM_HOOGTE,
        url: sessie.url,
      });
      // Wie later aanhaakt wil niet op het volgende beeld wachten.
      if (sessie.laatsteBeeld) stuur('beeld', { beeld: sessie.laatsteBeeld });

      const luister = (beeld: string) => stuur('beeld', { beeld });
      sessie.luisteraars.add(luister);

      // Een stille verbinding wordt door tussenliggende lagen dichtgeknepen; een pagina waar
      // niets op beweegt levert geen beelden op en is dus stil.
      const hartslag = setInterval(() => stuur('leeft', { tijd: Date.now() }), 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(hartslag);
        sessie.luisteraars.delete(luister);
        try {
          controller.close();
        } catch {
          // Al gesloten.
        }
      });
    },
  });

  return new Response(stroom, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/** Het paneel sluiten sluit de browser: een proces dat niemand meer bekijkt hoort niet te draaien. */
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Alleen lokaal beschikbaar', { status: 400 });
  }
  const id = request.nextUrl.searchParams.get('sessie') ?? '';
  if (id) await sluitSessie(id);
  return Response.json({ ok: true });
}
