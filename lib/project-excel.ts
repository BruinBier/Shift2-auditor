import ExcelJS from 'exceljs';
import { createHash, randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import type { Readable } from 'node:stream';

export const columns = ['project_id', 'versie', 'projectnaam', 'opdrachtgever_id', 'crm_projectnummer', 'cardan_kenmerk'] as const;
export const fields = ['name', 'opdrachtgeverId', 'projectnummer', 'cardanKenmerk'] as const;
export type Values = { name: string; opdrachtgeverId: string; projectnummer: string | null; cardanKenmerk: string | null };
export type StoredProject = Values & { id: string; updatedAt: Date };
export type Owner = { id: string; naam: string; kenmerk: string };
export type InputRow = Values & { id: string | null; version: string; row: number };
export type Change = { id: string; row: number; kind: 'toegevoegd' | 'gewijzigd' | 'ongewijzigd'; before: Values | null; after: Values };
export class ExcelError extends Error {
  constructor(public errors: string[], public status = 400) { super(errors.join('\n')); }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const values = (p: Values): Values => ({ name: p.name, opdrachtgeverId: p.opdrachtgeverId, projectnummer: p.projectnummer, cardanKenmerk: p.cardanKenmerk });
export function snapshot(projects: StoredProject[], owners: Owner[]) {
  return createHash('sha256').update(JSON.stringify({
    projects: [...projects].sort((a,b) => a.id.localeCompare(b.id)).map(p => ({ id: p.id, version: p.updatedAt.toISOString(), ...values(p) })),
    owners: [...owners].sort((a,b) => a.id.localeCompare(b.id)),
  })).digest('hex');
}

export async function exportProjects(projects: StoredProject[], owners: Owner[]) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Projecten', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.addRow([...columns]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c, i) => { c.width = i === 2 ? 45 : 38; c.numFmt = '@'; });
  projects.forEach(p => sheet.addRow([p.id, p.updatedAt.toISOString(), p.name, p.opdrachtgeverId, p.projectnummer ?? '', p.cardanKenmerk ?? '']));
  sheet.autoFilter = { from: 'A1', to: 'F1' };
  const lookup = book.addWorksheet('Opdrachtgevers');
  lookup.addRow(['opdrachtgever_id', 'kenmerk', 'naam']);
  owners.forEach(o => lookup.addRow([o.id, o.kenmerk, o.naam]));
  lookup.columns.forEach(c => { c.width = 40; c.numFmt = '@'; });
  const help = book.addWorksheet('Lees mij');
  [
    'Shift2 Auditor projectgegevens — formaat v1',
    'Bewerk uitsluitend het tabblad Projecten. Dit bestand bevat alle klantprojecten, ongeacht schermfilters.',
    'Behoud project_id en versie voor bestaande projecten. Een onbekend of gewijzigd ID wordt afgekeurd.',
    'Nieuw project: laat project_id en versie beide leeg. Opdrachtgever moet al bestaan; zie Opdrachtgevers.',
    'Alle zes kolommen zijn verplicht. De volgorde mag veranderen. Extra kolommen worden afgekeurd.',
    'Lege crm_projectnummer of cardan_kenmerk wist die waarde; controleer dit in het voorbeeld.',
    'CRM-nummer: P gevolgd door cijfers, bijvoorbeeld P02645. Kopieer gegevens uit Dynamics als tekst, zonder formules.',
    'Ontbrekende rijen verwijderen niets. Onderzoeken, bevindingen en projectdetails blijven behouden.',
    'Versieverschillen blokkeren de hele import. Exporteer dan opnieuw en verwerk je wijzigingen daarin.',
    'Uploaden toont alleen een controlevoorbeeld. Pas na Alles toepassen worden wijzigingen opgeslagen.',
    'Maximaal 5 MB en 2000 projectrijen. Opdrachtgevers en Lees mij worden nooit geïmporteerd.',
  ].forEach(line => help.addRow([line]));
  help.getColumn(1).width = 120;
  return book.xlsx.writeBuffer();
}

export async function readProjects(buffer: Buffer): Promise<InputRow[]> {
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new ExcelError(['Gebruik een .xlsx-bestand van maximaal 5 MB.']);
  let book: ExcelJS.Workbook;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.values(zip.files);
    // Bound expanded XLSX size before ExcelJS parses XML (ZIP bomb protection).
    const expanded = entries.reduce((sum, file) => sum + ((file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0), 0);
    if (entries.length > 500 || expanded > 25 * 1024 * 1024 || !zip.file('xl/workbook.xml')) throw new Error('size');
    let actualExpanded = 0;
    for (const entry of entries.filter(e => !e.dir)) {
      await new Promise<void>((resolve, reject) => {
        const stream = entry.nodeStream() as Readable;
        stream.on('data', (chunk: Buffer) => {
          actualExpanded += chunk.length;
          if (actualExpanded > 25 * 1024 * 1024) {
            stream.pause(); stream.destroy(); reject(new Error('expanded size'));
          }
        });
        stream.on('end', resolve); stream.on('error', reject);
      });
    }
    book = new ExcelJS.Workbook();
    await book.xlsx.load(buffer as unknown as Parameters<typeof book.xlsx.load>[0]);
  } catch { throw new ExcelError(['Het bestand is geen geldig of ondersteund Excelbestand (.xlsx), of is uitgepakt te groot.']); }
  const sheet = book.getWorksheet('Projecten');
  if (!sheet) throw new ExcelError(['Het verplichte tabblad Projecten ontbreekt. Gebruik eerst de export.']);
  if (book.worksheets.some(s => !['Projecten', 'Opdrachtgevers', 'Lees mij'].includes(s.name))) throw new ExcelError(['Onbekend tabblad. Gebruik alleen Projecten, Opdrachtgevers en Lees mij.']);
  if (sheet.rowCount > 2001 || sheet.columnCount > columns.length || sheet.model.merges?.length) throw new ExcelError(['Maximaal 2000 rijen en zes kolommen; samengevoegde cellen zijn niet toegestaan.']);
  const headers: string[] = [];
  for (let c = 1; c <= columns.length; c++) {
    const v = sheet.getCell(1,c).value;
    if (typeof v !== 'string') throw new ExcelError(['Kolomkoppen moeten tekst zijn.']);
    headers.push(v.trim());
  }
  if (new Set(headers).size !== columns.length || columns.some(c => !headers.includes(c))) throw new ExcelError([`Kolommen moeten precies zijn: ${columns.join(', ')}.`]);
  const errors: string[] = [], rows: InputRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const data: Record<string, string> = {};
    let invalid = false;
    headers.forEach((h,i) => {
      const v = sheet.getCell(r,i+1).value;
      if (v !== null && typeof v !== 'string') { errors.push(`Rij ${r}, ${h}: gebruik tekst; getallen, formules en hyperlinks zijn niet toegestaan.`); invalid = true; }
      data[h] = typeof v === 'string' ? v.trim() : '';
    });
    if (invalid || Object.values(data).every(v => !v)) continue;
    rows.push({ row: r, id: data.project_id || null, version: data.versie, name: data.projectnaam, opdrachtgeverId: data.opdrachtgever_id, projectnummer: data.crm_projectnummer || null, cardanKenmerk: data.cardan_kenmerk || null });
  }
  if (errors.length) throw new ExcelError(errors);
  if (!rows.length) throw new ExcelError(['Het tabblad Projecten bevat geen projectgegevens.']);
  return rows;
}

export function previewProjects(rows: InputRow[], projects: StoredProject[], owners: Owner[]): Change[] {
  const errors: string[] = [], changes: Change[] = [], seen = new Set<string>();
  const current = new Map(projects.map(p => [p.id,p]));
  const ownerIds = new Set(owners.map(o => o.id));
  for (const row of rows) {
    const fail = (message: string) => errors.push(`Rij ${row.row}: ${message}`);
    if (!row.name || row.name.length > 250) fail('projectnaam is verplicht en maximaal 250 tekens.');
    if (!ownerIds.has(row.opdrachtgeverId)) fail('opdrachtgever_id bestaat niet. Kies een ID uit Opdrachtgevers.');
    if (row.projectnummer && (!/^P\d+$/.test(row.projectnummer) || row.projectnummer.length > 50)) fail('CRM-projectnummer moet P gevolgd door cijfers zijn (bijvoorbeeld P02645), maximaal 50 tekens.');
    if (row.cardanKenmerk && (row.cardanKenmerk.length > 100 || /[\x00-\x1f]/.test(row.cardanKenmerk))) fail('Cardan-kenmerk is maximaal 100 tekens en bevat geen besturingstekens.');
    if (/[\x00-\x1f]/.test(row.name)) fail('projectnaam bevat besturingstekens.');
    const existing = row.id ? current.get(row.id) : undefined;
    if (row.id) {
      if (!uuid.test(row.id) || !existing) fail('project_id is onbekend. Bestaande IDs mogen niet wijzigen; laat voor een nieuw project ID en versie leeg.');
      if (seen.has(row.id)) fail('project_id komt meerdere keren voor.');
      seen.add(row.id);
      if (existing && row.version !== existing.updatedAt.toISOString()) fail('het project is sinds de export gewijzigd. Exporteer opnieuw.');
    } else if (row.version) fail('een nieuw project moet een lege versie hebben.');
    const before = existing ? values(existing) : null, after = values(row);
    changes.push({ id: row.id ?? randomUUID(), row: row.row, kind: !before ? 'toegevoegd' : fields.some(f => before[f] !== after[f]) ? 'gewijzigd' : 'ongewijzigd', before, after });
  }
  // CRM is not a unique DB column. Refuse ambiguous new assignments, without blocking untouched legacy duplicates.
  const final = new Map(projects.map(p => [p.id, values(p)]));
  changes.forEach(c => final.set(c.id,c.after));
  changes.filter(c => c.kind === 'toegevoegd').forEach(c => {
    if (Array.from(final).some(([id,p]) => id !== c.id && p.opdrachtgeverId === c.after.opdrachtgeverId && p.name.toLocaleLowerCase('nl-NL') === c.after.name.toLocaleLowerCase('nl-NL'))) errors.push(`Rij ${c.row}: er bestaat al een project met deze naam bij deze opdrachtgever. Gebruik het bestaande project_id en de versie uit de export.`);
  });
  changes.filter(c => c.kind !== 'ongewijzigd' && c.after.projectnummer && c.before?.projectnummer !== c.after.projectnummer).forEach(c => {
    if (Array.from(final).some(([id,p]) => id !== c.id && p.projectnummer === c.after.projectnummer)) errors.push(`Rij ${c.row}: CRM-projectnummer ${c.after.projectnummer} wordt al door een ander project gebruikt.`);
  });
  if (errors.length) throw new ExcelError(errors);
  return changes;
}
