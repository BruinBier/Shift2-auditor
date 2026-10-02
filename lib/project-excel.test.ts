import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { PrismaClient } from '@prisma/client';
import { columns, ExcelError, exportProjects, InputRow, previewProjects, readProjects, snapshot, StoredProject } from './project-excel';
import { applyPreview, signPreview, verifyPreview } from './project-excel-import';

const owner = { id: '10000000-0000-4000-8000-000000000000', naam: 'Gemeente Voorbeeld', kenmerk: 'VBD' };
const project: StoredProject = { id: '20000000-0000-4000-8000-000000000000', updatedAt: new Date('2026-10-02T08:00:00.000Z'), name: 'Website', opdrachtgeverId: owner.id, projectnummer: 'P02645', cardanKenmerk: 'C-4521' };
const row = (overrides: Partial<InputRow> = {}): InputRow => ({ ...project, version: project.updatedAt.toISOString(), row: 2, ...overrides });
async function workbook(mutate?: (sheet: ExcelJS.Worksheet, book: ExcelJS.Workbook) => void) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Projecten');
  sheet.addRow([...columns]); sheet.addRow([project.id, project.updatedAt.toISOString(), project.name, owner.id, project.projectnummer, project.cardanKenmerk]);
  mutate?.(sheet,book);
  return Buffer.from(await book.xlsx.writeBuffer());
}
const reject = (fn: () => unknown, text: RegExp) => assert.throws(fn, text);

test('export/import roundtrip behoudt identifiers, versies en tekst', async () => {
  const buffer = await exportProjects([project],[owner]);
  const rows = await readProjects(Buffer.from(buffer));
  assert.equal(rows[0].id,project.id); assert.equal(rows[0].version,project.updatedAt.toISOString());
  assert.equal(previewProjects(rows,[project],[owner])[0].kind,'ongewijzigd');
  const book = new ExcelJS.Workbook(); await book.xlsx.load(buffer);
  assert.deepEqual(book.worksheets.map(s => s.name), ['Projecten','Opdrachtgevers','Lees mij']);
  assert.equal(book.getWorksheet('Projecten')!.getCell('E2').type, ExcelJS.ValueType.String);
});
test('preview toont toevoegen, wijzigen, wissen en ongewijzigd; ontbrekende rijen blijven', () => {
  const changes = previewProjects([row({projectnummer:null}),row({ id:null, version:'', row:3, name:'Nieuw', projectnummer:'P999' })],[project],[owner]);
  assert.equal(changes[0].kind,'gewijzigd'); assert.equal(changes[0].before?.projectnummer,'P02645'); assert.equal(changes[0].after.projectnummer,null);
  assert.equal(changes[1].kind,'toegevoegd'); assert.match(changes[1].id,/^[0-9a-f-]{36}$/);
  assert.equal(previewProjects([], [project], [owner]).length,0);
});
test('dubbele ID, onbekend ID en verdwenen versie blokkeren', () => {
  reject(() => previewProjects([row(),row({row:3})],[project],[owner]),/meerdere keren/);
  reject(() => previewProjects([row({id:owner.id})],[project],[owner]),/onbekend/);
  reject(() => previewProjects([row({version:''})],[project],[owner]),/sinds de export gewijzigd/);
  reject(() => previewProjects([row({id:null})],[project],[owner]),/lege versie/);
});
test('waarden en opdrachtgever worden gevalideerd; fouten komen samen terug', () => {
  try { previewProjects([row({name:'', opdrachtgeverId:'onbekend', projectnummer:'123', cardanKenmerk:'x'.repeat(101)})],[project],[owner]); assert.fail(); }
  catch (error) { assert.ok(error instanceof ExcelError); assert.equal(error.errors.length,4); }
});
test('CRM-conflicten met bestaande en nieuwe projecten worden geweigerd', () => {
  reject(() => previewProjects([row({id:null,version:'',name:'Nieuw'})],[project],[owner]),/al door een ander/);
  reject(() => previewProjects([row({id:null,version:'',row:2,projectnummer:'P12'}),row({id:null,version:'',row:3,projectnummer:'P12'})],[],[owner]),/al door een ander/);
});
test('ID en versie wissen kan een bestaand project niet ongemerkt dupliceren', () => {
  reject(() => previewProjects([row({id:null,version:'',projectnummer:null})],[project],[owner]),/al een project met deze naam/);
});
test('kolomvolgorde mag veranderen', async () => {
  const rows = await readProjects(await workbook(s => { const a=s.getCell('A1').value,b=s.getCell('A2').value; s.getCell('A1').value=s.getCell('C1').value; s.getCell('A2').value=s.getCell('C2').value; s.getCell('C1').value=a; s.getCell('C2').value=b; }));
  assert.equal(rows[0].id,project.id); assert.equal(rows[0].name,project.name);
});
test('verkeerde, dubbele, ontbrekende en extra kolommen worden geweigerd', async () => {
  for (const change of [(s: ExcelJS.Worksheet) => {s.getCell('A1').value='onbekend';}, (s: ExcelJS.Worksheet) => {s.getCell('A1').value='versie';}, (s: ExcelJS.Worksheet) => {s.getCell('A1').value=null;}, (s: ExcelJS.Worksheet) => {s.getCell('G1').value='extra';}]) {
    await assert.rejects(() => workbook(change).then(readProjects), ExcelError);
  }
});
test('formules, hyperlinks, getallen en datums worden niet stilzwijgend geïmporteerd', async () => {
  for (const value of [{ formula:'1+1',result:2 }, {text:'P02645',hyperlink:'https://example.com'}, 2645, new Date()]) {
    await assert.rejects(() => workbook(s => {s.getCell('E2').value=value;}).then(readProjects),/Rij 2, crm_projectnummer: gebruik tekst/);
  }
});
test('leeg, corrupt, oversized bestand, extra tabblad en merged cell worden geweigerd', async () => {
  await assert.rejects(() => readProjects(Buffer.from('geen excel')),ExcelError);
  await assert.rejects(() => readProjects(Buffer.alloc(5*1024*1024+1)),/maximaal 5 MB/);
  await assert.rejects(() => workbook(s => {s.getRow(2).values=[];}).then(readProjects),/geen projectgegevens/);
  await assert.rejects(() => workbook((s,b) => {b.addWorksheet('Ander');}).then(readProjects),/Onbekend tabblad/);
  await assert.rejects(() => workbook(s => {s.mergeCells('A2:B2');}).then(readProjects),/samengevoegde/);
});
test('uitgepakte ZIP grootte en rijenlimiet worden gecontroleerd', async () => {
  const zip = new JSZip(); zip.file('xl/workbook.xml','x'.repeat(26*1024*1024));
  const archive = await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  await assert.rejects(() => readProjects(archive),/uitgepakt te groot/);
  // A forged declared size must not bypass the actual streaming expansion limit.
  const forged = Buffer.from(archive);
  for (let i=0; i<forged.length-30; i++) {
    if (forged.readUInt32LE(i)===0x04034b50) forged.writeUInt32LE(1024,i+22);
    if (forged.readUInt32LE(i)===0x02014b50) forged.writeUInt32LE(1024,i+24);
  }
  await assert.rejects(() => readProjects(forged),/uitgepakt te groot/);
  await assert.rejects(() => workbook(s => {s.getCell('A2002').value='x';}).then(readProjects),/2000 rijen/);
});
test('tekst die begint met = blijft tekst bij export', async () => {
  const rows = await readProjects(Buffer.from(await exportProjects([{...project,name:'=1+1'}],[owner])));
  assert.equal(rows[0].name,'=1+1');
});
test('preview token kan niet worden aangepast en verloopt', () => {
  const token = signPreview('baseline',[],1000);
  assert.equal(verifyPreview(token,1001).baseline,'baseline');
  reject(() => verifyPreview(token+'x',1001),/ongeldig/);
  reject(() => verifyPreview(token,1000+15*60*1000),/verlopen/);
});

// A transactional test double deliberately discards its workspace on any failure.
// Real PostgreSQL Serializable integration still requires a configured test database.
function database(initial: StoredProject[], failOnSecondWrite = false) {
  let stored = structuredClone(initial), writes = 0, options: unknown;
  const db = { $transaction: async (fn: (tx: unknown) => Promise<unknown>, opts: unknown) => {
    options = opts; const workspace = structuredClone(stored);
    const tx = { opdrachtgever: { findMany: async () => [owner] }, clientProject: {
      findMany: async () => workspace,
      create: async ({data}: {data: StoredProject}) => { if (++writes===2 && failOnSecondWrite) throw new Error('write failed'); workspace.push({...data,updatedAt:new Date()}); },
      update: async ({where,data}: {where:{id:string};data: Partial<StoredProject>}) => { if (++writes===2 && failOnSecondWrite) throw new Error('write failed'); Object.assign(workspace.find(p => p.id===where.id)!,data,{updatedAt:new Date()}); },
    } };
    const result = await fn(tx); stored=workspace; return result;
  } } as unknown as PrismaClient;
  return { db, records: () => stored, writes: () => writes, options: () => options };
}
test('toepassen gebruikt Serializable, behoudt niet-geëxporteerde velden en raakt ongewijzigde rijen niet', async () => {
  const original = {...project,details:'<p>geheim</p>'}; const db=database([original]);
  const changes = previewProjects([row({name:'Nieuwe naam'}),row({id:null,version:'',row:3,name:'Nieuw',projectnummer:'P777'})],[project],[owner]);
  const token=signPreview(snapshot([project],[owner]),changes);
  assert.deepEqual(await applyPreview(db.db,token),{added:1,changed:1,unchanged:0});
  assert.equal((db.records()[0] as typeof original).details,original.details);
  assert.equal((db.options() as {isolationLevel:string}).isolationLevel,'Serializable');
  await assert.rejects(() => applyPreview(db.db,token),/sinds het controlevoorbeeld gewijzigd/); // replay protection
  const unchangedDb=database([project]);
  await applyPreview(unchangedDb.db,signPreview(snapshot([project],[owner]),previewProjects([row()],[project],[owner])));
  assert.equal(unchangedDb.writes(),0);
});
test('stale controlevoorbeeld blokkeert voordat een write plaatsvindt', async () => {
  const db=database([{...project,name:'Tussentijds veranderd'}]);
  const token=signPreview(snapshot([project],[owner]),previewProjects([row({name:'Mijn wijziging'})],[project],[owner]));
  await assert.rejects(() => applyPreview(db.db,token),/Niets is opgeslagen/);
  assert.equal(db.writes(),0);
});
test('fout tijdens tweede write rolt de hele transactie terug', async () => {
  const db=database([project],true);
  const changes=previewProjects([row({name:'Wijziging'}),row({id:null,version:'',row:3,name:'Nieuw',projectnummer:'P777'})],[project],[owner]);
  await assert.rejects(() => applyPreview(db.db,signPreview(snapshot([project],[owner]),changes)),/write failed/);
  assert.deepEqual(db.records(),[project]);
});
