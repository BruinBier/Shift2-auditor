/**
 * Klantprojecten uitwisselen via Excel.
 *
 * Excel is bewust de losse tussenlaag tussen Shift2 Auditor en Dynamics: er is
 * geen koppeling, de onderzoeker legt de twee lijsten zelf naast elkaar. Daarom
 * is de import een controle met een voorstel, en geen synchronisatie:
 *
 * - een regel koppelt op het id van het klantproject, nooit op naam of nummer;
 * - een regel zonder id is een nieuw project;
 * - een project dat niet in het bestand staat blijft gewoon bestaan;
 * - één ernstige fout en er gebeurt niets, ook niet met de goede regels;
 * - is een project na de export in de tool gewijzigd, dan is dat een fout: de
 *   import zou die wijziging anders stil overschrijven.
 *
 * Deze module raakt de database niet; de routes halen de huidige stand op en
 * geven die mee. Dat houdt de controle te testen zonder database.
 */
import ExcelJS from 'exceljs';
import { createHash } from 'crypto';

export const BLAD_PROJECTEN = 'Projecten';
export const BLAD_OPDRACHTGEVERS = 'Opdrachtgevers';
export const BLAD_UITLEG = 'Uitleg';

export type Veld =
  | 'id'
  | 'name'
  | 'opdrachtgeverKenmerk'
  | 'opdrachtgeverNaam'
  | 'projectnummer'
  | 'cardanKenmerk'
  | 'contactnaam'
  | 'contactEmail'
  | 'aantalOnderzoeken'
  | 'updatedAt';

export type Kolom = {
  veld: Veld;
  kop: string;
  /** Wordt bij het inlezen gelezen. Alleen-lezen kolommen dienen ter informatie of controle. */
  bewerkbaar: boolean;
  /** Moet als kolom in het bestand staan. */
  verplichteKolom: boolean;
  breedte: number;
  uitleg: string;
};

/** De kolommen in de volgorde van het werkblad. De kop is wat de gebruiker ziet en wat we teruglezen. */
export const KOLOMMEN: Kolom[] = [
  {
    veld: 'id',
    kop: 'Project-ID (niet wijzigen)',
    bewerkbaar: false,
    verplichteKolom: true,
    breedte: 40,
    uitleg: 'Vaste sleutel van het project in Shift2 Auditor. Laat leeg bij een nieuw project; wijzig of kopieer hem nooit.',
  },
  {
    veld: 'name',
    kop: 'Projectnaam',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 40,
    uitleg: 'Verplicht.',
  },
  {
    veld: 'opdrachtgeverKenmerk',
    kop: 'Opdrachtgever (kenmerk)',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 18,
    uitleg: 'Verplicht. Het kenmerk van een bestaande opdrachtgever, zie het blad Opdrachtgevers. Een nieuwe opdrachtgever maak je eerst aan in de tool.',
  },
  {
    veld: 'opdrachtgeverNaam',
    kop: 'Opdrachtgever (naam, ter info)',
    bewerkbaar: false,
    verplichteKolom: false,
    breedte: 32,
    uitleg: 'Ter informatie; wordt bij het inlezen genegeerd.',
  },
  {
    veld: 'projectnummer',
    kop: 'CRM-nummer',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 14,
    uitleg: 'Het projectnummer uit Dynamics, P gevolgd door vijf cijfers (P02645). Mag leeg.',
  },
  {
    veld: 'cardanKenmerk',
    kop: 'Cardan-kenmerk',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 14,
    uitleg: 'C- gevolgd door vier cijfers (C-4521). Mag leeg.',
  },
  {
    veld: 'contactnaam',
    kop: 'Contactpersoon',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 26,
    uitleg: 'Mag leeg.',
  },
  {
    veld: 'contactEmail',
    kop: 'E-mail contactpersoon',
    bewerkbaar: true,
    verplichteKolom: true,
    breedte: 32,
    uitleg: 'Een geldig e-mailadres. Mag leeg.',
  },
  {
    veld: 'aantalOnderzoeken',
    kop: 'Aantal onderzoeken (ter info)',
    bewerkbaar: false,
    verplichteKolom: false,
    breedte: 14,
    uitleg: 'Ter informatie; wordt bij het inlezen genegeerd.',
  },
  {
    veld: 'updatedAt',
    kop: 'Laatst gewijzigd in tool (niet wijzigen)',
    bewerkbaar: false,
    verplichteKolom: true,
    breedte: 26,
    uitleg: 'Moment van de export. Is het project daarna in de tool gewijzigd, dan weigert de import die regel, zodat er niets stil wordt overschreven.',
  },
];

/** De velden die de import kan wijzigen, met hun Nederlandse naam voor het controleoverzicht. */
export const BEWERKBARE_VELDEN = ['name', 'opdrachtgeverKenmerk', 'projectnummer', 'cardanKenmerk', 'contactnaam', 'contactEmail'] as const;
export type BewerkbaarVeld = (typeof BEWERKBARE_VELDEN)[number];

export const VELDNAAM: Record<BewerkbaarVeld, string> = {
  name: 'Projectnaam',
  opdrachtgeverKenmerk: 'Opdrachtgever',
  projectnummer: 'CRM-nummer',
  cardanKenmerk: 'Cardan-kenmerk',
  contactnaam: 'Contactpersoon',
  contactEmail: 'E-mail contactpersoon',
};

/** Zo ziet een klantproject eruit voor export en controle. */
export type ProjectStand = {
  id: string;
  name: string;
  opdrachtgeverKenmerk: string;
  opdrachtgeverNaam: string;
  projectnummer: string | null;
  cardanKenmerk: string | null;
  contactnaam: string | null;
  contactEmail: string | null;
  aantalOnderzoeken: number;
  updatedAt: Date;
};

export type OpdrachtgeverStand = { id: string; kenmerk: string; naam: string };

export type Melding = {
  /** Regelnummer in Excel; ontbreekt bij een fout in het bestand als geheel. */
  regel?: number;
  kolom?: string;
  bericht: string;
};

export type Wijziging = { veld: BewerkbaarVeld; label: string; oud: string | null; nieuw: string | null };

export type NieuwProject = {
  regel: number;
  name: string;
  opdrachtgeverId: string;
  opdrachtgeverKenmerk: string;
  projectnummer: string | null;
  cardanKenmerk: string | null;
  contactnaam: string | null;
  contactEmail: string | null;
};

export type GewijzigdProject = {
  regel: number;
  id: string;
  name: string;
  wijzigingen: Wijziging[];
  /** Wat er naar de database gaat; alleen de gewijzigde velden. */
  data: Partial<{
    name: string;
    opdrachtgeverId: string;
    projectnummer: string | null;
    cardanKenmerk: string | null;
    contactnaam: string | null;
    contactEmail: string | null;
  }>;
};

export type Controle = {
  nieuw: NieuwProject[];
  gewijzigd: GewijzigdProject[];
  ongewijzigd: { regel: number; id: string; name: string }[];
  /** Projecten in de tool die niet in het bestand staan. Ze blijven bestaan. */
  nietInBestand: { id: string; name: string }[];
  /** Ernstig: zolang hier iets staat, wordt er niets toegepast. */
  fouten: Melding[];
  /** Ter controle; blokkeren de import niet. */
  waarschuwingen: Melding[];
  /** Vingerafdruk van wat er toegepast gaat worden. Bij toepassen moet hij nog kloppen. */
  vingerafdruk: string;
};

const CRM_VORM = /^P\d{5}$/;
const CARDAN_VORM = /^C-\d{4}$/;
// Bewust ruim: we willen een tikfout vangen, geen RFC nalopen.
const EMAIL_VORM = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_VORM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MAX_REGELS = 5000;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const KOPKLEUR = 'FF1F0036'; // shift2-primary
const ALLEEN_LEZEN_KLEUR = 'FFF3F4F6';

export async function maakWerkmap(projecten: ProjectStand[], opdrachtgevers: OpdrachtgeverStand[], nu = new Date()) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shift2 Auditor';
  wb.created = nu;

  const ws = wb.addWorksheet(BLAD_PROJECTEN, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = KOLOMMEN.map(k => ({ header: k.kop, key: k.veld, width: k.breedte }));

  const kop = ws.getRow(1);
  kop.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  kop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: KOPKLEUR } };
  kop.alignment = { vertical: 'middle', wrapText: true };
  kop.height = 32;
  KOLOMMEN.forEach((k, i) => {
    kop.getCell(i + 1).note = k.uitleg;
  });

  const gesorteerd = [...projecten].sort(
    (a, b) => a.opdrachtgeverNaam.localeCompare(b.opdrachtgeverNaam, 'nl') || a.name.localeCompare(b.name, 'nl')
  );
  for (const p of gesorteerd) {
    ws.addRow({
      id: p.id,
      name: p.name,
      opdrachtgeverKenmerk: p.opdrachtgeverKenmerk,
      opdrachtgeverNaam: p.opdrachtgeverNaam,
      projectnummer: p.projectnummer ?? '',
      cardanKenmerk: p.cardanKenmerk ?? '',
      contactnaam: p.contactnaam ?? '',
      contactEmail: p.contactEmail ?? '',
      aantalOnderzoeken: p.aantalOnderzoeken,
      // Als tekst en in UTC: een Excel-datum verliest de milliseconden en schuift
      // met de tijdzone, en dan klopt de controle op latere wijzigingen niet meer.
      updatedAt: p.updatedAt.toISOString(),
    });
  }

  // Alleen-lezen kolommen grijs, zodat zichtbaar is wat je niet hoort te wijzigen.
  KOLOMMEN.forEach((k, i) => {
    if (k.bewerkbaar) return;
    ws.getColumn(i + 1).eachCell({ includeEmpty: false }, (cel, rij) => {
      if (rij === 1) return;
      cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALLEEN_LEZEN_KLEUR } };
      cel.font = { color: { argb: 'FF4B5563' } };
    });
  });
  // Getallen-als-tekst: anders maakt Excel van P02645 niets, maar van 02645 wel 2645.
  for (const veld of ['id', 'projectnummer', 'cardanKenmerk', 'updatedAt'] as Veld[]) {
    ws.getColumn(veld).numFmt = '@';
  }

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: KOLOMMEN.length } };

  // Keuzelijst voor de opdrachtgever, uit het tweede blad.
  const og = wb.addWorksheet(BLAD_OPDRACHTGEVERS, { views: [{ state: 'frozen', ySplit: 1 }] });
  og.columns = [
    { header: 'Kenmerk', key: 'kenmerk', width: 16 },
    { header: 'Naam', key: 'naam', width: 40 },
  ];
  og.getRow(1).font = { bold: true };
  const ogGesorteerd = [...opdrachtgevers].sort((a, b) => a.kenmerk.localeCompare(b.kenmerk, 'nl'));
  for (const o of ogGesorteerd) og.addRow({ kenmerk: o.kenmerk, naam: o.naam });

  if (ogGesorteerd.length > 0) {
    const kolomNr = KOLOMMEN.findIndex(k => k.veld === 'opdrachtgeverKenmerk') + 1;
    const letter = ws.getColumn(kolomNr).letter;
    const lijst = `${BLAD_OPDRACHTGEVERS}!$A$2:$A$${ogGesorteerd.length + 1}`;
    // Ruimte voor nieuwe regels onder de bestaande.
    const tot = Math.max(gesorteerd.length + 1, 1) + 500;
    for (let r = 2; r <= tot; r++) {
      ws.getCell(`${letter}${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [lijst],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Onbekende opdrachtgever',
        error: 'Kies een kenmerk uit het blad Opdrachtgevers.',
      };
    }
  }

  const uitleg = wb.addWorksheet(BLAD_UITLEG);
  uitleg.getColumn(1).width = 38;
  uitleg.getColumn(2).width = 100;
  uitleg.addRow(['Klantprojecten uit Shift2 Auditor']).font = { bold: true, size: 14 };
  uitleg.addRow([`Geëxporteerd op ${nu.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}.`]);
  uitleg.addRow([]);
  for (const regel of [
    'Pas gegevens aan op het blad Projecten en lees het bestand in met "Excel uploaden" op de pagina Projecten.',
    'Je ziet eerst een controleoverzicht. Er verandert pas iets als je de import bevestigt.',
    'Een nieuw project: voeg onderaan een regel toe en laat het Project-ID leeg.',
    'Een regel weghalen verwijdert het project niet. Verwijderen gaat alleen in de tool zelf.',
    'Een lege cel in een bestaand project maakt dat veld leeg. Het controleoverzicht laat dat zien.',
    'Wijzig de bladnamen en kolomkoppen niet; de import herkent het bestand eraan.',
  ]) {
    uitleg.addRow([regel]);
  }
  uitleg.addRow([]);
  uitleg.addRow(['Kolom', 'Uitleg']).font = { bold: true };
  for (const k of KOLOMMEN) uitleg.addRow([k.kop, k.uitleg]);
  uitleg.getColumn(2).alignment = { wrapText: true, vertical: 'top' };

  return wb;
}

// ---------------------------------------------------------------------------
// Inlezen
// ---------------------------------------------------------------------------

export type GelezenRegel = {
  regel: number;
  waarden: Partial<Record<Veld, string>>;
  /** De ruwe waarde van "Laatst gewijzigd", want die kan als datum terugkomen. */
  updatedAtRuw: unknown;
};

export type Gelezen =
  | { ok: true; regels: GelezenRegel[]; waarschuwingen: Melding[] }
  | { ok: false; fouten: Melding[] };

function normaliseerKop(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Tekst uit een cel, wat Excel er ook van gemaakt heeft. */
export function celTekst(waarde: unknown): string {
  if (waarde === null || waarde === undefined) return '';
  if (typeof waarde === 'string') return waarde.trim();
  if (typeof waarde === 'number' || typeof waarde === 'boolean') return String(waarde).trim();
  if (waarde instanceof Date) return waarde.toISOString();
  if (typeof waarde === 'object') {
    const w = waarde as Record<string, unknown>;
    if (Array.isArray(w.richText)) return (w.richText as { text: string }[]).map(d => d.text).join('').trim();
    if ('text' in w && typeof w.text === 'string') return w.text.trim(); // hyperlink, ook mailto
    if ('result' in w) return celTekst(w.result); // formule
    if ('error' in w) return '';
  }
  return String(waarde).trim();
}

export async function leesWerkmap(buffer: ArrayBuffer | Buffer): Promise<Gelezen> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as ArrayBuffer);
  } catch {
    return {
      ok: false,
      fouten: [{ bericht: 'Het bestand kon niet worden gelezen. Upload een .xlsx-bestand dat met "Exporteren naar Excel" is gemaakt.' }],
    };
  }

  const ws = wb.getWorksheet(BLAD_PROJECTEN);
  if (!ws) {
    return {
      ok: false,
      fouten: [{ bericht: `Het blad "${BLAD_PROJECTEN}" ontbreekt. Gebruik een bestand dat met "Exporteren naar Excel" is gemaakt en wijzig de bladnaam niet.` }],
    };
  }

  // Kolommen opzoeken op hun kop, zodat een verschoven of extra kolom geen kwaad kan.
  const kopRij = ws.getRow(1);
  const kolomVan = new Map<Veld, number>();
  const onbekend: string[] = [];
  const fouten: Melding[] = [];
  kopRij.eachCell({ includeEmpty: false }, (cel, nr) => {
    const tekst = celTekst(cel.value);
    if (!tekst) return;
    const kolom = KOLOMMEN.find(k => normaliseerKop(k.kop) === normaliseerKop(tekst));
    if (!kolom) {
      onbekend.push(tekst);
      return;
    }
    if (kolomVan.has(kolom.veld)) {
      fouten.push({ kolom: kolom.kop, bericht: `De kolom "${kolom.kop}" staat twee keer in het bestand.` });
      return;
    }
    kolomVan.set(kolom.veld, nr);
  });
  for (const k of KOLOMMEN) {
    if (k.verplichteKolom && !kolomVan.has(k.veld)) {
      fouten.push({ kolom: k.kop, bericht: `De kolom "${k.kop}" ontbreekt. Zet hem terug met precies deze kop.` });
    }
  }
  if (fouten.length) return { ok: false, fouten };

  const waarschuwingen: Melding[] = onbekend.map(kop => ({
    kolom: kop,
    bericht: `De kolom "${kop}" is onbekend en wordt genegeerd.`,
  }));

  const regels: GelezenRegel[] = [];
  const laatste = ws.actualRowCount > 0 ? ws.rowCount : 1;
  for (let nr = 2; nr <= laatste; nr++) {
    const rij = ws.getRow(nr);
    const waarden: Partial<Record<Veld, string>> = {};
    let updatedAtRuw: unknown = undefined;
    let leeg = true;
    for (const [veld, kol] of Array.from(kolomVan.entries())) {
      const ruw = rij.getCell(kol).value;
      const tekst = celTekst(ruw);
      if (veld === 'updatedAt') updatedAtRuw = ruw;
      waarden[veld] = tekst;
      // Alleen bewerkbare kolommen en het id tellen voor "is deze regel leeg";
      // een regel met alleen een overgebleven info-cel is geen project.
      const kolom = KOLOMMEN.find(k => k.veld === veld)!;
      if (tekst && (kolom.bewerkbaar || veld === 'id')) leeg = false;
    }
    if (leeg) continue;
    regels.push({ regel: nr, waarden, updatedAtRuw });
  }

  if (regels.length > MAX_REGELS) {
    return {
      ok: false,
      fouten: [{ bericht: `Het bestand bevat ${regels.length} regels; de import verwerkt er hoogstens ${MAX_REGELS}.` }],
    };
  }

  return { ok: true, regels, waarschuwingen };
}

// ---------------------------------------------------------------------------
// Controleren
// ---------------------------------------------------------------------------

function leegAlsNull(s: string | undefined): string | null {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
}

/**
 * Een waarde in de vorm waarin we vergelijken en opslaan. Geldt voor het bestand
 * en voor de tool, zodat een spatie achteraan of een kleine letter geen wijziging is.
 */
export function normaal(veld: BewerkbaarVeld, waarde: string | null | undefined): string | null {
  const t = leegAlsNull(waarde ?? undefined);
  if (t === null) return null;
  if (veld === 'opdrachtgeverKenmerk' || veld === 'projectnummer' || veld === 'cardanKenmerk') return t.toUpperCase();
  return t;
}

function leesMoment(ruw: unknown): Date | null {
  // Alleen de tekst die de export schrijft. Heeft Excel er een datum van gemaakt
  // (getal of Date), dan is de tijdzone weg en is een conflict niet meer
  // betrouwbaar vast te stellen; een vrij getypte datum is bovendien dubbelzinnig.
  if (typeof ruw !== 'string' && !(ruw && typeof ruw === 'object' && 'richText' in ruw)) return null;
  const tekst = celTekst(ruw);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(tekst)) return null;
  const d = new Date(tekst);
  return isNaN(d.getTime()) ? null : d;
}

export function controleer(
  gelezen: { regels: GelezenRegel[]; waarschuwingen?: Melding[] },
  projecten: ProjectStand[],
  opdrachtgevers: OpdrachtgeverStand[]
): Controle {
  const fouten: Melding[] = [];
  const waarschuwingen: Melding[] = [...(gelezen.waarschuwingen ?? [])];
  const nieuw: NieuwProject[] = [];
  const gewijzigd: GewijzigdProject[] = [];
  const ongewijzigd: Controle['ongewijzigd'] = [];

  const projectOp = new Map(projecten.map(p => [p.id.toLowerCase(), p]));
  const ogOp = new Map(opdrachtgevers.map(o => [o.kenmerk.trim().toUpperCase(), o]));
  const gezienIds = new Map<string, number>();
  // Welk project heeft welk CRM-nummer; voor de waarschuwing bij een nieuw of gewijzigd nummer.
  const crmBij = new Map<string, string>();
  for (const p of projecten) {
    const n = normaal('projectnummer', p.projectnummer);
    if (n && !crmBij.has(n)) crmBij.set(n, p.name);
  }

  for (const { regel, waarden, updatedAtRuw } of gelezen.regels) {
    const regelFouten: Melding[] = [];
    const fout = (kolom: Veld | undefined, bericht: string) =>
      regelFouten.push({ regel, kolom: kolom ? KOLOMMEN.find(k => k.veld === kolom)!.kop : undefined, bericht });

    const id = (waarden.id ?? '').trim();
    const velden: Record<BewerkbaarVeld, string | null> = {
      name: normaal('name', waarden.name),
      opdrachtgeverKenmerk: normaal('opdrachtgeverKenmerk', waarden.opdrachtgeverKenmerk),
      projectnummer: normaal('projectnummer', waarden.projectnummer),
      cardanKenmerk: normaal('cardanKenmerk', waarden.cardanKenmerk),
      contactnaam: normaal('contactnaam', waarden.contactnaam),
      contactEmail: normaal('contactEmail', waarden.contactEmail),
    };

    // Eerst het bestaande project opzoeken: een waarde die al zo in de tool staat,
    // keuren we niet af. Anders blokkeert een oude schrijfwijze elke import, ook
    // als niemand dat veld heeft aangeraakt.
    let huidig: ProjectStand | undefined;
    if (id) {
      if (!UUID_VORM.test(id)) {
        fout('id', `"${id}" is geen geldig Project-ID. Laat het Project-ID leeg voor een nieuw project, en wijzig het nooit bij een bestaand.`);
      } else if (gezienIds.has(id.toLowerCase())) {
        fout('id', `Dit Project-ID staat ook op regel ${gezienIds.get(id.toLowerCase())}. Elk project mag maar één keer in het bestand staan.`);
      } else {
        gezienIds.set(id.toLowerCase(), regel);
        huidig = projectOp.get(id.toLowerCase());
        if (!huidig) {
          fout('id', 'Er is geen project met dit Project-ID. Het is verwijderd, of het ID is gewijzigd. Laat het ID leeg als je een nieuw project bedoelt.');
        }
      }
      if (!huidig) {
        fouten.push(...regelFouten);
        continue;
      }
    }

    const oudVan = (veld: BewerkbaarVeld) => (huidig ? normaal(veld, huidig[veld]) : null);
    const gewijzigdVeld = (veld: BewerkbaarVeld) => !huidig || oudVan(veld) !== velden[veld];

    if (!velden.name) fout('name', 'De projectnaam is verplicht.');
    else if (velden.name.length > 255) fout('name', 'De projectnaam is langer dan 255 tekens.');

    let opdrachtgever: OpdrachtgeverStand | undefined;
    if (!velden.opdrachtgeverKenmerk) {
      fout('opdrachtgeverKenmerk', 'De opdrachtgever is verplicht. Vul het kenmerk in, zie het blad Opdrachtgevers.');
    } else {
      opdrachtgever = ogOp.get(velden.opdrachtgeverKenmerk);
      if (!opdrachtgever) {
        fout(
          'opdrachtgeverKenmerk',
          `Er is geen opdrachtgever met kenmerk "${velden.opdrachtgeverKenmerk}". Maak die eerst aan in de tool, of kies een kenmerk uit het blad Opdrachtgevers.`
        );
      }
    }

    const vormen: { veld: BewerkbaarVeld; geldig: (w: string) => boolean; bericht: (w: string) => string }[] = [
      {
        veld: 'projectnummer',
        geldig: w => CRM_VORM.test(w),
        bericht: w => `"${w}" is geen geldig CRM-nummer. Verwacht: P en vijf cijfers, bijvoorbeeld P02645.`,
      },
      {
        veld: 'cardanKenmerk',
        geldig: w => CARDAN_VORM.test(w),
        bericht: w => `"${w}" is geen geldig Cardan-kenmerk. Verwacht: C- en vier cijfers, bijvoorbeeld C-4521.`,
      },
      { veld: 'contactEmail', geldig: w => EMAIL_VORM.test(w), bericht: w => `"${w}" is geen geldig e-mailadres.` },
    ];
    for (const { veld, geldig, bericht } of vormen) {
      const w = velden[veld];
      if (!w || geldig(w)) continue;
      if (gewijzigdVeld(veld)) fout(veld, bericht(w));
      else
        waarschuwingen.push({
          regel,
          kolom: VELDNAAM[veld],
          bericht: `${bericht(w)} Zo staat het al in de tool; de import laat het ongemoeid.`,
        });
    }

    if (velden.projectnummer && gewijzigdVeld('projectnummer')) {
      const ander = crmBij.get(velden.projectnummer);
      if (ander) {
        waarschuwingen.push({
          regel,
          kolom: 'CRM-nummer',
          bericht: `Het CRM-nummer ${velden.projectnummer} staat ook bij "${ander}". Klopt het dat die twee bij hetzelfde Dynamics-project horen?`,
        });
      } else crmBij.set(velden.projectnummer, velden.name ?? '');
    }

    if (!huidig) {
      // Nieuw project.
      if (regelFouten.length === 0 && opdrachtgever && velden.name) {
        const naam = velden.name;
        const og = opdrachtgever;
        const dubbel = projecten.find(
          p => p.name.trim().toLowerCase() === naam.toLowerCase() && p.opdrachtgeverKenmerk.toUpperCase() === og.kenmerk.toUpperCase()
        );
        if (dubbel) {
          waarschuwingen.push({
            regel,
            bericht: `Er bestaat al een project "${dubbel.name}" bij ${og.kenmerk}. Deze regel heeft geen Project-ID en wordt dus een tweede project. Bedoel je het bestaande, pas dan die regel aan.`,
          });
        }
        nieuw.push({
          regel,
          name: naam,
          opdrachtgeverId: og.id,
          opdrachtgeverKenmerk: og.kenmerk,
          projectnummer: velden.projectnummer,
          cardanKenmerk: velden.cardanKenmerk,
          contactnaam: velden.contactnaam,
          contactEmail: velden.contactEmail,
        });
      }
      fouten.push(...regelFouten);
      continue;
    }

    // Bestaand project.
    const exportMoment = leesMoment(updatedAtRuw);
    if (!exportMoment) {
      fout(
        'updatedAt',
        'De kolom "Laatst gewijzigd in tool" is leeg of gewijzigd. Daarmee kan niet worden gecontroleerd of het project na de export is aangepast; maak een nieuwe export.'
      );
    }

    const wijzigingen: Wijziging[] = [];
    const data: GewijzigdProject['data'] = {};
    for (const veld of BEWERKBARE_VELDEN) {
      if (!gewijzigdVeld(veld)) continue;
      const oud = oudVan(veld);
      const nieuwWaarde = velden[veld];
      wijzigingen.push({ veld, label: VELDNAAM[veld], oud, nieuw: nieuwWaarde });
      if (veld === 'opdrachtgeverKenmerk') {
        if (opdrachtgever) data.opdrachtgeverId = opdrachtgever.id;
      } else if (veld === 'name') {
        if (nieuwWaarde) data.name = nieuwWaarde;
      } else {
        data[veld] = nieuwWaarde;
      }
      if (nieuwWaarde === null && oud !== null && veld !== 'name' && veld !== 'opdrachtgeverKenmerk') {
        waarschuwingen.push({
          regel,
          kolom: VELDNAAM[veld],
          bericht: `${VELDNAAM[veld]} van "${huidig.name}" wordt leeggemaakt (was "${oud}").`,
        });
      }
    }

    if (wijzigingen.length > 0 && exportMoment && huidig.updatedAt.getTime() > exportMoment.getTime()) {
      fout(
        undefined,
        `"${huidig.name}" is na de export in de tool gewijzigd. De import zou die wijziging overschrijven. Maak een nieuwe export en breng je aanpassingen daarin aan.`
      );
    }

    fouten.push(...regelFouten);
    if (regelFouten.length) continue;

    if (wijzigingen.length === 0) ongewijzigd.push({ regel, id: huidig.id, name: huidig.name });
    else gewijzigd.push({ regel, id: huidig.id, name: huidig.name, wijzigingen, data });
  }

  const nietInBestand = projecten
    .filter(p => !gezienIds.has(p.id.toLowerCase()))
    .map(p => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'));

  if (gelezen.regels.length === 0) {
    fouten.push({ bericht: `Het blad "${BLAD_PROJECTEN}" bevat geen projecten.` });
  }

  return {
    nieuw,
    gewijzigd,
    ongewijzigd,
    nietInBestand,
    fouten,
    waarschuwingen,
    vingerafdruk: vingerafdruk(nieuw, gewijzigd),
  };
}

/**
 * Wat er toegepast wordt, als korte hash. De gebruiker bevestigt een overzicht;
 * bij toepassen rekent de server het overzicht opnieuw uit, en klopt deze niet
 * meer (ander bestand, of de database is intussen veranderd), dan gebeurt er niets.
 */
export function vingerafdruk(nieuw: NieuwProject[], gewijzigd: GewijzigdProject[]) {
  const inhoud = JSON.stringify({
    nieuw: nieuw.map(n => [n.regel, n.name, n.opdrachtgeverId, n.projectnummer, n.cardanKenmerk, n.contactnaam, n.contactEmail]),
    gewijzigd: gewijzigd.map(g => [g.regel, g.id, Object.entries(g.data).sort()]),
  });
  return createHash('sha256').update(inhoud).digest('hex').slice(0, 32);
}
