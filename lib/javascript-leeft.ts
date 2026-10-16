/**
 * Draait de JavaScript van een opgehaalde pagina? Het oordeel achter het veld `gehydrateerd`.
 *
 * Het veld is ingevoerd na 15 augustus 2026: op heuvelrug.nl (Next.js) hydrateerde React niet
 * in een browserpaneel, en dat leverde drie afkeuringen op die niet bestonden. De eerste
 * controle zocht naar `__react`/`__vue`-sleutels op DOM-elementen. Die vinden we alleen op een
 * site met React of Vue; een site met gewone JavaScript kreeg daardoor altijd `false` en de
 * waarschuwing om geen conclusies over interactie te trekken, ook als alle scripts gewoon
 * draaiden. Zo ging het op 16 oktober 2026 met de oefensite voor 2.4.7. Een agent die die
 * waarschuwing volgt, beoordeelt het toetsenbord op geen enkele gemeentesite zonder React.
 *
 * Daarom twee vragen in plaats van één:
 * 1. Staan er sporen van een framework in de HTML (`__NEXT_DATA__`, `#__nuxt`, ...)? Dan moet
 *    dat framework ook draaien, te zien aan zijn sleutels op de elementen. Sporen zonder
 *    sleutels: dat is het geval van heuvelrug.nl.
 * 2. Geen framework? Dan kijken we via de DevTools-verbinding of er klikafhandelaars hangen,
 *    op de bedieningselementen, op `document` of op `window` (jQuery en de meeste eigen
 *    scripts luisteren daar). Staan er bedieningselementen die JavaScript nodig hebben en hangt
 *    er nergens één afhandelaar, dan draait de JavaScript niet.
 *
 * `gehydrateerd` blijft een ja/nee, zodat bestaande lezers werken: `false` betekent nog steeds
 * "trek geen conclusies over interactie". Het veld `javascript` zegt waarom.
 */

export type JavascriptStatus =
  /** Een framework (React, Vue) is gevonden en draait. */
  | 'gehydrateerd'
  /** De HTML komt van een framework, maar dat draait niet: geen enkele afhandelaar. */
  | 'niet-gehydrateerd'
  /** Geen framework; er hangen klikafhandelaars, of er is niets dat JavaScript nodig heeft. */
  | 'geen-framework'
  /** Geen framework, wel knoppen die JavaScript nodig hebben, en nergens een afhandelaar. */
  | 'geen-afhandelaars';

export interface JavascriptWaarneming {
  /** Een framework dat zijn sleutels op de elementen heeft gezet (`react`, `vue`), of null. */
  actiefFramework: string | null;
  /** Sporen in de HTML die zeggen dat een framework hier hoort te draaien. */
  sporen: string[];
  /** Aantal `<script>`-elementen op de pagina. */
  scripts: number;
  /** Bedieningselementen die zonder JavaScript niets doen (aria-expanded, role=button, ...). */
  jsBediening: number;
  /** Getelde afhandelaars; null als de DevTools-verbinding ze niet kon tellen. */
  afhandelaars: { elementen: number; document: number; window: number } | null;
}

export interface JavascriptOordeel {
  javascript: JavascriptStatus;
  /** False = trek geen conclusies over interactieve criteria. */
  gehydrateerd: boolean;
  toelichting: string;
  waarschuwing?: string;
}

const HERSTART =
  'Start de audit-Chrome met `npm run chrome:debug` en haal de pagina opnieuw op.';

export function beoordeelJavascript(w: JavascriptWaarneming): JavascriptOordeel {
  if (w.actiefFramework) {
    return {
      javascript: 'gehydrateerd',
      gehydrateerd: true,
      toelichting: `${w.actiefFramework} draait: de elementen dragen zijn sleutels.`,
    };
  }
  if (w.sporen.length) {
    return {
      javascript: 'niet-gehydrateerd',
      gehydrateerd: false,
      toelichting: `De HTML komt van een framework (${w.sporen.join(', ')}), maar dat draait niet.`,
      waarschuwing: `De JavaScript van deze pagina draait niet: de HTML komt van een framework (${w.sporen.join(', ')}), maar er hangen geen klikafhandelaars aan. Trek hieruit GEEN conclusies over interactieve criteria (toetsenbord, uitklapmenu, zoeksuggesties, schakelknoppen). ${HERSTART}`,
    };
  }
  if (!w.afhandelaars) {
    return {
      javascript: 'geen-framework',
      gehydrateerd: true,
      toelichting:
        'Geen framework gevonden. De klikafhandelaars konden niet worden geteld; de pagina is in een echte browser opgehaald.',
    };
  }
  const { elementen, document, window } = w.afhandelaars;
  const totaal = elementen + document + window;
  if (totaal === 0 && w.jsBediening > 0 && w.scripts > 0) {
    return {
      javascript: 'geen-afhandelaars',
      gehydrateerd: false,
      toelichting: `Geen framework, ${w.jsBediening} bedieningselementen die JavaScript nodig hebben, en nergens een klikafhandelaar.`,
      waarschuwing: `De JavaScript van deze pagina draait niet: er staan ${w.jsBediening} knoppen of uitklappers die JavaScript nodig hebben, maar er hangt nergens een klikafhandelaar, ook niet op document of window. Trek hieruit GEEN conclusies over interactieve criteria (toetsenbord, uitklapmenu, zoeksuggesties, schakelknoppen). ${HERSTART}`,
    };
  }
  return {
    javascript: 'geen-framework',
    gehydrateerd: true,
    toelichting: totaal
      ? `Geen framework; er hangen klikafhandelaars (${elementen} op bedieningselementen, ${document} op document, ${window} op window).`
      : 'Geen framework en niets op de pagina dat JavaScript nodig heeft.',
  };
}

/**
 * Draait in de pagina (als tekst, zodat de bundler er niets in verandert). Geeft de
 * waarneming zonder de afhandelaars terug, en zet de bedieningselementen op
 * `window.__auditJsBediening`, zodat de DevTools-verbinding ze kan nalopen.
 */
export const JAVASCRIPT_WAARNEMING_SCRIPT = `(() => {
  const alle = Array.from(document.querySelectorAll('body, body *'));
  let actiefFramework = null;
  for (const e of alle) {
    const k = Object.keys(e);
    if (k.some((s) => s.startsWith('__react'))) { actiefFramework = 'React'; break; }
    if (k.some((s) => s.startsWith('__vue'))) { actiefFramework = 'Vue'; break; }
  }
  const sporen = [];
  const spoor = (naam, sel) => { if (document.querySelector(sel)) sporen.push(naam); };
  spoor('Next.js', 'script#__NEXT_DATA__, #__next, script[src*="/_next/"]');
  spoor('Nuxt', '#__nuxt, script[src*="/_nuxt/"]');
  spoor('Gatsby', '#___gatsby');
  spoor('React', '[data-reactroot], [data-reactid]');
  spoor('Vue', '[data-server-rendered], [data-v-app]');
  const bediening = Array.from(document.querySelectorAll(
    '[aria-expanded], [aria-controls], [role="button"], [role="tab"], [role="switch"], [role="combobox"], [onclick], a[href="#"], button:not([type="submit"]):not(form button:not([type]))'
  ));
  window.__auditJsBediening = bediening.slice(0, 60);
  return {
    actiefFramework,
    sporen,
    scripts: document.scripts.length,
    jsBediening: bediening.length,
  };
})()`;
