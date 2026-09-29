// node vergelijk-controle.js <run.json> <controle.json>  -> tabel + FP/FN
const fs = require('fs');
const [runPad, ctrlPad] = process.argv.slice(2);
const run = JSON.parse(fs.readFileSync(runPad, 'utf8'));
let ctrl = fs.readFileSync(ctrlPad, 'utf8');
ctrl = JSON.parse(ctrl.slice(ctrl.indexOf('['), ctrl.lastIndexOf(']') + 1));
const norm = (u) => u.replace(/\/+$/, '').replace(/^https?:\/\//, '').toLowerCase() || '/';
const perUrl = new Map(run.profielen.filter((p) => p.soort === 'html').map((p) => [norm(p.urlNorm), p]));
const heeft = (p, g) => (p.gebieden || []).some((x) => x.gebied === g);
const rijen = [];
const fout = [];
for (const c of ctrl) {
  const p = perUrl.get(norm(c.url));
  if (!p) {
    rijen.push(`| ${c.url} | niet in de run | | | | | |`);
    continue;
  }
  const k = p.kenmerken || {};
  const m = {
    formulier: heeft(p, 'G26'),
    tabel: heeft(p, 'G16'),
    video: heeft(p, 'G21') || heeft(p, 'G22'),
    kaart: heeft(p, 'G29'),
    iframes: k.aantalIframes || 0,
    documentlinks: k.aantalDocumentlinks || 0,
  };
  const cel = (naam) => {
    const a = m[naam];
    const b = c[naam];
    if (typeof a === 'boolean') {
      if (a === !!b) return a ? 'ja' : '–';
      fout.push({ url: c.url, kenmerk: naam, soort: a ? 'FALSE POSITIVE' : 'FALSE NEGATIVE', meting: a, controle: !!b, bewijsControle: c[naam + 'Bewijs'] || '', bewijsMeting: ((p.gebieden || []).find((g) => ({ formulier: 'G26', tabel: 'G16', video: 'G21', kaart: 'G29' })[naam] === g.gebied) || {}).bewijs || '' });
      return a ? '**ja (FP)**' : '**nee (FN)**';
    }
    if (a === b) return String(a);
    fout.push({ url: c.url, kenmerk: naam, soort: 'AANTAL', meting: a, controle: b });
    return `${a} (controle ${b})`;
  };
  rijen.push(`| ${p.urlNorm.replace(/https:\/\/[^/]+/, '') || '/'} | ${p.laag} | ${cel('formulier')} | ${cel('tabel')} | ${cel('video')} | ${cel('kaart')} | ${cel('iframes')} | ${cel('documentlinks')} |`);
}
console.log('| Pagina | Laag | Formulier | Tabel | Video | Kaart | Iframes | Documentlinks |');
console.log('|---|---|---|---|---|---|---|---|');
console.log(rijen.join('\n'));
console.log('\nAFWIJKINGEN:');
for (const f of fout) console.log(JSON.stringify(f));
console.log('\nTWIJFEL CONTROLE:');
for (const c of ctrl) if (c.twijfel) console.log(c.url, '|', c.twijfel);
