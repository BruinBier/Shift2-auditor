import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {
  BLAD_PROJECTEN,
  KOLOMMEN,
  controleer,
  leesWerkmap,
  maakWerkmap,
  type OpdrachtgeverStand,
  type ProjectStand,
  type Veld,
} from './projecten-excel';

const OG: OpdrachtgeverStand[] = [
  { id: 'og-waal', kenmerk: 'WAAL', naam: 'gemeente Waalwijk' },
  { id: 'og-urk', kenmerk: 'URK', naam: 'gemeente Urk' },
];

const EXPORT = new Date('2026-10-01T10:00:00.000Z');

const PROJECTEN: ProjectStand[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Waalwijk website 2026',
    opdrachtgeverKenmerk: 'WAAL',
    opdrachtgeverNaam: 'gemeente Waalwijk',
    projectnummer: 'P02645',
    cardanKenmerk: null,
    contactnaam: 'Anna de Vries',
    contactEmail: 'a.devries@waalwijk.nl',
    aantalOnderzoeken: 2,
    updatedAt: new Date('2026-09-30T08:15:42.123Z'),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Urk PDF-onderzoek',
    opdrachtgeverKenmerk: 'URK',
    opdrachtgeverNaam: 'gemeente Urk',
    projectnummer: null,
    cardanKenmerk: 'C-4521',
    contactnaam: null,
    contactEmail: null,
    aantalOnderzoeken: 0,
    updatedAt: new Date('2026-09-29T12:00:00.000Z'),
  },
];

/** Exporteert, laat de test het werkblad bewerken, en leest het weer in zoals een upload. */
async function rondje(bewerk?: (ws: ExcelJS.Worksheet) => void, projecten = PROJECTEN) {
  const wb = await maakWerkmap(PROJECTEN, OG, EXPORT);
  if (bewerk) bewerk(wb.getWorksheet(BLAD_PROJECTEN)!);
  const buffer = await wb.xlsx.writeBuffer();
  const gelezen = await leesWerkmap(buffer as ArrayBuffer);
  return { gelezen, controle: gelezen.ok ? controleer(gelezen, projecten, OG) : null };
}

const kol = (veld: Veld) => KOLOMMEN.findIndex(k => k.veld === veld) + 1;

/** Zoekt de rij van een project op zijn id; de export sorteert op opdrachtgever. */
function rijVan(ws: ExcelJS.Worksheet, id: string) {
  for (let r = 2; r <= ws.rowCount; r++) if (ws.getRow(r).getCell(kol('id')).value === id) return ws.getRow(r);
  throw new Error('rij niet gevonden');
}

test('een onaangeroerde export komt terug als helemaal ongewijzigd', async () => {
  const { controle } = await rondje();
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.equal(controle.nieuw.length, 0);
  assert.equal(controle.gewijzigd.length, 0);
  assert.equal(controle.ongewijzigd.length, 2);
  assert.equal(controle.nietInBestand.length, 0);
});

test('de export bevat de kolommen in vaste volgorde, plus de bladen Opdrachtgevers en Uitleg', async () => {
  const wb = await maakWerkmap(PROJECTEN, OG, EXPORT);
  const kop = wb.getWorksheet(BLAD_PROJECTEN)!.getRow(1);
  assert.deepEqual(
    KOLOMMEN.map((_, i) => kop.getCell(i + 1).value),
    KOLOMMEN.map(k => k.kop)
  );
  assert.ok(wb.getWorksheet('Opdrachtgevers'));
  assert.ok(wb.getWorksheet('Uitleg'));
});

test('een gewijzigd CRM-nummer en een nieuwe contactpersoon worden als wijziging getoond', async () => {
  const { controle } = await rondje(ws => {
    const rij = rijVan(ws, PROJECTEN[1].id);
    rij.getCell(kol('projectnummer')).value = 'p02700'; // kleine letter: wordt hoofdletter
    rij.getCell(kol('contactnaam')).value = 'Jan Bakker';
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.equal(controle.gewijzigd.length, 1);
  const g = controle.gewijzigd[0];
  assert.equal(g.id, PROJECTEN[1].id);
  assert.deepEqual(g.data, { projectnummer: 'P02700', contactnaam: 'Jan Bakker' });
  assert.deepEqual(
    g.wijzigingen.map(w => [w.label, w.oud, w.nieuw]),
    [
      ['CRM-nummer', null, 'P02700'],
      ['Contactpersoon', null, 'Jan Bakker'],
    ]
  );
});

test('een regel zonder Project-ID wordt een nieuw project bij een bestaande opdrachtgever', async () => {
  const { controle } = await rondje(ws => {
    const r = ws.rowCount + 1;
    ws.getRow(r).getCell(kol('name')).value = 'Urk website';
    ws.getRow(r).getCell(kol('opdrachtgeverKenmerk')).value = 'urk';
    ws.getRow(r).getCell(kol('contactEmail')).value = { text: 'info@urk.nl', hyperlink: 'mailto:info@urk.nl' };
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.equal(controle.nieuw.length, 1);
  assert.equal(controle.nieuw[0].opdrachtgeverId, 'og-urk');
  assert.equal(controle.nieuw[0].contactEmail, 'info@urk.nl');
});

test('een weggehaalde regel is geen verwijdering', async () => {
  const { controle } = await rondje(ws => {
    ws.spliceRows(rijVan(ws, PROJECTEN[0].id).number, 1);
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.equal(controle.gewijzigd.length, 0);
  assert.deepEqual(controle.nietInBestand.map(p => p.id), [PROJECTEN[0].id]);
});

test('ongeldige waarden geven Nederlandse fouten met regel en kolom', async () => {
  const { controle } = await rondje(ws => {
    const rij = rijVan(ws, PROJECTEN[0].id);
    rij.getCell(kol('projectnummer')).value = '2645';
    rij.getCell(kol('cardanKenmerk')).value = 'C4521';
    rij.getCell(kol('contactEmail')).value = 'geen-adres';
    rij.getCell(kol('name')).value = '';
  });
  assert.ok(controle);
  const berichten = controle.fouten.map(f => `${f.kolom}: ${f.bericht}`);
  assert.equal(controle.fouten.length, 4, berichten.join('\n'));
  assert.ok(controle.fouten.every(f => typeof f.regel === 'number'));
  assert.ok(berichten.some(b => b.startsWith('CRM-nummer:') && b.includes('P02645')));
  assert.ok(berichten.some(b => b.startsWith('Projectnaam:') && b.includes('verplicht')));
  // Een regel met een fout komt niet als wijziging in het overzicht.
  assert.equal(controle.gewijzigd.length, 0);
});

test('een onbekende opdrachtgever wordt niet stil aangemaakt', async () => {
  const { controle } = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('opdrachtgeverKenmerk')).value = 'NIEUW';
  });
  assert.ok(controle);
  assert.equal(controle.fouten.length, 1);
  assert.match(controle.fouten[0].bericht, /geen opdrachtgever met kenmerk "NIEUW"/);
});

test('een onbekend, ongeldig of dubbel Project-ID is een fout', async () => {
  const { controle } = await rondje(ws => {
    // Eerst het Urk-project dubbel onderaan, dan de twee andere ID's bederven.
    const kopie = rijVan(ws, PROJECTEN[1].id).values as ExcelJS.CellValue[];
    ws.getRow(ws.rowCount + 1).values = kopie;
    rijVan(ws, PROJECTEN[0].id).getCell(kol('id')).value = '33333333-3333-4333-8333-333333333333';
    ws.getRow(ws.rowCount + 1).getCell(kol('id')).value = 'abc';
    ws.getRow(ws.rowCount).getCell(kol('name')).value = 'Iets';
    ws.getRow(ws.rowCount).getCell(kol('opdrachtgeverKenmerk')).value = 'URK';
  });
  assert.ok(controle);
  const berichten = controle.fouten.map(f => f.bericht).join('\n');
  assert.match(berichten, /geen project met dit Project-ID/);
  assert.match(berichten, /geen geldig Project-ID/);
  assert.match(berichten, /staat ook op regel/);
});

test('een ontbrekende kolom houdt de hele import tegen', async () => {
  const { gelezen } = await rondje(ws => {
    ws.getRow(1).getCell(kol('projectnummer')).value = 'Projectnr';
  });
  assert.equal(gelezen.ok, false);
  if (gelezen.ok) return;
  assert.match(gelezen.fouten[0].bericht, /kolom "CRM-nummer" ontbreekt/);
});

test('een ander bestand dan een xlsx geeft een begrijpelijke fout', async () => {
  const gelezen = await leesWerkmap(Buffer.from('dit is geen excel'));
  assert.equal(gelezen.ok, false);
  if (gelezen.ok) return;
  assert.match(gelezen.fouten[0].bericht, /kon niet worden gelezen/);
});

test('een project dat na de export in de tool is gewijzigd, wordt niet overschreven', async () => {
  const laterGewijzigd = PROJECTEN.map(p =>
    p.id === PROJECTEN[0].id ? { ...p, updatedAt: new Date('2026-10-01T11:00:00.000Z') } : p
  );
  // Export met de oude stand, controle tegen de nieuwe.
  const { controle } = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('contactnaam')).value = 'Iemand anders';
  }, laterGewijzigd);
  assert.ok(controle);
  assert.equal(controle.fouten.length, 1);
  assert.match(controle.fouten[0].bericht, /na de export in de tool gewijzigd/);
});

test('een "Laatst gewijzigd" waar Excel een datum van heeft gemaakt, wordt niet vertrouwd', async () => {
  const { controle } = await rondje(ws => {
    const rij = rijVan(ws, PROJECTEN[0].id);
    rij.getCell(kol('updatedAt')).value = new Date('2026-09-30T08:15:42.000Z');
    rij.getCell(kol('contactnaam')).value = 'Nieuw';
  });
  assert.ok(controle);
  assert.equal(controle.fouten.length, 1);
  assert.match(controle.fouten[0].bericht, /maak een nieuwe export/);
});

test('een leeggemaakte "Laatst gewijzigd" is een fout bij een bestaand project', async () => {
  const { controle } = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('updatedAt')).value = '30-9-2026';
  });
  assert.ok(controle);
  assert.equal(controle.fouten.length, 1);
  assert.match(controle.fouten[0].bericht, /Laatst gewijzigd in tool/);
});

test('een leeggemaakt veld is een wijziging met een waarschuwing', async () => {
  const { controle } = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('projectnummer')).value = null;
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.deepEqual(controle.gewijzigd[0].data, { projectnummer: null });
  assert.ok(controle.waarschuwingen.some(w => /wordt leeggemaakt/.test(w.bericht)));
});

test('een extra kolom wordt genegeerd met een waarschuwing', async () => {
  const { controle } = await rondje(ws => {
    ws.getRow(1).getCell(KOLOMMEN.length + 2).value = 'Mijn aantekening';
    ws.getRow(2).getCell(KOLOMMEN.length + 2).value = 'bellen';
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.ok(controle.waarschuwingen.some(w => /Mijn aantekening/.test(w.bericht)));
});

test('de vingerafdruk verandert als wat er toegepast wordt verandert', async () => {
  const a = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('contactnaam')).value = 'A';
  });
  const b = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('contactnaam')).value = 'B';
  });
  const a2 = await rondje(ws => {
    rijVan(ws, PROJECTEN[0].id).getCell(kol('contactnaam')).value = 'A';
  });
  assert.notEqual(a.controle!.vingerafdruk, b.controle!.vingerafdruk);
  assert.equal(a.controle!.vingerafdruk, a2.controle!.vingerafdruk);
});

test('een ongeldige waarde die al zo in de tool stond, blokkeert de import niet', async () => {
  const oudeSchrijfwijze = PROJECTEN.map(p =>
    p.id === PROJECTEN[0].id ? { ...p, projectnummer: 'P02076 Contentonderzoek', contactnaam: 'Anna de Vries ' } : p
  );
  const wb = await maakWerkmap(oudeSchrijfwijze, OG, EXPORT);
  const gelezen = await leesWerkmap((await wb.xlsx.writeBuffer()) as ArrayBuffer);
  assert.ok(gelezen.ok);
  if (!gelezen.ok) return;
  const controle = controleer(gelezen, oudeSchrijfwijze, OG);
  assert.deepEqual(controle.fouten, []);
  // Ook de spatie achter de naam is geen wijziging.
  assert.equal(controle.gewijzigd.length, 0);
  assert.ok(controle.waarschuwingen.some(w => /al in de tool/.test(w.bericht)));
});

test('een nieuw CRM-nummer dat al bij een ander project staat, geeft een waarschuwing', async () => {
  const { controle } = await rondje(ws => {
    rijVan(ws, PROJECTEN[1].id).getCell(kol('projectnummer')).value = 'P02645';
  });
  assert.ok(controle);
  assert.deepEqual(controle.fouten, []);
  assert.ok(controle.waarschuwingen.some(w => /staat ook bij "Waalwijk website 2026"/.test(w.bericht)));
});
