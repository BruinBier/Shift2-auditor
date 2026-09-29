/**
 * De schrijfgids van Frits: lezen, een regel vinden, een wijziging toepassen en terugdraaien.
 *
 * De gids is een bestand (`writing/FRITS-WRITING-GUIDE.md`) en geen tabel. De agents lezen
 * hem rechtstreeks als huisregels, en Frits bewerkt hem met de hand; een kopie in de database
 * zou een tweede waarheid worden. Zie `writing/FRITS-WRITING-WORKFLOW.md`.
 *
 * Een regel begint met `<!-- regel: R07 -->` en loopt tot de volgende id of het volgende
 * kopje. Alleen via die id kan een wijziging precies één regel raken.
 *
 * WAT HIER NIET GEBEURT: bepalen óf de gids verandert. Dat beslist Frits in het scherm; deze
 * module voert alleen uit wat hij heeft bevestigd, en weigert als de regel intussen anders is
 * gaan luiden dan de wijziging verwacht. Een stille overschrijving van een handmatige
 * aanpassing is precies het soort verlies dat de geschiedenis moet voorkomen.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const GIDS_PAD = path.join(process.cwd(), 'writing', 'FRITS-WRITING-GUIDE.md');
export const WORKFLOW_PAD = path.join(process.cwd(), 'writing', 'FRITS-WRITING-WORKFLOW.md');
export const GESCHIEDENIS_PAD = path.join(process.cwd(), 'writing', 'guide-history.jsonl');

const ANKER = /^<!-- regel: (R\d+) -->$/;
const KOP = /^(#{1,6}) (.+)$/;

export interface Regel {
  id: string;
  /** Het kopje waaronder de regel staat (het dichtstbijzijnde, van welk niveau ook). */
  sectie: string;
  /** De tekst van de regel, zonder id en zonder witregels aan het eind. */
  tekst: string;
}

interface Blok extends Regel {
  /** Regelnummer (0-based) van het anker. */
  anker: number;
  /** Eerste regelnummer ná het blok. */
  eind: number;
  /** Aantal witregels aan het eind van het blok, zodat een vervanging de opmaak houdt. */
  staart: number;
}

export interface Wijziging {
  id: string;
  tijdstip: string;
  soort: 'nieuw' | 'aanpassen' | 'samenvoegen' | 'terugdraaien';
  /** De regels zoals ze waren. Leeg bij een nieuwe regel. */
  oud: { id: string; tekst: string }[];
  /** De regel zoals hij werd. Leeg (null) als een terugdraaiing een nieuwe regel weghaalde. */
  nieuw: { id: string; tekst: string } | null;
  /** Bij een nieuwe regel: onder welk kopje hij kwam. */
  sectie?: string;
  reden: string;
  criterium?: string | null;
  correctieId?: string | null;
  /** Bij een terugdraaiing: welke wijziging werd teruggedraaid. */
  terugdraaiingVan?: string;
}

export class GidsConflict extends Error {}

function leesRegels(): string[] {
  return fs.readFileSync(GIDS_PAD, 'utf8').replace(/\r\n/g, '\n').split('\n');
}

function schrijfRegels(regels: string[]) {
  fs.writeFileSync(GIDS_PAD, regels.join('\n'), 'utf8');
}

function blokken(regels: string[]): Blok[] {
  const uit: Blok[] = [];
  let sectie = '';
  let open: { id: string; anker: number; sectie: string } | null = null;

  const sluit = (eind: number) => {
    if (!open) return;
    let laatste = eind;
    while (laatste > open.anker + 1 && regels[laatste - 1].trim() === '') laatste--;
    uit.push({
      id: open.id,
      sectie: open.sectie,
      tekst: regels.slice(open.anker + 1, laatste).join('\n'),
      anker: open.anker,
      eind,
      staart: eind - laatste,
    });
    open = null;
  };

  regels.forEach((r, i) => {
    const anker = r.match(ANKER);
    const kop = r.match(KOP);
    if (anker) {
      sluit(i);
      open = { id: anker[1], anker: i, sectie };
    } else if (kop) {
      sluit(i);
      sectie = kop[2].trim();
    }
  });
  sluit(regels.length);
  return uit;
}

export function leesGids(): { tekst: string; regels: Regel[]; secties: string[] } {
  const regels = leesRegels();
  const secties = regels.map((r) => r.match(KOP)?.[2].trim()).filter((s): s is string => !!s);
  return {
    tekst: regels.join('\n'),
    regels: blokken(regels).map(({ id, sectie, tekst }) => ({ id, sectie, tekst })),
    secties,
  };
}

export function leesWorkflow(): string {
  return fs.readFileSync(WORKFLOW_PAD, 'utf8');
}

function volgendeId(bestaand: Blok[]): string {
  const hoogste = bestaand.reduce((m, b) => Math.max(m, parseInt(b.id.slice(1), 10)), 0);
  return `R${String(hoogste + 1).padStart(2, '0')}`;
}

const gelijk = (a: string, b: string) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();

function vind(bl: Blok[], id: string): Blok {
  const b = bl.find((x) => x.id === id);
  if (!b) throw new GidsConflict(`Regel ${id} staat niet (meer) in de gids.`);
  return b;
}

/** Vervangt de regels [van, tot) door `nieuw`. */
function splice(regels: string[], van: number, tot: number, nieuw: string[]) {
  regels.splice(van, tot - van, ...nieuw);
}

function blokTekst(id: string, tekst: string, staart: number): string[] {
  return [`<!-- regel: ${id} -->`, ...tekst.split('\n'), ...Array(staart).fill('')];
}

export function leesGeschiedenis(): Wijziging[] {
  if (!fs.existsSync(GESCHIEDENIS_PAD)) return [];
  return fs
    .readFileSync(GESCHIEDENIS_PAD, 'utf8')
    .split('\n')
    .filter((r) => r.trim())
    .map((r) => JSON.parse(r) as Wijziging);
}

function noteer(w: Omit<Wijziging, 'id' | 'tijdstip'>): Wijziging {
  const volledig: Wijziging = { id: randomUUID(), tijdstip: new Date().toISOString(), ...w };
  fs.appendFileSync(GESCHIEDENIS_PAD, JSON.stringify(volledig) + '\n', 'utf8');
  return volledig;
}

interface Herkomst {
  reden: string;
  criterium?: string | null;
  correctieId?: string | null;
}

/** Een nieuwe regel, achteraan de sectie met dit kopje. */
export function voegRegelToe(sectie: string, tekst: string, herkomst: Herkomst): Wijziging {
  const regels = leesRegels();
  const bl = blokken(regels);
  const kopIndex = regels.findIndex((r) => r.match(KOP)?.[2].trim() === sectie);
  if (kopIndex < 0) throw new GidsConflict(`Het kopje "${sectie}" staat niet in de gids.`);

  // Einde van de sectie: het volgende kopje, of het eind van het bestand. Witregels ervóór
  // blijven onder de nieuwe regel staan, zodat het volgende kopje zijn afstand houdt.
  let eind = regels.findIndex((r, i) => i > kopIndex && KOP.test(r));
  if (eind < 0) eind = regels.length;
  let invoeg = eind;
  while (invoeg > kopIndex + 1 && regels[invoeg - 1].trim() === '') invoeg--;

  const id = volgendeId(bl);
  // In een opsomming sluit een nieuw punt direct aan; na een alinea komt er een witregel tussen.
  const vorige = regels[invoeg - 1] ?? '';
  const inLijst = /^\s*[-*]\s|^\s{2,}\S/.test(vorige) && tekst.trimStart().startsWith('-');
  const nieuw = [...(inLijst ? [] : ['']), `<!-- regel: ${id} -->`, ...tekst.trim().split('\n')];
  splice(regels, invoeg, invoeg, nieuw);
  schrijfRegels(regels);

  return noteer({ soort: 'nieuw', oud: [], nieuw: { id, tekst: tekst.trim() }, sectie, ...herkomst });
}

/**
 * Een bestaande regel aanpassen, of twee of meer regels samenvoegen tot één.
 *
 * `verwacht` is de tekst die Frits als OUDE REGEL te zien kreeg. Luidt de regel nu anders
 * (met de hand bijgewerkt sinds het voorstel), dan weigert dit: hij heeft die nieuwe tekst
 * niet gezien en dus niet goedgekeurd dat hij verdwijnt.
 */
export function pasRegelsAan(
  ids: string[],
  verwacht: Record<string, string>,
  nieuweTekst: string,
  herkomst: Herkomst
): Wijziging {
  if (ids.length === 0) throw new GidsConflict('Geen regel opgegeven.');
  const regels = leesRegels();
  const bl = blokken(regels);
  const oud = ids.map((id) => {
    const b = vind(bl, id);
    if (verwacht[id] !== undefined && !gelijk(verwacht[id], b.tekst)) {
      throw new GidsConflict(
        `Regel ${id} is aangepast sinds dit voorstel werd gemaakt. Laat de correctie opnieuw analyseren.`
      );
    }
    return b;
  });

  // Van achter naar voren, anders verschuiven de regelnummers onder je handen.
  const [eerste, ...rest] = oud;
  for (const b of [...rest].sort((a, c) => c.anker - a.anker)) splice(regels, b.anker, b.eind, []);
  const doel = blokken(regels).find((b) => b.id === eerste.id)!;
  splice(regels, doel.anker, doel.eind, blokTekst(eerste.id, nieuweTekst.trim(), doel.staart));
  schrijfRegels(regels);

  return noteer({
    soort: ids.length > 1 ? 'samenvoegen' : 'aanpassen',
    oud: oud.map((b) => ({ id: b.id, tekst: b.tekst })),
    nieuw: { id: eerste.id, tekst: nieuweTekst.trim() },
    ...herkomst,
  });
}

/**
 * Een wijziging ongedaan maken. Kan alleen zolang de regel nog precies zo luidt als die
 * wijziging hem achterliet; anders zou het terugdraaien een latere aanpassing wissen.
 */
export function draaiTerug(wijzigingId: string): Wijziging {
  const w = leesGeschiedenis().find((x) => x.id === wijzigingId);
  if (!w) throw new GidsConflict('Die wijziging staat niet in de geschiedenis.');
  if (w.soort === 'terugdraaien') throw new GidsConflict('Een terugdraaiing draai je niet terug; pas de regel opnieuw aan.');

  const regels = leesRegels();
  const bl = blokken(regels);
  if (!w.nieuw) throw new GidsConflict('Deze wijziging liet geen regel achter.');
  const huidig = vind(bl, w.nieuw.id);
  if (!gelijk(huidig.tekst, w.nieuw.tekst)) {
    throw new GidsConflict(
      `Regel ${w.nieuw.id} is na deze wijziging nog eens aangepast. Draai eerst de latere wijziging terug, of pas de regel met de hand aan.`
    );
  }

  if (w.oud.length === 0) {
    // Een nieuwe regel: weghalen. De witregels erna blijven staan; stond er ook een vóór
    // (ingevoegd na een alinea), dan gaat er één weg zodat er geen dubbele overblijft.
    const van = huidig.anker;
    splice(regels, van, huidig.eind - huidig.staart, []);
    if (van > 0 && regels[van - 1].trim() === '' && (regels[van] ?? '').trim() === '') {
      splice(regels, van - 1, van, []);
    }
  } else {
    const [eerste, ...rest] = w.oud;
    const terug = [
      ...blokTekst(eerste.id, eerste.tekst, rest.length ? 0 : huidig.staart),
      ...rest.flatMap((o, i) => blokTekst(o.id, o.tekst, i === rest.length - 1 ? huidig.staart : 0)),
    ];
    splice(regels, huidig.anker, huidig.eind, terug);
  }
  schrijfRegels(regels);

  return noteer({
    soort: 'terugdraaien',
    oud: [{ id: w.nieuw.id, tekst: w.nieuw.tekst }],
    nieuw: w.oud.length ? { id: w.oud[0].id, tekst: w.oud.map((o) => o.tekst).join('\n\n') } : null,
    reden: `Teruggedraaid: ${w.reden}`,
    criterium: w.criterium,
    correctieId: w.correctieId,
    terugdraaiingVan: w.id,
  });
}
