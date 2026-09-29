import fs from 'fs/promises';
import path from 'path';
import type { PdfDocument } from './model';

/**
 * De documenten van de PDF-bouwer staan als JSON-bestand op schijf, in
 * `pdf-bouwer-documenten/` (buiten git). Niet in de database: zo is er geen migratie
 * nodig, en een document met tien afbeeldingen als data-URL hoort niet in een tabelrij.
 *
 * Gevolg: een document staat op de computer waarop het gemaakt is, niet op de tweede.
 */
const MAP = path.join(process.cwd(), 'pdf-bouwer-documenten');

function bestand(id: string): string {
  if (!/^[a-z0-9]{6,32}$/.test(id)) throw new Error(`Ongeldig document-id: ${id}`);
  return path.join(MAP, `${id}.json`);
}

export interface DocumentSamenvatting {
  id: string;
  titel: string;
  blokken: number;
  gewijzigd: string;
}

export async function lijst(): Promise<DocumentSamenvatting[]> {
  await fs.mkdir(MAP, { recursive: true });
  const namen = (await fs.readdir(MAP)).filter((n) => n.endsWith('.json'));
  const docs: DocumentSamenvatting[] = [];
  for (const naam of namen) {
    try {
      const doc = JSON.parse(await fs.readFile(path.join(MAP, naam), 'utf-8')) as PdfDocument;
      docs.push({ id: doc.id, titel: doc.titel, blokken: doc.blokken.length, gewijzigd: doc.gewijzigd });
    } catch {
      // Een onleesbaar bestand slaan we over in plaats van de hele lijst te laten falen.
    }
  }
  return docs.sort((a, b) => b.gewijzigd.localeCompare(a.gewijzigd));
}

export async function lees(id: string): Promise<PdfDocument | null> {
  try {
    return JSON.parse(await fs.readFile(bestand(id), 'utf-8')) as PdfDocument;
  } catch {
    return null;
  }
}

export async function bewaar(doc: PdfDocument): Promise<PdfDocument> {
  await fs.mkdir(MAP, { recursive: true });
  const opgeslagen = { ...doc, gewijzigd: new Date().toISOString() };
  // Eerst naar een tijdelijk bestand en dan hernoemen: een onderbroken schrijfactie laat
  // zo nooit een half document achter.
  const doel = bestand(doc.id);
  await fs.writeFile(`${doel}.tmp`, JSON.stringify(opgeslagen), 'utf-8');
  await fs.rename(`${doel}.tmp`, doel);
  return opgeslagen;
}

export async function verwijder(id: string): Promise<void> {
  await fs.rm(bestand(id), { force: true });
}
