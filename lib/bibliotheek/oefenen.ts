/**
 * De regels van de oefenmodus, los van React zodat ze te testen zijn.
 *
 * Wat het juiste antwoord is, welke feedback erbij hoort en welke casussen
 * meetellen staat hier en nergens anders. Besluiten: docs/bibliotheek/SPEC.md,
 * Besluiten fase 1 (6 en 7).
 */
import type { OordeelWaarde } from './overeenstemming';

export type Antwoord = 'afkeur' | 'geen-afkeur';

/** De enumwaarde uit de database ('geen_afkeur') als woord uit de spec ('geen-afkeur'). */
export function oordeelUitDatabase(oordeel: string): OordeelWaarde {
  return oordeel.replace('_', '-') as OordeelWaarde;
}

/** '131-K1' in oefenset '131' heet op de pagina 'K1', zoals in het prototype. */
export function korteId(casusId: string, oefenset: string): string {
  return casusId.startsWith(`${oefenset}-`) ? casusId.slice(oefenset.length + 1) : casusId;
}

/** `advies` is geen afkeur: daar is Geen afkeur het juiste antwoord (besluit 6). */
export function juistAntwoord(oordeel: OordeelWaarde): Antwoord | null {
  if (oordeel === 'afkeur') return 'afkeur';
  if (oordeel === 'geen-afkeur' || oordeel === 'advies') return 'geen-afkeur';
  return null;
}

/** Een casus van een `twijfel`-patroon heeft geen juist antwoord en doet niet mee (besluit 7). */
export function teltMee(oordeel: OordeelWaarde): boolean {
  return juistAntwoord(oordeel) !== null;
}

export const GOED = 'Goed beoordeeld.';

export function feedbackTekst(
  oordeel: OordeelWaarde,
  criteria: string[],
  antwoord: Antwoord,
): { goed: boolean; tekst: string } {
  const juist = juistAntwoord(oordeel);
  if (juist === antwoord) return { goed: true, tekst: `${GOED} Lees de bevinding hieronder.` };
  const sc = criteria.join(', ');
  if (oordeel === 'afkeur') return { goed: false, tekst: `Niet goed: dit is een afkeur (${sc}).` };
  if (oordeel === 'advies') {
    return { goed: false, tekst: `Niet goed: dit is geen afkeur op ${sc} (wel een advies).` };
  }
  return { goed: false, tekst: `Niet goed: dit is geen afkeur (${sc}).` };
}

/** De tekst op de oordeel-pill in de bevinding. */
export function pillTekst(oordeel: OordeelWaarde, criteria: string[]): string {
  if (oordeel === 'afkeur') return `Afkeur ${criteria.join(', ')}`;
  if (oordeel === 'advies') return 'Advies';
  if (oordeel === 'twijfel') return 'Twijfel';
  return 'Geen afkeur';
}

/** Haalt lege regels aan begin en eind weg en de gemeenschappelijke inspringing. */
export function dedent(tekst: string): string {
  const regels = tekst.replace(/\t/g, '  ').split('\n');
  while (regels.length && !regels[0].trim()) regels.shift();
  while (regels.length && !regels[regels.length - 1].trim()) regels.pop();
  let min = Infinity;
  for (const r of regels) if (r.trim()) min = Math.min(min, r.match(/^ */)![0].length);
  if (!isFinite(min)) min = 0;
  return regels.map((r) => r.slice(min)).join('\n');
}

/** Waar de afbeeldingen van casussen staan (besluit 12). */
export const AFBEELDING_BASIS = '/api/bibliotheek/afbeelding/';

/** Het bericht waarmee het testgebied zijn hoogte doorgeeft aan de pagina. */
export const HOOGTE_BERICHT = 'oefen-hoogte';

/** Het bericht waarmee de pagina het testgebied om zijn hoogte vraagt. */
export const HOOGTE_VRAAG = 'oefen-vraag-hoogte';

/** Waar de app-CSS ophoudt: wat het iframe zelf aan basisstijl meekrijgt. */
const RESET = `
html, body { margin: 0; padding: 0; background: var(--paper, #fbfcfd); }
body { padding: 1rem; overflow: hidden; }
.specimen { border: 0 !important; border-radius: 0 !important; padding: 0 !important;
  background: transparent !important; overflow: visible !important; }
`;

/**
 * Het volledige document van een testgebied, voor `srcdoc`.
 *
 * De casus-HTML komt alleen hierin terecht, nooit in de DOM van de app. Het
 * iframe draait met `sandbox="allow-scripts"` zonder `allow-same-origin`: het
 * script hieronder kan de pagina alleen een hoogte sturen en verder niets
 * van de app lezen. De `base` laat `src="logo.svg"` naar de afbeeldingenroute
 * wijzen, zodat in de broncode de bestandsnaam blijft staan.
 */
export function casusDocument(opts: {
  casusId: string;
  html: string;
  css?: string | null;
  js?: string | null;
  basisCss?: string;
  afbeeldingBasis?: string;
}): string {
  const basis = opts.afbeeldingBasis ?? AFBEELDING_BASIS;
  const id = JSON.stringify(opts.casusId);
  // `</script` in casuscode zou het hoogtescript afbreken; casus-JS wordt los ingevoegd.
  const js = opts.js ? `<script>${opts.js.replace(/<\/script/gi, '<\\/script')}</script>` : '';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<base href="${basis}">
<style>${opts.basisCss ?? ''}</style>
<style>${RESET}</style>
<style>${opts.css ?? ''}</style>
</head>
<body>
<div class="specimen">
${opts.html}
</div>
${js}
<script>
(function () {
  function stuur() {
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    parent.postMessage({ type: ${JSON.stringify(HOOGTE_BERICHT)}, id: ${id}, hoogte: h }, '*');
  }
  if (window.ResizeObserver) new ResizeObserver(stuur).observe(document.body);
  window.addEventListener('load', stuur);
  // De pagina kan later gaan luisteren dan dit document klaar is; dan vraagt hij opnieuw.
  window.addEventListener('message', function (e) {
    if (e.source === parent && e.data && e.data.type === ${JSON.stringify(HOOGTE_VRAAG)}) stuur();
  });
  stuur();
})();
</script>
</body>
</html>`;
}
