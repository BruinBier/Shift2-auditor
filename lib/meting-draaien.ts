import { spawn } from 'child_process';
import { meetopdracht } from './metingen';

/**
 * Eén meting van de audit-CLI draaien, vanuit de webapp.
 *
 * DE COMMANDOTEKST VAN DE KAART WORDT NIET UITGEVOERD. Op de kaart staat een leesbare
 * regel, maar die is er om te tonen en te kopiëren. Zou deze code die tekst naar een shell
 * sturen, dan kan iedereen die iets in de database krijgt code op deze machine draaien. Er
 * komt hier een commandonaam plus losse argumenten binnen, die tegen de lijst in
 * `lib/metingen.ts` worden gehouden en als aparte procesargumenten worden doorgegeven —
 * nooit als één tekstregel.
 *
 * Twee routes gebruiken dit: de knop "Nog eens meten" bij een bestaande meting, en de knop
 * die een meting voor het eerst start. Dat is dezelfde handeling met een ander vervolg, en
 * dus dezelfde poort — één plek waar staat wat er mag draaien.
 */

export type MetingUitkomst =
  | { ok: true; antwoord: any; ruw: string }
  | { ok: false; error: string; details?: string };

/**
 * Een vlagwaarde mag geen procesargument-grens kunnen oversteken. Puppeteer-selectors en
 * zoektermen bevatten legitiem spaties, aanhalingstekens en haakjes, dus filteren op
 * tekens is te grof; wat niet mag is een nieuwe regel of een null-byte.
 */
function schoon(waarde: string): boolean {
  return waarde.length <= 300 && !/[\n\r\0]/.test(waarde);
}

export async function draaiMeting(
  commando: string,
  url: string,
  argumenten: Record<string, string> = {}
): Promise<MetingUitkomst> {
  const opdracht = meetopdracht(commando);
  if (!opdracht) return { ok: false, error: `Onbekend commando: ${commando}` };

  let doel: URL;
  try {
    doel = new URL(url);
  } catch {
    return { ok: false, error: `Ongeldig adres: ${url}` };
  }
  if (doel.protocol !== 'http:' && doel.protocol !== 'https:') {
    return { ok: false, error: 'Alleen http en https' };
  }

  const args = ['scripts/audit-cli.ts', commando, doel.toString()];
  for (const [naam, waarde] of Object.entries(argumenten)) {
    if (!opdracht.toegestaneVlaggen.includes(naam)) {
      return { ok: false, error: `Vlag --${naam} hoort niet bij ${commando}` };
    }
    const tekst = String(waarde);
    if (!schoon(tekst)) return { ok: false, error: `Ongeldige waarde bij --${naam}` };
    args.push(`--${naam}=${tekst}`);
  }

  const uitkomst = await new Promise<{ ok: boolean; stdout: string; stderr: string }>(
    (resolve) => {
      // tsx via npx, met de argumenten als losse lijst. shell: false is hier het punt: zo
      // kan geen enkele waarde als shell-syntaxis worden gelezen. Op Windows kan npx niet
      // zonder shell gestart worden; de argumenten blijven ook daar losse waarden.
      const kind = spawn('npx', ['tsx', ...args], {
        cwd: process.cwd(),
        shell: process.platform === 'win32',
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      kind.stdout.on('data', (d) => (stdout += d.toString()));
      kind.stderr.on('data', (d) => (stderr += d.toString()));
      // Ruim, want niet elke meting is een momentopname: get-nietteksten loopt elk
      // bedienbaar element van de pagina af en doet er op een volle homepage minuten over.
      // Te krap afbreken levert een half onderzoek op dat er als een storing uitziet.
      const afbreken = setTimeout(() => kind.kill(), 300000);
      kind.on('close', (code) => {
        clearTimeout(afbreken);
        resolve({ ok: code === 0, stdout, stderr });
      });
      kind.on('error', (err) => {
        clearTimeout(afbreken);
        resolve({ ok: false, stdout, stderr: String(err) });
      });
    }
  );

  if (!uitkomst.ok) {
    return {
      ok: false,
      error: 'De meting liep niet goed af',
      details: uitkomst.stderr.slice(0, 800),
    };
  }

  try {
    // De BOM eraf: die zet JSON.parse anders meteen op een fout.
    return { ok: true, antwoord: JSON.parse(uitkomst.stdout.replace(/^﻿/, '')), ruw: uitkomst.stdout };
  } catch {
    return {
      ok: false,
      error: 'Kon het antwoord van de meting niet lezen',
      details: uitkomst.stdout.slice(0, 800),
    };
  }
}
