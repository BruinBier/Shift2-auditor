import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DRAGENDE_ALGEMENE_METING,
  HANDELING_PER_CRITERIUM,
  handelingVoor,
  METINGEN,
  dragendeCommandos,
  metingenVoorCriterium,
} from './metingen';

/**
 * Deze lijst is een afgeleide van de regelbestanden, en afgeleiden drijven af.
 *
 * `DRAGENDE_ALGEMENE_METING` zegt welke algemene meting een criterium draagt als het geen
 * eigen commando heeft. Die uitspraak komt uit `### Zo is het vastgesteld` in het
 * regelbestand. Verandert daar iets -- komt er een meetcommando bij, of gaat een criterium
 * de opname gebruiken waar eerst alleen de code telde -- dan hoort deze lijst mee te
 * veranderen, en anders staat er straks een waarborg op de kaart die nergens meer op slaat.
 *
 * Deze test kan dat niet beoordelen; hij bewaakt wat machinaal te controleren valt.
 */

const REGELMAP = join(__dirname, '..', 'wcag-regels');

function regelbestand(code: string): string | null {
  const naam = `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`;
  try {
    return readFileSync(join(REGELMAP, naam), 'utf8');
  } catch {
    return null;
  }
}

test('elk criterium in de lijst heeft een regelbestand', () => {
  for (const code of Object.keys(DRAGENDE_ALGEMENE_METING)) {
    assert.ok(regelbestand(code), `geen regelbestand voor ${code}`);
  }
});

test('de genoemde commandos bestaan in METINGEN', () => {
  const bekend = new Set(METINGEN.map((m) => m.commando));
  for (const [code, commandos] of Object.entries(DRAGENDE_ALGEMENE_METING)) {
    for (const c of commandos) {
      assert.ok(bekend.has(c), `${code} noemt ${c}, dat niet in METINGEN staat`);
    }
  }
});

test('alleen algemene metingen: een criterium met een eigen commando hoort hier niet', () => {
  for (const [code, commandos] of Object.entries(DRAGENDE_ALGEMENE_METING)) {
    for (const c of commandos) {
      const opdracht = METINGEN.find((m) => m.commando === c);
      assert.equal(
        opdracht?.criteria.length,
        0,
        `${code} noemt ${c}, maar dat commando dient specifieke criteria; zet ${code} dan in ` +
          `zijn eigen criteria-lijst in plaats van hier`
      );
    }
  }
});

test('het regelbestand beschrijft waar het criterium op rust', () => {
  /**
   * Niet op de commandonaam. Het regelbestand van 1.3.3 noemt `get-html` nergens, maar
   * beschrijft hem wel: "de tekst van de pagina zoals die na de JavaScript in de browser
   * staat en met de schermafdruk". Eisen dat de naam er letterlijk staat zou die tekst
   * afkeuren terwijl hij precies zegt wat hij moet zeggen -- en de verleiding geven om
   * commandonamen in een regelbestand te plakken om een test tevreden te stellen.
   *
   * Wat er wél toe doet: dat het bestand ergens beschrijft hoe het criterium wordt
   * vastgesteld. Staat die kop er niet, dan is de toewijzing hier op niets gebaseerd.
   */
  for (const code of Object.keys(DRAGENDE_ALGEMENE_METING)) {
    const tekst = regelbestand(code);
    if (!tekst) continue;
    assert.ok(
      tekst.includes('### Zo is het vastgesteld'),
      `${code} staat in DRAGENDE_ALGEMENE_METING, maar zijn regelbestand heeft geen ` +
        `"Zo is het vastgesteld"; waar komt die toewijzing dan vandaan?`
    );
  }
});

test('een criterium met een eigen meting voor HTML staat niet in de lijst', () => {
  /**
   * `get-pdfstructuur` telt niet mee. Dat commando bestaat alleen voor een PDF, dus een
   * criterium dat verder niets heeft, heeft op een HTML-pagina geen dragende meting -- en
   * dan valt de badge terug op alles wat er toevallig onder ligt. 2.4.2, 3.1.1 en 2.5.8
   * stonden daardoor met een melding over de HTML terwijl hun regelbestand precies zegt
   * waar ze op rusten.
   */
  const ALLEEN_PDF = new Set(['get-pdfstructuur', 'get-pdfcontrast', 'get-pdfconsistentie', 'get-pdfleesvolgorde']);
  for (const code of Object.keys(DRAGENDE_ALGEMENE_METING)) {
    const voorHtml = metingenVoorCriterium(code).filter((m) => !ALLEEN_PDF.has(m.commando));
    assert.equal(
      voorHtml.length,
      0,
      `${code} heeft met ${voorHtml.map((m) => m.commando).join(', ')} een eigen ` +
        `meetcommando voor HTML; dan is deze lijst overbodig en misleidend`
    );
  }
});

test('dragendeCommandos valt terug op de eigen meting', () => {
  // 1.3.2 heeft een eigen commando en staat niet in de lijst.
  assert.deepEqual(dragendeCommandos('1.3.2').sort(), ['get-leesvolgorde', 'get-pdfleesvolgorde']);
  // 1.4.5 heeft er geen en rust op de code en de opname.
  assert.deepEqual(dragendeCommandos('1.4.5').sort(), ['get-html', 'get-screenshot']);
  // 2.4.6 rust alleen op de code: koppen met niveau en tekst.
  assert.deepEqual(dragendeCommandos('2.4.6'), ['get-html']);
  // Een criterium dat nergens in staat, weegt alles -- leeg dus.
  assert.deepEqual(dragendeCommandos('2.4.3'), []);
});

test('elk criterium zonder eigen meting staat in de lijst, of is bewust weggelaten', () => {
  /**
   * De bewuste uitzonderingen. Een criterium dat hier staat heeft geen eigen meting en
   * hoort ook niet in DRAGENDE_ALGEMENE_METING: er is niets machinaals dat het draagt.
   *
   * Zit een criterium in geen van beide lijsten, dan is het vergeten -- en dan weegt de
   * badge stilzwijgend alles wat er toevallig onder ligt.
   */
  const GEEN_DRAGER: string[] = [];

  const uitRegels = readdirSync(REGELMAP)
    .filter((f) => /^Shift2_Regels_SC_\d+_\d+_\d+\.md$/.test(f))
    .map((f) => f.replace('Shift2_Regels_SC_', '').replace('.md', '').replace(/_/g, '.'));

  const ALLEEN_PDF = new Set(['get-pdfstructuur', 'get-pdfcontrast', 'get-pdfconsistentie', 'get-pdfleesvolgorde']);
  const vergeten = uitRegels.filter(
    (code) =>
      // Alleen een PDF-commando telt niet: op een HTML-pagina draagt dat niets.
      metingenVoorCriterium(code).filter((m) => !ALLEEN_PDF.has(m.commando)).length === 0 &&
      !DRAGENDE_ALGEMENE_METING[code] &&
      !GEEN_DRAGER.includes(code)
  );

  assert.deepEqual(
    vergeten,
    [],
    `deze criteria hebben geen eigen meting en staan niet in DRAGENDE_ALGEMENE_METING: ` +
      `${vergeten.join(', ')}. Lees hun "Zo is het vastgesteld" en zet ze erin, of in ` +
      `GEEN_DRAGER hierboven als er niets is dat ze draagt.`
  );
});

test('elk criterium op een algemene meting heeft een handeling', () => {
  /**
   * Zonder handeling valt de kaart terug op de namen van de metingen, en dan staat er
   * "vastgesteld met: de HTML en de schermafdruk" -- twee bestanden in plaats van wat er
   * is gedaan. Bij een criterium met een eigen commando is de naam al de handeling ("een
   * tabronde door de pagina"), dus daar is niets nodig.
   */
  const zonder = Object.keys(DRAGENDE_ALGEMENE_METING).filter(
    (code) => !HANDELING_PER_CRITERIUM[code]
  );
  assert.deepEqual(
    zonder,
    [],
    `deze criteria rusten op een algemene meting maar hebben geen handeling in ` +
      `HANDELING_PER_CRITERIUM: ${zonder.join(', ')}. Lees hun "Zo is het vastgesteld" ` +
      `en schrijf op wat daar gebeurt.`
  );
});

test('een handeling hoort bij een bestaand criterium', () => {
  for (const code of Object.keys(HANDELING_PER_CRITERIUM)) {
    assert.ok(regelbestand(code), `handeling voor ${code}, maar er is geen regelbestand`);
  }
});

test('handelingVoor kiest de vorm die bij het sample past', () => {
  // 3.1.1 heeft twee vormen: op een pagina is "document" PDF-taal.
  assert.equal(handelingVoor('3.1.1', false), 'de taalinstelling van de pagina gelezen');
  assert.equal(handelingVoor('3.1.1', true), 'de documenttaal uitgelezen');
  // Eén vorm: dezelfde zin voor allebei.
  assert.equal(handelingVoor('1.1.1', false), handelingVoor('1.1.1', true));
  // Onbekend criterium: geen handeling, de kaart valt terug op de meetnamen.
  assert.equal(handelingVoor('2.4.3'), undefined);
});

test('een handeling met twee vormen heeft ze allebei gevuld', () => {
  for (const [code, h] of Object.entries(HANDELING_PER_CRITERIUM)) {
    if (typeof h === 'string') continue;
    assert.ok(h.html?.trim(), `${code} mist de html-vorm`);
    assert.ok(h.pdf?.trim(), `${code} mist de pdf-vorm`);
  }
});
