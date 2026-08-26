/**
 * Een browser die in het scherm van Shift2 zelf te zien is, naast de kaart.
 *
 * Waarom niet gewoon een `<iframe>` om de site: dat verbieden gemeentesites zelf. heuvelrug.nl
 * stuurt `Content-Security-Policy: frame-ancestors 'self' https://*.polly.help`, en daarmee mag
 * `localhost:3000` die pagina niet in een kader zetten. Dat is geen instelling die wij kunnen
 * omzeilen; het is de site die het tegenhoudt.
 *
 * Wat wél mag is beeld doorgeven. Deze module houdt een eigen browser open, laat Chrome de
 * beelden van die pagina doorsturen (`Page.startScreencast`) en stuurt muis- en toetsaanslagen
 * de andere kant op. Voor de site is het een gewone bezoeker; voor de onderzoeker is het een
 * browser in zijn eigen scherm, waarin hij kan klikken, tabben en menu's openen.
 *
 * WAAROM EEN EIGEN BROWSER EN NIET DE AUDITSESSIE. Chrome tekent alleen voor de tab die vóór
 * staat en zichtbaar is. Een tab op de achtergrond levert geen enkel beeld op — de proef op een
 * draaiende auditsessie liep daarop vast. Een eigen browser heeft dat probleem niet.
 *
 * Wat je daarmee inlevert: cookies, inloggegevens en wat er in de auditsessie is aangeklikt.
 * Voor een openbare pagina maakt dat niets uit; achter een login heb je de auditsessie nodig en
 * is dit paneel niet het aangewezen middel. Zie `Shift2_Bewijsvoering.md` over het verschil.
 *
 * Alleen lokaal. Dit start processen en houdt ze open; op een server hoort dat niet te bestaan.
 */

import puppeteer from 'puppeteer';

export const SCHERM_BREEDTE = 1280;
export const SCHERM_HOOGTE = 800;

/** Hoe lang een sessie zonder gebruik open blijft staan voordat hij zichzelf opruimt. */
const VERVALT_NA_MS = 5 * 60 * 1000;

interface Sessie {
  browser: any;
  page: any;
  cdp: any;
  /** De laatst ontvangen beeldjes, base64-jpeg. Alleen de nieuwste telt. */
  laatsteBeeld: string | null;
  /** Wie er meeleest. Zodra de laatste weg is, loopt de vervaltijd. */
  luisteraars: Set<(beeld: string) => void>;
  laatstGebruikt: number;
  url: string;
}

// Op globalThis en niet op module-niveau. Next bundelt elke route apart, en dan krijgt
// elke route zijn eigen kopie van dit bestand -- met zijn eigen lege Map. De beeldstroom
// maakte de sessie dus aan in de ene kopie, en de invoer-route zocht hem in de andere en gaf
// 404 terug terwijl alles werkte. Zelfde oplossing als lib/prisma.ts.
const globaal = globalThis as unknown as { shift2Schermsessies?: Map<string, Sessie> };
const sessies: Map<string, Sessie> = globaal.shift2Schermsessies ?? new Map<string, Sessie>();
globaal.shift2Schermsessies = sessies;

function raakAan(s: Sessie) {
  s.laatstGebruikt = Date.now();
}

/** Sessies die niemand meer gebruikt sluiten. Een open browser is een proces dat blijft draaien. */
function ruimOp() {
  const nu = Date.now();
  // forEach en niet for...of: de tsconfig van dit project staat het aflopen van een Map of
  // Set niet toe zonder downlevelIteration, en die vlag omzetten raakt het hele project.
  sessies.forEach((s, id) => {
    if (s.luisteraars.size === 0 && nu - s.laatstGebruikt > VERVALT_NA_MS) {
      sessies.delete(id);
      s.browser.close().catch(() => {});
    }
  });
}

export async function haalSessie(id: string, url: string): Promise<Sessie> {
  ruimOp();
  const bestaand = sessies.get(id);
  if (bestaand) {
    raakAan(bestaand);
    if (bestaand.url !== url) {
      bestaand.url = url;
      await bestaand.page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    }
    return bestaand;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: SCHERM_BREEDTE, height: SCHERM_HOOGTE });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});

  const cdp = await page.createCDPSession();
  const sessie: Sessie = {
    browser,
    page,
    cdp,
    laatsteBeeld: null,
    luisteraars: new Set(),
    laatstGebruikt: Date.now(),
    url,
  };

  cdp.on('Page.screencastFrame', async (f: any) => {
    sessie.laatsteBeeld = f.data;
    sessie.luisteraars.forEach((luister) => luister(f.data));
    // Zonder deze bevestiging stuurt Chrome geen volgend beeld.
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });

  // everyNthFrame 2 en kwaliteit 55: een beeld is rond de 100 kB, en zestien per seconde is
  // anderhalve megabyte per seconde over een verbinding die ook nog de app moet bedienen. Half
  // zo veel beelden is voor kijken en klikken ruim genoeg.
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 55,
    maxWidth: SCHERM_BREEDTE,
    maxHeight: SCHERM_HOOGTE,
    everyNthFrame: 2,
  });

  // Chrome stuurt alleen een beeld als er iets hertekend wordt. Een pagina die stilstaat
  // levert dus niets op, en dan blijft het paneel leeg terwijl alles werkt. Eén opname
  // erbij, zodat er meteen iets staat; daarna neemt de stroom het over zodra je scrolt,
  // klikt of tabt.
  sessie.laatsteBeeld = await neemEenBeeld(cdp);

  sessies.set(id, sessie);
  return sessie;
}

/**
 * Eén los beeld, buiten de stroom om.
 *
 * Nodig omdat een screencast pas beelden geeft bij een hertekening. Ook bruikbaar als de
 * stroom stil is gevallen doordat er even niets gebeurde.
 */
export async function neemEenBeeld(cdp: any): Promise<string | null> {
  try {
    const uit = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 55 });
    return uit?.data ?? null;
  } catch {
    return null;
  }
}

/** Een vers beeld van een lopende sessie, voor wie net aanhaakt of even niets zag bewegen. */
export async function verversBeeld(id: string): Promise<string | null> {
  const s = sessies.get(id);
  if (!s) return null;
  raakAan(s);
  const beeld = await neemEenBeeld(s.cdp);
  if (beeld) {
    s.laatsteBeeld = beeld;
    s.luisteraars.forEach((luister) => luister(beeld));
  }
  return beeld;
}

export function bestaandeSessie(id: string): Sessie | undefined {
  const s = sessies.get(id);
  if (s) raakAan(s);
  return s;
}

export async function sluitSessie(id: string) {
  const s = sessies.get(id);
  if (!s) return;
  sessies.delete(id);
  await s.browser.close().catch(() => {});
}
