/**
 * Vertalen via Azure Translator (Text Translation v3).
 *
 * Een eigen Translator-resource in Azure, los van de spraakdienst voor de video's: die
 * sleutel werkt hier niet. Nodig in .env:
 *   AZURE_TRANSLATOR_KEY     de sleutel van de Translator-resource
 *   AZURE_TRANSLATOR_REGION  de regio van die resource, bijvoorbeeld "swedencentral"
 *                            (weglaten bij een globale resource)
 *
 * De sleutel komt nooit in de repo en wordt nergens getoond of gelogd.
 */

const EINDPUNT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';

export class VertaalFout extends Error {}

/**
 * Tekst tussen aanhalingstekens blijft onvertaald.
 *
 * Dat is wat er op de site staat: een knoptekst, een kop, een toegankelijke naam. Bij de
 * eerste proef werd "De toegankelijke naam is ‘Lees voor met ReadSpeaker’" vertaald naar
 * "... is ‘Read aloud with ReadSpeaker’" -- en daarmee las het issue alsof de naam wél
 * klopte. Azure laat alles met translate="no" staan, maar alleen in HTML-modus; daarom
 * wordt de tekst als HTML verstuurd en daarna weer platte tekst.
 *
 * Een rechte apostrof telt alleen als aanhalingsteken als er geen letter tegenaan staat,
 * anders wordt "pagina's" een citaat.
 */
const CITAAT = /‘[^’\n]{1,200}’|“[^”\n]{1,200}”|"[^"\n]{1,200}"|(?<![A-Za-zÀ-ɏ0-9])'[^'\n]{1,200}'(?![A-Za-zÀ-ɏ0-9])/g;

const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (t: string) =>
  t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function naarHtml(tekst: string): string {
  let uit = '';
  let vanaf = 0;
  for (const m of Array.from(tekst.matchAll(CITAAT))) {
    uit += escape(tekst.slice(vanaf, m.index));
    uit += `<span translate="no">${escape(m[0])}</span>`;
    vanaf = (m.index ?? 0) + m[0].length;
  }
  uit += escape(tekst.slice(vanaf));
  // Regeleinden overleven HTML-modus niet vanzelf.
  return uit.replace(/\r?\n/g, '<br>');
}

function vanHtml(html: string): string {
  return unescape(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<span translate="no">([\s\S]*?)<\/span>/gi, '$1')
      .replace(/<[^>]+>/g, '')
  );
}

export async function vertaal(teksten: string[], van = 'nl', naar = 'en'): Promise<string[]> {
  const sleutel = process.env.AZURE_TRANSLATOR_KEY;
  if (!sleutel) {
    throw new VertaalFout(
      'Er is geen vertaalsleutel ingesteld. Zet AZURE_TRANSLATOR_KEY (en AZURE_TRANSLATOR_REGION) in .env en herstart de server.'
    );
  }
  const kopjes: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': sleutel,
    'Content-Type': 'application/json; charset=UTF-8',
  };
  if (process.env.AZURE_TRANSLATOR_REGION) {
    kopjes['Ocp-Apim-Subscription-Region'] = process.env.AZURE_TRANSLATOR_REGION;
  }

  const res = await fetch(`${EINDPUNT}&from=${van}&to=${naar}&textType=html`, {
    method: 'POST',
    headers: kopjes,
    body: JSON.stringify(teksten.map((t) => ({ Text: naarHtml(t) }))),
  });
  if (!res.ok) {
    // Alleen de foutmelding van Azure doorgeven, nooit de verzonden kopjes.
    let melding = `Azure Translator gaf ${res.status}`;
    try {
      const fout = await res.json();
      if (fout?.error?.message) melding += `: ${fout.error.message}`;
    } catch {
      // geen JSON
    }
    throw new VertaalFout(melding);
  }
  const uitkomst: { translations: { text: string }[] }[] = await res.json();
  return uitkomst.map((u) => vanHtml(u.translations?.[0]?.text ?? ''));
}
