import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { leesLogboek } from '@/scripts/lib/audit-log';

/**
 * Een vastgelegde meting nog eens draaien, en de uitkomst naast de oude zetten.
 *
 * Dit is niet alleen een controle op de auditor. Bij een herinspectie is het het
 * eigenlijke werk: je wilt niet weten of er goed gemeten is, je wilt weten of de site
 * is veranderd. Dezelfde knop antwoordt op beide vragen — verschilt de uitkomst, dan
 * is óf de pagina aangepast óf de meting was fout, en beide wil je weten.
 *
 * DE COMMANDOTEKST WORDT NIET UITGEVOERD. Op de kaart staat een leesbaar commando,
 * maar dat is er om te tonen en te kopiëren. Zou deze route die tekst naar een shell
 * sturen, dan kan iedereen die iets in de database krijgt code op deze machine
 * draaien. In plaats daarvan komt hier een commandonaam plus losse argumenten binnen,
 * die tegen een vaste lijst worden gehouden en als aparte procesargumenten worden
 * doorgegeven — nooit als één tekstregel.
 */

/** Wat er gedraaid mag worden, en welke vlaggen elk commando mag ontvangen. */
const TOEGESTAAN: Record<string, { vlaggen: string[] }> = {
  'get-reflow': { vlaggen: ['breedte', 'hoogte'] },
  'get-contrast': { vlaggen: ['selector', 'klik'] },
  'get-pixelcontrast': { vlaggen: ['selector', 'breedte', 'marge'] },
  'get-leesvolgorde': { vlaggen: ['zonder-css'] },
  'get-screenshot': { vlaggen: ['full-page', 'selector', 'breedte', 'klik', 'keep-cookie-banner'] },
  'get-html': { vlaggen: ['text', 'full'] },
};

/**
 * Een vlagwaarde mag geen procesargument-grens kunnen oversteken. Puppeteer-selectors
 * en zoektermen bevatten legitiem spaties, quotes en haakjes, dus filteren op tekens
 * is te grof; wat niet mag is een nieuwe regel of een null-byte.
 */
function schoon(waarde: string): boolean {
  return waarde.length <= 300 && !/[\n\r\0]/.test(waarde);
}

export const dynamic = 'force-dynamic';

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

  const toegestaan = TOEGESTAAN[commando];
  if (!toegestaan) {
    return NextResponse.json(
      { ok: false, error: `Onbekend commando: ${commando}` },
      { status: 400 }
    );
  }

  let doel: URL;
  try {
    doel = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, error: `Ongeldig adres: ${url}` }, { status: 400 });
  }
  if (doel.protocol !== 'http:' && doel.protocol !== 'https:') {
    return NextResponse.json(
      { ok: false, error: 'Alleen http en https' },
      { status: 400 }
    );
  }

  const args = ['scripts/audit-cli.ts', commando, doel.toString()];
  for (const [naam, waarde] of Object.entries(argumenten)) {
    if (!toegestaan.vlaggen.includes(naam)) {
      return NextResponse.json(
        { ok: false, error: `Vlag --${naam} hoort niet bij ${commando}` },
        { status: 400 }
      );
    }
    const tekst = String(waarde);
    if (!schoon(tekst)) {
      return NextResponse.json(
        { ok: false, error: `Ongeldige waarde bij --${naam}` },
        { status: 400 }
      );
    }
    args.push(`--${naam}=${tekst}`);
  }

  const uitkomst = await new Promise<{ ok: boolean; stdout: string; stderr: string }>(
    (resolve) => {
      // tsx via npx, met de argumenten als losse lijst. shell: false is hier het punt:
      // zo kan geen enkele waarde uit de body als shell-syntaxis worden gelezen.
      const kind = spawn('npx', ['tsx', ...args], {
        cwd: process.cwd(),
        shell: process.platform === 'win32',
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      kind.stdout.on('data', (d) => (stdout += d.toString()));
      kind.stderr.on('data', (d) => (stderr += d.toString()));
      const afbreken = setTimeout(() => kind.kill(), 120000);
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
    return NextResponse.json(
      { ok: false, error: 'De meting liep niet goed af', details: uitkomst.stderr.slice(0, 800) },
      { status: 500 }
    );
  }

  let antwoord: any = null;
  try {
    antwoord = JSON.parse(uitkomst.stdout.replace(/^﻿/, ''));
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Kon het antwoord van de meting niet lezen', ruw: uitkomst.stdout.slice(0, 800) },
      { status: 500 }
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
    url: doel.toString(),
    argumenten,
    logregel: laatste,
    uitkomst: antwoord,
  });
}
