/**
 * PDF-bouwer: een toegankelijke PDF vanaf nul samenstellen.
 *
 * De onderzoeker zet blokken onder elkaar: koppen, alinea's, lijsten, afbeeldingen en
 * tabellen. Elk blok heeft precies één betekenis, en die betekenis wordt de tag in de PDF.
 * Er is dus geen stap waarin achteraf geraden wordt wat iets is: wat je als kop 2 invoert,
 * wordt H2.
 *
 * Een afbeelding heeft naast het korte tekstalternatief een uitgebreide beschrijving. Die
 * komt als zichtbare, gewone tekst direct onder de afbeelding (of onder het bijschrift), zoals
 * besproken in docs/plannen/pdf-nieuw-opbouwen-onderzoek.md. Omdat het document opnieuw
 * wordt opgemaakt, schuift de rest vanzelf op en loopt het door naar de volgende pagina.
 */

export type Kopniveau = 1 | 2 | 3 | 4 | 5 | 6;

export type Blok =
  | { id: string; soort: 'kop'; niveau: Kopniveau; tekst: string }
  | { id: string; soort: 'alinea'; tekst: string }
  | { id: string; soort: 'lijst'; genummerd: boolean; items: string[] }
  | {
      id: string;
      soort: 'afbeelding';
      /** Data-URL van het bestand; de afbeelding zit in het document zelf. */
      bron: string;
      /** Decoratief: geen tekstalternatief, wordt in de PDF een artefact. */
      decoratief: boolean;
      alt: string;
      bijschrift: string;
      /** Zichtbare tekst onder de afbeelding; mag meerdere alinea's hebben. */
      beschrijving: string;
      /** Breedte als percentage van de tekstbreedte. */
      breedte: number;
    }
  | {
      id: string;
      soort: 'tabel';
      bijschrift: string;
      /** Rij voor rij, cel voor cel. Alle rijen even lang. */
      rijen: string[][];
      kopRij: boolean;
      kopKolom: boolean;
    }
  | { id: string; soort: 'paginaeinde' };

export type Bloksoort = Blok['soort'];

export type Lettertype = 'Arial' | 'Calibri' | 'Verdana' | 'Georgia';
export const LETTERTYPEN: Lettertype[] = ['Arial', 'Calibri', 'Verdana', 'Georgia'];

export interface PdfDocument {
  id: string;
  titel: string;
  /** BCP 47, bijvoorbeeld "nl-NL". */
  taal: string;
  auteur: string;
  lettertype: Lettertype;
  /** Grootte van de gewone tekst in punten. */
  tekstgrootte: number;
  paginanummers: boolean;
  blokken: Blok[];
  aangemaakt: string;
  gewijzigd: string;
}

/** De tag die een blok in de PDF krijgt, om naast het blok te tonen. */
export function tagVan(blok: Blok): string {
  switch (blok.soort) {
    case 'kop':
      return `H${blok.niveau}`;
    case 'alinea':
      return 'P';
    case 'lijst':
      return 'L';
    case 'afbeelding': {
      const delen = [blok.decoratief ? 'Artefact' : 'Figure'];
      if (blok.bijschrift.trim()) delen.push('P (bijschrift)');
      if (blok.beschrijving.trim()) delen.push('P (beschrijving)');
      return delen.join(' + ');
    }
    case 'tabel':
      return 'Table';
    case 'paginaeinde':
      return 'geen tag';
  }
}

export function nieuwId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function nieuwBlok(soort: Bloksoort): Blok {
  const id = nieuwId();
  switch (soort) {
    case 'kop':
      return { id, soort, niveau: 2, tekst: '' };
    case 'alinea':
      return { id, soort, tekst: '' };
    case 'lijst':
      return { id, soort, genummerd: false, items: [''] };
    case 'afbeelding':
      return {
        id,
        soort,
        bron: '',
        decoratief: false,
        alt: '',
        bijschrift: '',
        beschrijving: '',
        breedte: 100,
      };
    case 'tabel':
      return {
        id,
        soort,
        bijschrift: '',
        rijen: [
          ['', ''],
          ['', ''],
        ],
        kopRij: true,
        kopKolom: false,
      };
    case 'paginaeinde':
      return { id, soort };
  }
}

export function nieuwDocument(titel: string): PdfDocument {
  const nu = new Date().toISOString();
  return {
    id: nieuwId(),
    titel,
    taal: 'nl-NL',
    auteur: '',
    lettertype: 'Arial',
    tekstgrootte: 11,
    paginanummers: true,
    blokken: [{ ...(nieuwBlok('kop') as Extract<Blok, { soort: 'kop' }>), niveau: 1, tekst: titel }],
    aangemaakt: nu,
    gewijzigd: nu,
  };
}

// ── Controle ──────────────────────────────────────────────────────────

export interface Melding {
  ernst: 'fout' | 'waarschuwing';
  /** Id van het blok waar het om gaat; leeg voor het document als geheel. */
  blokId: string | null;
  tekst: string;
}

/** Een tekstalternatief langer dan dit hoort eerder in de beschrijving. */
const ALT_MAX = 150;

/**
 * Wat er aan het document mankeert voordat er een PDF van gemaakt wordt.
 *
 * Een fout houdt de PDF tegen: het resultaat zou niet toegankelijk zijn. Een waarschuwing
 * niet: dat is iets om naar te kijken, maar er kan een reden voor zijn.
 */
export function controleer(doc: PdfDocument): Melding[] {
  const m: Melding[] = [];
  const fout = (blokId: string | null, tekst: string) => m.push({ ernst: 'fout', blokId, tekst });
  const let_op = (blokId: string | null, tekst: string) =>
    m.push({ ernst: 'waarschuwing', blokId, tekst });

  if (!doc.titel.trim()) fout(null, 'Het document heeft geen titel.');
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(doc.taal.trim())) {
    fout(null, `De taal "${doc.taal}" is geen geldige taalcode, zoals nl-NL of en-GB.`);
  }

  const inhoud = doc.blokken.filter((b) => b.soort !== 'paginaeinde');
  if (inhoud.length === 0) fout(null, 'Het document heeft nog geen inhoud.');

  let vorigNiveau = 0;
  let eersteKop = true;
  for (const b of doc.blokken) {
    switch (b.soort) {
      case 'kop':
        if (!b.tekst.trim()) {
          fout(b.id, 'Een kop zonder tekst.');
          break;
        }
        if (eersteKop && b.niveau !== 1) {
          let_op(b.id, `De eerste kop is kop ${b.niveau}; een document begint meestal met kop 1.`);
        }
        if (!eersteKop && b.niveau > vorigNiveau + 1) {
          let_op(b.id, `Kop ${b.niveau} volgt op kop ${vorigNiveau}; er wordt een niveau overgeslagen.`);
        }
        eersteKop = false;
        vorigNiveau = b.niveau;
        break;
      case 'alinea':
        if (!b.tekst.trim()) let_op(b.id, 'Een lege alinea; die wordt overgeslagen.');
        break;
      case 'lijst':
        if (b.items.every((i) => !i.trim())) let_op(b.id, 'Een lege lijst; die wordt overgeslagen.');
        else if (b.items.filter((i) => i.trim()).length === 1) {
          let_op(b.id, 'Een lijst met één item. Is dat een lijst, of een gewone alinea?');
        }
        break;
      case 'afbeelding':
        if (!b.bron) fout(b.id, 'Er is nog geen afbeelding gekozen.');
        if (!b.decoratief && !b.alt.trim()) {
          fout(b.id, 'De afbeelding heeft geen tekstalternatief. Vul het in, of vink decoratief aan.');
        }
        if (!b.decoratief && b.alt.trim().length > ALT_MAX) {
          let_op(
            b.id,
            `Het tekstalternatief is ${b.alt.trim().length} tekens. Houd het kort en zet de uitleg in de beschrijving.`,
          );
        }
        if (b.decoratief && (b.bijschrift.trim() || b.beschrijving.trim())) {
          let_op(b.id, 'Een decoratieve afbeelding met bijschrift of beschrijving. Is hij wel decoratief?');
        }
        break;
      case 'tabel': {
        if (!b.kopRij && !b.kopKolom) {
          let_op(b.id, 'De tabel heeft geen kopcellen. Is het een tabel met gegevens?');
        }
        if (b.kopRij && b.rijen[0]?.some((c) => !c.trim())) {
          let_op(b.id, 'Er staat een lege cel in de koprij.');
        }
        if (b.rijen.length < 2 || (b.rijen[0]?.length ?? 0) < 2) {
          let_op(b.id, 'Een tabel met één rij of één kolom. Is een lijst hier niet beter?');
        }
        break;
      }
      case 'paginaeinde':
        break;
    }
  }

  return m;
}
