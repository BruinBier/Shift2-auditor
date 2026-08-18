import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectInstalledBrowsers, buildUserAgentsHtml } from '@/lib/browser-versions';
import type { BrowserName } from '@/lib/browser-versions';

/**
 * De user agents zoals ze nu zijn: uitgelezen van de machine waarop de app draait.
 *
 * Er stonden drie kopieën van deze lijst in de database — `default_user_agents`,
 * `default_user_agents_formulieren` en een kopie op elk project — en ze liepen alle drie
 * uiteen. In het rapport stond Chrome 148 terwijl er met 151 werd getest, en PAC 2014
 * terwijl er met PAC 2024 wordt gewerkt. Een lijst die met de hand wordt bijgehouden
 * veroudert stil: niemand ziet dat er een verkeerd versienummer in een rapport staat.
 *
 * `lib/browser-versions.ts` leest de geïnstalleerde browsers uit. Deze route maakt dat
 * beschikbaar voor het scherm, zodat daar niet opnieuw een kopie ontstaat.
 *
 * De opgeslagen standaard blijft als terugval bestaan: draait de app op een machine
 * zonder die browsers, dan is een verouderde lijst nog altijd beter dan een lege.
 */
export async function GET() {
  try {
    const browsers = await detectInstalledBrowsers();
    const gedetecteerd = buildUserAgentsHtml(browsers);

    // Welke browser hoorde erbij maar staat er niet op?
    //
    // De detectie laat een browser die hij niet vindt gewoon weg. Op deze machine staat
    // Firefox niet geïnstalleerd, en dan verdwijnt die regel uit het rapport zonder dat
    // iemand het merkt -- terwijl het rapport wel beweert waarmee er is getest. Melden
    // dus, zodat de onderzoeker kan beslissen of hij Firefox alsnog installeert of de
    // regel bewust weglaat.
    const verwacht: BrowserName[] = ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge'];
    const nietGevonden = verwacht.filter((naam) => !browsers.some((b) => b.name === naam));

    if (gedetecteerd) {
      return NextResponse.json({ html: gedetecteerd, bron: 'gedetecteerd', nietGevonden });
    }

    const opgeslagen = await prisma.settings.findUnique({
      where: { key: 'default_user_agents' },
    });
    if (opgeslagen?.value) {
      return NextResponse.json({ html: opgeslagen.value, bron: 'opgeslagen standaard' });
    }

    return NextResponse.json({ html: null, bron: 'niets gevonden' });
  } catch (error) {
    console.error('Fout bij het bepalen van de user agents:', error);
    return NextResponse.json({ error: 'Bepalen mislukt' }, { status: 500 });
  }
}
