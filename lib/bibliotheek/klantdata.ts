/**
 * Waarschuwing bij het opslaan van een casus die op klantdata lijkt
 * (docs/bibliotheek/SPEC.md, besluit 13). Een casus is oefenmateriaal en komt
 * later bij externen terecht.
 *
 * Bewust smal: een waarschuwing die bij elke tweede casus afgaat, wordt
 * weggeklikt zonder te lezen. Drie dingen tellen:
 * - een e-mailadres, behalve op een voorbeelddomein;
 * - een telefoonnummer, behalve het gemeentenummer 14 0xx en verzonnen reeksen;
 * - een URL op het domein van een onderzoek in de app.
 * Het is een waarschuwing, geen blokkade.
 */

export type KlantDomein = { domein: string; onderzoek: string };

export type Melding = { soort: 'e-mail' | 'telefoon' | 'klantsite'; tekst: string; uitleg: string };

const VOORBEELDDOMEINEN = /(^|\.)(voorbeeld\.nl|example\.(com|org|net)|[a-z0-9-]+\.example)$/i;

/** 'https://www.beverwijk.nl/x' → 'beverwijk.nl' */
export function kaleHost(url: string): string | null {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/** Het domein van een onderzoek: de host die het vaakst voorkomt in scope en steekproef. */
export function hoofddomein(urls: (string | null)[]): string | null {
  const telling = new Map<string, number>();
  for (const url of urls) {
    const host = url ? kaleHost(url) : null;
    if (host) telling.set(host, (telling.get(host) ?? 0) + 1);
  }
  let beste: string | null = null;
  let max = 0;
  telling.forEach((n, host) => {
    if (n > max) {
      beste = host;
      max = n;
    }
  });
  return beste;
}

function isVerzonnenNummer(cijfers: string): boolean {
  if (/^140\d{2,3}$/.test(cijfers)) return true; // 14 010, 14 0123: gemeentenummer
  if (/(\d)\1{5,}/.test(cijfers)) return true; // 000000, 111111
  if (/123456|234567|345678|456789|987654/.test(cijfers)) return true;
  return false;
}

export function zoekKlantdata(tekst: string, domeinen: KlantDomein[]): Melding[] {
  const meldingen: Melding[] = [];
  const gezien = new Set<string>();
  const voegToe = (m: Melding) => {
    const sleutel = `${m.soort}:${m.tekst}`;
    if (!gezien.has(sleutel)) {
      gezien.add(sleutel);
      meldingen.push(m);
    }
  };

  for (const m of Array.from(tekst.matchAll(/[\w.+-]+@([\w-]+(?:\.[\w-]+)+)/g))) {
    if (VOORBEELDDOMEINEN.test(m[1])) continue;
    voegToe({ soort: 'e-mail', tekst: m[0], uitleg: 'Een e-mailadres. Gebruik een adres op voorbeeld.nl.' });
  }

  // Nederlandse nummers: 0 + 9 cijfers, of +31 / 0031, met spaties of streepjes ertussen;
  // en het korte 14-nummer, dat altijd mag.
  const nummer = /(?:\+31|0031|\b0)[\s-]?(?:\(0\)[\s-]?)?\d(?:[\s-]?\d){7,9}\b|\b14[\s-]?0\d{2,3}\b/g;
  for (const m of Array.from(tekst.matchAll(nummer))) {
    const cijfers = m[0].replace(/\D/g, '').replace(/^(0031|31)/, '0');
    if (isVerzonnenNummer(cijfers)) continue;
    voegToe({ soort: 'telefoon', tekst: m[0].trim(), uitleg: 'Een telefoonnummer. Gebruik 14 0xx of een verzonnen reeks.' });
  }

  for (const m of Array.from(tekst.matchAll(/\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(?=[\/\s"'<>)]|$)/gi))) {
    const host = m[1].toLowerCase();
    const raak = domeinen.find((d) => host === d.domein || host.endsWith(`.${d.domein}`));
    if (raak) {
      voegToe({
        soort: 'klantsite',
        tekst: m[0],
        uitleg: `Het domein van onderzoek ${raak.onderzoek}. Gebruik een verzonnen gemeente.`,
      });
    }
  }
  return meldingen;
}
