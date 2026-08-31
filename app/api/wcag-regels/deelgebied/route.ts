/**
 * Een deelgebied toevoegen aan de regels van een criterium.
 *
 * De onderzoeker merkt bij het nakijken dat er een gebied ontbreekt — "we kijken nooit naar
 * de posters in de nieuwsberichten" — en dat is een REGEL, geen aantekening bij dit ene
 * oordeel. Vanaf nu moet elke agent dat gebied aflopen, op elke pagina en in elk project;
 * anders staat hetzelfde gat er over drie maanden weer.
 *
 * Daarom schrijft dit naar `wcag-regels/Shift2_Regels_SC_<code>.md` en niet naar de database.
 * De kaart leest dat bestand rechtstreeks (zie lib/criterium-kaarttekst.ts), en de agent
 * krijgt het als huisregels mee. Een kopie in de database zou een tweede waarheid maken die
 * uit de pas gaat lopen — precies de tussenstap die daar bewust niet is.
 *
 * WAT DEZE ROUTE NIET DOET: bestaande oordelen aanraken. Een nieuw gebied betekent dat er bij
 * elk oordeel voortaan één ring open staat, en dat is de bedoeling: er is iets dat nog niet
 * is nagelopen. Het akkoord blijft staan — dat gold voor de tekst die er lag.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { bekendeGebieden } from '@/lib/deelgebieden';

export const dynamic = 'force-dynamic';

/** Waar het regelbestand van een criterium staat. Zelfde afleiding als in criterium-kaarttekst.ts. */
function bestandVoor(code: string): string {
  return path.join(process.cwd(), 'wcag-regels', `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`);
}

export async function POST(request: NextRequest) {
  // Een route die een bestand in de repo aanpast hoort niet op een productieserver te
  // bestaan. Zelfde slot als /api/meting/uitvoeren.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'De regels aanpassen kan alleen vanaf de lokale dev-server.' },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ongeldige body' }, { status: 400 });
  }

  const code: string = String(body?.criterionCode ?? '').trim();
  const gebied: string = String(body?.gebied ?? '').trim();

  if (!/^\d+\.\d+\.\d+$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Geef een criteriumcode als 1.1.1' }, { status: 400 });
  }
  if (!gebied) {
    return NextResponse.json({ ok: false, error: 'Geef een naam voor het gebied' }, { status: 400 });
  }
  /**
   * Eén regel, geen opmaak.
   *
   * De naam wordt straks woordelijk vergeleken bij het wegschrijven van een uitkomst. Een
   * regelafbreking of een nummer ervoor maakt hem onvindbaar, en dan lijkt werk dat gedaan is
   * "nog niet nagelopen".
   */
  if (/[\r\n]/.test(gebied)) {
    return NextResponse.json({ ok: false, error: 'Een gebied is één regel zonder regelafbrekingen' }, { status: 400 });
  }
  if (/^\s*\d+[.)]\s/.test(gebied)) {
    return NextResponse.json(
      { ok: false, error: 'Laat het nummer weg; de lijst nummert zichzelf' },
      { status: 400 }
    );
  }
  if (gebied.length > 120) {
    return NextResponse.json({ ok: false, error: 'Houd het onder de 120 tekens' }, { status: 400 });
  }

  const pad = bestandVoor(code);
  if (!fs.existsSync(pad)) {
    return NextResponse.json(
      { ok: false, error: `Er is nog geen regelbestand voor ${code}. Maak eerst Shift2_Regels_SC_${code.replace(/\./g, '_')}.md aan.` },
      { status: 400 }
    );
  }

  const bestaand = bekendeGebieden(code);
  // Hoofdletterongevoelig, want "Logo's" en "logo's" zijn hetzelfde gebied met twee namen —
  // en twee namen voor één gebied betekent dat de helft van de uitkomsten nergens landt.
  if (bestaand.some((g) => g.toLowerCase() === gebied.toLowerCase())) {
    return NextResponse.json(
      { ok: false, error: `"${gebied}" staat al in de lijst van ${code}` },
      { status: 400 }
    );
  }

  const tekst = fs.readFileSync(pad, 'utf8');
  const regels = tekst.split('\n');

  /**
   * De kop `### Deelgebieden` opzoeken, of hem aanmaken.
   *
   * Bestaat hij nog niet, dan komt hij vóór `### Zo is het vastgesteld` te staan — dezelfde
   * volgorde als bij de criteria die de lijst wél hebben. Ontbreekt ook die kop, dan gaat het
   * blok aan het eind van het `## Op de kaart`-blok; alleen daar leest de kaart het.
   */
  const kopIndex = regels.findIndex((r) => r.trim() === '### Deelgebieden');

  if (kopIndex >= 0) {
    // Het einde van de lijst: tot de volgende kop van hetzelfde of hoger niveau.
    let eind = kopIndex + 1;
    while (eind < regels.length && !/^#{1,3}\s/.test(regels[eind])) eind++;
    // Achterwaarts door de lege regels heen, zodat de nieuwe regel direct onder de laatste
    // komt en niet na een witregel.
    let laatste = eind - 1;
    while (laatste > kopIndex && !regels[laatste].trim()) laatste--;
    regels.splice(laatste + 1, 0, `${bestaand.length + 1}. ${gebied}`);
  } else {
    const nieuweSectie = ['', '### Deelgebieden', '', `1. ${gebied}`];
    const vastgesteld = regels.findIndex((r) => r.trim() === '### Zo is het vastgesteld');
    if (vastgesteld >= 0) {
      regels.splice(vastgesteld, 0, ...nieuweSectie, '');
    } else {
      const opDeKaart = regels.findIndex((r) => r.trim() === '## Op de kaart');
      if (opDeKaart < 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `${code} heeft geen "## Op de kaart"-blok; deelgebieden worden daar alleen gelezen. Voeg dat blok eerst toe.`,
          },
          { status: 400 }
        );
      }
      let eind = opDeKaart + 1;
      while (eind < regels.length && !/^##\s/.test(regels[eind])) eind++;
      regels.splice(eind, 0, ...nieuweSectie, '');
    }
  }

  fs.writeFileSync(pad, regels.join('\n'), 'utf8');

  // Teruglezen uit het bestand, niet uit onze eigen berekening: dan zie je meteen of de
  // schrijfactie is aangekomen zoals bedoeld, en of de naam er woordelijk in staat.
  const na = bekendeGebieden(code);
  if (!na.some((g) => g === gebied)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Het gebied is weggeschreven maar wordt niet teruggelezen. Kijk in het regelbestand.',
        gebieden: na,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    criterionCode: code,
    gebied,
    gebieden: na,
    bestand: `wcag-regels/Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`,
  });
}
