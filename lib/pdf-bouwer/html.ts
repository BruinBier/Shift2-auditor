import type { Blok, PdfDocument } from './model';

/**
 * Van blokken naar HTML: de enige plek waar de opmaak van een PDF-bouwer-document staat.
 *
 * Dezelfde HTML voedt het voorbeeld in de bouwer en de PDF (Chrome drukt hem af met tags).
 * Wat je in het voorbeeld ziet, is dus wat er in de PDF komt; een tweede opmaak zou
 * uit de pas gaan lopen.
 *
 * De HTML is bewust kaal semantisch: h1-h6, p, ul/ol, img met alt, table met th en scope.
 * Chrome leidt de tags daaruit af. Geen landmarks (header, nav, main): Chrome tagt een
 * afbeelding in een header-landmark niet, zie lib/pdf-accessibility.ts.
 */

function escape(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Een beetje opmaak binnen een regel: **vet**, *cursief* en [tekst](https://adres).
 *
 * Eerst alles escapen, dan pas de markeringen omzetten: zo kan er geen HTML uit de invoer
 * in het document belanden. Links alleen naar http(s) en mailto.
 */
export function inline(tekst: string): string {
  let html = escape(tekst);
  html = html.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,
    (_m, label: string, url: string) => `<a href="${url}">${label}</a>`,
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return html.replace(/\n/g, '<br>');
}

/** Tekst met lege regels ertussen wordt meerdere alinea's. */
function alineas(tekst: string, klasse?: string): string {
  const cls = klasse ? ` class="${klasse}"` : '';
  return tekst
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => `<p${cls}>${inline(a)}</p>`)
    .join('\n');
}

function blokHtml(b: Blok): string {
  switch (b.soort) {
    case 'kop':
      if (!b.tekst.trim()) return '';
      return `<h${b.niveau}>${inline(b.tekst.trim())}</h${b.niveau}>`;

    case 'alinea':
      return alineas(b.tekst);

    case 'lijst': {
      const items = b.items.map((i) => i.trim()).filter(Boolean);
      if (items.length === 0) return '';
      const tag = b.genummerd ? 'ol' : 'ul';
      return `<${tag}>\n${items.map((i) => `  <li>${inline(i)}</li>`).join('\n')}\n</${tag}>`;
    }

    case 'afbeelding': {
      if (!b.bron) return '';
      const breedte = Math.min(100, Math.max(10, b.breedte || 100));
      const alt = b.decoratief ? '' : escape(b.alt.trim());
      const img = b.decoratief
        ? `<img src="${b.bron}" alt="" role="presentation">`
        : `<img src="${b.bron}" alt="${alt}">`;
      const delen = [`<div class="figuur" style="width:${breedte}%">${img}</div>`];
      if (b.bijschrift.trim()) delen.push(`<p class="bijschrift">${inline(b.bijschrift.trim())}</p>`);
      if (b.beschrijving.trim()) delen.push(alineas(b.beschrijving, 'beschrijving'));
      // Afbeelding, bijschrift en het begin van de beschrijving bij elkaar houden.
      return `<div class="afbeeldingsblok">\n${delen.join('\n')}\n</div>`;
    }

    case 'tabel': {
      if (b.rijen.length === 0) return '';
      const cel = (tekst: string, rij: number, kolom: number): string => {
        const inhoud = inline(tekst.trim());
        if (b.kopRij && rij === 0) return `<th scope="col">${inhoud}</th>`;
        if (b.kopKolom && kolom === 0) return `<th scope="row">${inhoud}</th>`;
        return `<td>${inhoud}</td>`;
      };
      const rij = (cellen: string[], r: number) =>
        `    <tr>${cellen.map((c, k) => cel(c, r, k)).join('')}</tr>`;

      const delen: string[] = ['<table>'];
      if (b.bijschrift.trim()) delen.push(`  <caption>${inline(b.bijschrift.trim())}</caption>`);
      if (b.kopRij) {
        delen.push('  <thead>', rij(b.rijen[0], 0), '  </thead>');
        delen.push('  <tbody>', ...b.rijen.slice(1).map((c, i) => rij(c, i + 1)), '  </tbody>');
      } else {
        delen.push('  <tbody>', ...b.rijen.map((c, i) => rij(c, i)), '  </tbody>');
      }
      delen.push('</table>');
      return delen.join('\n');
    }

    case 'paginaeinde':
      return '<div class="paginaeinde"></div>';
  }
}

export function documentCss(doc: PdfDocument): string {
  const pt = doc.tekstgrootte || 11;
  return `
@page { size: A4; margin: 22mm 20mm 24mm 20mm; }
* { box-sizing: border-box; }
html { font-family: "${doc.lettertype}", Arial, sans-serif; font-size: ${pt}pt; line-height: 1.45; color: #1a1a1a; }
body { margin: 0; }
h1, h2, h3, h4, h5, h6 { line-height: 1.2; margin: 1.2em 0 0.4em; break-after: avoid; page-break-after: avoid; color: #111; }
h1 { font-size: 2em; margin-top: 0; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1.1em; }
h5, h6 { font-size: 1em; }
p { margin: 0 0 0.7em; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 0.8em; padding-left: 1.6em; }
li { margin-bottom: 0.25em; }
a { color: #0b4f9c; text-decoration: underline; }
.afbeeldingsblok { margin: 1em 0 1.1em; }
.figuur { break-inside: avoid; page-break-inside: avoid; }
.figuur img { display: block; width: 100%; height: auto; }
.bijschrift { font-size: 0.9em; font-style: italic; margin: 0.4em 0 0.5em; break-before: avoid; page-break-before: avoid; }
.beschrijving { break-before: avoid; page-break-before: avoid; }
table { border-collapse: collapse; width: 100%; margin: 0.6em 0 1.1em; font-size: 0.95em; }
caption { text-align: left; font-weight: bold; margin-bottom: 0.4em; caption-side: top; }
th, td { border: 1px solid #8a8a8a; padding: 0.35em 0.5em; text-align: left; vertical-align: top; }
th { background: #eceff3; font-weight: bold; }
thead { display: table-header-group; }
tr { break-inside: avoid; page-break-inside: avoid; }
.paginaeinde { break-after: page; page-break-after: always; height: 0; }
`;
}

/** Het volledige HTML-document, klaar voor het voorbeeld of voor Chrome. */
export function documentHtml(doc: PdfDocument, opties: { voorbeeld?: boolean } = {}): string {
  const body = doc.blokken.map(blokHtml).filter(Boolean).join('\n');
  // In het voorbeeld een pagina-achtige kolom op het scherm; in de PDF regelt @page dat.
  const scherm = opties.voorbeeld
    ? `
@media screen {
  html { background: #e5e7eb; }
  body { background: #fff; width: 210mm; min-height: 297mm; margin: 16px auto; padding: 22mm 20mm 24mm; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .paginaeinde { border-top: 2px dashed #9ca3af; margin: 2em -20mm; position: relative; }
  .paginaeinde::after { content: "pagina-einde"; position: absolute; right: 8px; top: -1.4em; font: 11px Arial, sans-serif; color: #6b7280; }
}`
    : '';
  // Een A4-pagina is breder dan het voorbeeldkader: verkleinen tot hij past.
  const schaal = opties.voorbeeld
    ? `<script>
function pas(){var b=document.body;b.style.zoom=1;var z=Math.min(1,(window.innerWidth-24)/b.offsetWidth);b.style.zoom=z;}
window.addEventListener('resize',pas);pas();
</script>`
    : '';
  return `<!DOCTYPE html>
<html lang="${escape(doc.taal || 'nl-NL')}">
<head>
<meta charset="utf-8">
<title>${escape(doc.titel)}</title>
<style>${documentCss(doc)}${scherm}</style>
</head>
<body>
${body}
${schaal}
</body>
</html>`;
}
