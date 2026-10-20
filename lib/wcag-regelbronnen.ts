import { createHash } from 'crypto';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { GIDS_PAD } from '@/lib/schrijfstijl/gids';

export const WCAG_REGELS_MAP = path.join(process.cwd(), 'wcag-regels');
export const WCAG_CODE = /^\d{1}\.\d{1,2}\.\d{1,2}$/;

export interface WcagRegelbronnen {
  code: string;
  bestandsnaam: string;
  bronversie: string;
  regels: string | null;
  schrijfregels: string | null;
  scope: string | null;
  bewijsvoering: string | null;
  /** Bronpaden die niet konden worden gevonden. De overige bronnen blijven bruikbaar. */
  ontbrekendeBronnen: string[];
}

export function regelBestandsnaam(code: string): string {
  if (!WCAG_CODE.test(code)) throw new Error('Ongeldige criteriumcode');
  return `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`;
}

/**
 * Een ontbrekend bronbestand is een geldige, veilige toestand. Andere leesfouten zijn dat
 * niet: een rechtenfout als "bestaat niet" presenteren zou de auditor met onvolledige
 * context laten werken zonder dat iemand dat merkt.
 */
async function leesOptioneel(pad: string): Promise<string | null> {
  try {
    return await readFile(pad, 'utf8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function haalWcagRegelbronnen(code: string): Promise<WcagRegelbronnen> {
  const bestandsnaam = regelBestandsnaam(code);
  const bronpaden = {
    regels: path.join(WCAG_REGELS_MAP, bestandsnaam),
    schrijfregels: GIDS_PAD,
    scope: path.join(WCAG_REGELS_MAP, 'Shift2_Scope_Per_Sample.md'),
    bewijsvoering: path.join(WCAG_REGELS_MAP, 'Shift2_Bewijsvoering.md'),
  };

  const [regels, schrijfregels, scope, bewijsvoering] = await Promise.all([
    leesOptioneel(bronpaden.regels),
    leesOptioneel(bronpaden.schrijfregels),
    leesOptioneel(bronpaden.scope),
    leesOptioneel(bronpaden.bewijsvoering),
  ]);

  const ontbrekendeBronnen = [
    regels === null ? `wcag-regels/${bestandsnaam}` : null,
    schrijfregels === null ? 'writing/FRITS-WRITING-GUIDE.md' : null,
    scope === null ? 'wcag-regels/Shift2_Scope_Per_Sample.md' : null,
    bewijsvoering === null ? 'wcag-regels/Shift2_Bewijsvoering.md' : null,
  ].filter((bron): bron is string => bron !== null);

  // Dit is een afgeleide vingerafdruk, geen tweede versieregister. Zodra een van de
  // bronbestanden wijzigt, verandert de versie die met de concrete casus meegaat.
  const bronversie = createHash('sha256')
    .update(JSON.stringify({ bestandsnaam, regels, schrijfregels, scope, bewijsvoering }))
    .digest('hex')
    .slice(0, 12);

  return {
    code,
    bestandsnaam,
    bronversie,
    regels,
    schrijfregels,
    scope,
    bewijsvoering,
    ontbrekendeBronnen,
  };
}

/** De beschikbare contentcriteria worden uit de regelbestanden afgeleid, niet bijgehouden. */
export async function lijstCriteriumRegelCodes(): Promise<string[]> {
  const bestanden = await readdir(WCAG_REGELS_MAP);
  return bestanden
    .map((bestand) => bestand.match(/^Shift2_Regels_SC_(\d+)_(\d+)_(\d+)\.md$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => `${match[1]}.${match[2]}.${match[3]}`)
    .sort((a, b) =>
      a.localeCompare(b, 'nl', { numeric: true, sensitivity: 'base' })
    );
}
