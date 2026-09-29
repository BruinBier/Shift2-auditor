import { createHash } from 'node:crypto';
import { VRAGEN, isGeldigAntwoord, type VraagId, type Zekerheid } from './vragen';

/**
 * SemanticClassifier: de naad tussen de tool en wie de semantische vragen beantwoordt
 * (steekproefselectie v2, fase 4).
 *
 * De tool praat hier in een NEUTRAAL formaat: een opdracht (vraag + invoer) en een antwoord
 * (antwoord + zekerheid + korte reden). Niets hierin is Claude-specifiek. Claude is de
 * eerste aanbieder; later kan een andere (bijvoorbeeld Jev) exact dezelfde opdrachten
 * krijgen en dezelfde tabel vullen, met zijn eigen `aanbieder` en `model`.
 *
 * De cache-sleutel is onderwerp + contentHash + vraagId + vraagVersie (+ aanbieder).
 * De contentHash is de hash van PRECIES de invoer die de aanbieder te zien krijgt: verandert
 * de pagina, de afbeelding of de vraag, dan wordt het een nieuwe opdracht.
 *
 * De tool roept zelf geen model aan (geen API-sleutel, net als bij het schrijfstijlsysteem).
 * Voor Claude betekent dat: de opdrachten gaan als bestand naar een Claude Code-agent, en de
 * antwoorden komen als bestand terug (`BestandsAanbieder`).
 */

export const CLASSIFIER_FORMAAT_VERSIE = 1;

export interface Opdracht {
  /** Uniek per onderwerp + vraag + versie + contentHash. */
  sleutel: string;
  vraagId: VraagId;
  vraagVersie: number;
  onderwerp: string;
  onderwerpSoort: 'pagina' | 'document' | 'afbeelding' | 'pagina-in-cluster';
  vraag: string;
  antwoorden: readonly string[];
  uitleg: Record<string, string>;
  invoer: Record<string, unknown>;
  /** Voor een beeldvraag: het lokale bestand dat de aanbieder moet bekijken. */
  afbeeldingBestand?: string | null;
  contentHash: string;
}

export interface Antwoord {
  sleutel: string;
  antwoord: string;
  zekerheid: Zekerheid;
  /** Eén korte zin. */
  reden: string;
}

export interface SemanticClassifier {
  /** Bijvoorbeeld 'claude' of 'jev'. */
  aanbieder: string;
  /** Het model zoals de aanbieder het noemt, zo precies mogelijk. */
  model: string;
  beantwoord(opdrachten: Opdracht[]): Promise<Antwoord[]>;
}

/** Stabiele JSON: sleutels gesorteerd, zodat dezelfde invoer dezelfde hash geeft. */
export function stabieleJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stabieleJson).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as object)
      .sort()
      .filter((k) => (v as any)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stabieleJson((v as any)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

export function contentHash(invoer: Record<string, unknown>, extra = ''): string {
  return createHash('sha256').update(stabieleJson(invoer) + extra).digest('hex').slice(0, 20);
}

export function maakOpdracht(
  vraagId: VraagId,
  onderwerp: string,
  invoer: Record<string, unknown>,
  opties: { afbeeldingBestand?: string | null; afbeeldingHash?: string } = {},
): Opdracht {
  const v = VRAGEN[vraagId];
  const hash = contentHash(invoer, opties.afbeeldingHash || '');
  return {
    sleutel: createHash('sha1').update(`${onderwerp}|${vraagId}|${v.versie}|${hash}`).digest('hex').slice(0, 16),
    vraagId,
    vraagVersie: v.versie,
    onderwerp,
    onderwerpSoort: v.onderwerp,
    vraag: v.vraag,
    antwoorden: v.antwoorden,
    uitleg: v.uitleg,
    invoer,
    afbeeldingBestand: opties.afbeeldingBestand ?? null,
    contentHash: hash,
  };
}

export interface Controle {
  geldig: Antwoord[];
  ongeldig: { sleutel: string; fout: string }[];
}

/** Een antwoord dat niet in de gesloten lijst staat, wordt geweigerd, niet omgezet. */
export function controleerAntwoorden(opdrachten: Opdracht[], antwoorden: Antwoord[]): Controle {
  const perSleutel = new Map(opdrachten.map((o) => [o.sleutel, o]));
  const uit: Controle = { geldig: [], ongeldig: [] };
  for (const a of antwoorden) {
    const o = perSleutel.get(a.sleutel);
    if (!o) uit.ongeldig.push({ sleutel: a.sleutel, fout: 'onbekende sleutel' });
    else if (!isGeldigAntwoord(o.vraagId, a.antwoord)) uit.ongeldig.push({ sleutel: a.sleutel, fout: `antwoord "${a.antwoord}" staat niet in de lijst` });
    else if (!['hoog', 'middel', 'laag'].includes(a.zekerheid)) uit.ongeldig.push({ sleutel: a.sleutel, fout: `zekerheid "${a.zekerheid}"` });
    else uit.geldig.push({ ...a, reden: String(a.reden || '').slice(0, 300) });
  }
  return uit;
}

/**
 * Een aanbieder die zijn antwoorden uit een bestand leest. Zo werkt Claude hier: de
 * opdrachten gaan als bestand naar een Claude Code-agent, die de antwoorden als bestand
 * teruggeeft. Voor de tool is het verder een aanbieder als elke andere.
 */
export class BestandsAanbieder implements SemanticClassifier {
  constructor(
    public aanbieder: string,
    public model: string,
    private lees: () => Promise<Antwoord[]>,
  ) {}
  async beantwoord(opdrachten: Opdracht[]): Promise<Antwoord[]> {
    const alle = await this.lees();
    const gevraagd = new Set(opdrachten.map((o) => o.sleutel));
    return alle.filter((a) => gevraagd.has(a.sleutel));
  }
}
