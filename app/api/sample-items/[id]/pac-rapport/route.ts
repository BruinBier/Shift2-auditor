import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, rm } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';

/**
 * De PAC-uitvoer van een PDF-sample opbergen.
 *
 * Meervoud, want één bestand was te weinig: de werkafspraak in `Shift2_Werkwijze_PDF.md`
 * vraagt om het Summary report PLUS een Detailed report per tabblad met Failed of Warning.
 * Het Summary geeft alleen tellingen ("158 fout"), en daaruit volgt geen bevinding.
 *
 * PAC exporteert alleen naar PDF; schermafdrukken mogen ook, want dat is hoe PAC zijn
 * uitkomst toont. Deze route bergt de bestanden op; ze leest ze niet.
 */

const MAX_BYTES = 25 * 1024 * 1024;
const TOEGESTAAN = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

/**
 * De Screen reader preview komt binnen als scrollopname, en die is niet klein.
 *
 * Er is geen export voor dat scherm, dus je legt het vast met een scrollopname --
 * en die levert een strook op van duizenden beeldpunten hoog. Het voorbeeld waarop
 * dit is gebouwd was 1914 x 96207 en 118 MB. Als geheel is dat onbruikbaar: te
 * groot om op te slaan, te groot om te bekijken, en te groot om aan een agent te
 * geven. Gesneden in stukken van schermhoogte is het 11 MB en is elk stuk leesbaar.
 *
 * Vandaar een eigen grens en een eigen route: een PSB wordt niet opgeslagen zoals
 * hij binnenkomt, maar omgezet. Wat er overblijft zijn gewone PNG's, en daar kan de
 * rest van de tool gewoon mee overweg.
 */
const MAX_BYTES_PSB = 400 * 1024 * 1024;
const PSB_EXTENSIES = ['.psb', '.psd'];
const STUK_HOOGTE = 1400;
const STUK_OVERLAP = 100;

type Stuk = { bestand: string; vanaf: number; tot: number; bytes: number };
type SnijUitkomst = { hoogte: number; stukken: Stuk[] } | { fout: string };

/**
 * De scrollopname in stukken snijden, via het Python-script.
 *
 * Python en niet Node, omdat het lezen van een PSB buiten de grens van 30.000
 * beeldpunten per as om moet -- `psd_tools` kan dat als je de kanalen zelf
 * samenstelt, en voor Node bestaat daar niets vergelijkbaars voor.
 */
function snijScrollopname(bron: string, uitmap: string): Promise<SnijUitkomst> {
  return new Promise((resolve) => {
    const script = path.join(process.cwd(), 'scripts', 'psb-naar-stukken.py');
    const proces = spawn('python', [
      script,
      bron,
      uitmap,
      String(STUK_HOOGTE),
      String(STUK_OVERLAP),
    ]);

    let uit = '';
    let err = '';
    proces.stdout.on('data', (d) => (uit += d));
    proces.stderr.on('data', (d) => (err += d));

    proces.on('error', (e) => resolve({ fout: `python starten mislukte: ${e.message}` }));
    proces.on('close', () => {
      try {
        const d = JSON.parse(uit.trim().split('\n').pop() || '{}');
        resolve(d.fout ? { fout: d.fout } : d);
      } catch {
        resolve({ fout: err.trim().split('\n').pop() || 'onbekende fout bij het snijden' });
      }
    });
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sample = await prisma.sampleItem.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!sample) {
      return NextResponse.json({ error: 'Sample niet gevonden' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string | null)?.trim() || null;
    if (!file) {
      return NextResponse.json({ error: 'Geen bestand meegestuurd' }, { status: 400 });
    }

    const extensie = path.extname(file.name).toLowerCase();
    const isPsb = PSB_EXTENSIES.includes(extensie);
    const grens = isPsb ? MAX_BYTES_PSB : MAX_BYTES;

    if (file.size > grens) {
      return NextResponse.json(
        { error: `Bestand is groter dan ${Math.round(grens / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }
    if (!isPsb && file.type && !TOEGESTAAN.includes(file.type)) {
      return NextResponse.json(
        { error: `Bestandstype ${file.type} wordt niet ondersteund. Gebruik PDF, een afbeelding of een PSB-scrollopname.` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pac');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const veiligeNaam = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${params.id}-${Date.now()}-${veiligeNaam}`;
    const doelpad = path.join(uploadDir, filename);
    await writeFile(doelpad, Buffer.from(await file.arrayBuffer()));

    // Een PSB gaat niet de database in zoals hij binnenkomt. Hij wordt gesneden,
    // de stukken worden de rapporten, en het bronbestand gaat weg -- niemand kan
    // het lezen, en 118 MB bewaren die nooit geopend wordt is geen bewijs.
    if (isPsb) {
      const stukkenMap = path.join(uploadDir, `${params.id}-${Date.now()}-schermlezer`);
      const uitvoer = await snijScrollopname(doelpad, stukkenMap);
      await unlink(doelpad).catch(() => {});

      if ('fout' in uitvoer) {
        return NextResponse.json(
          { error: `Omzetten van de scrollopname mislukte: ${uitvoer.fout}` },
          { status: 400 }
        );
      }

      const mapNaam = path.basename(stukkenMap);
      const rapporten = [];
      for (let i = 0; i < uitvoer.stukken.length; i++) {
        const stuk = uitvoer.stukken[i];
        rapporten.push(
          await prisma.pacRapport.create({
            data: {
              sampleItemId: params.id,
              fileName: `${file.name} (${i + 1}/${uitvoer.stukken.length})`,
              fileType: 'image/png',
              fileSize: stuk.bytes,
              filePath: `/uploads/pac/${mapNaam}/${stuk.bestand}`,
              label: label
                ? `${label} ${i + 1}/${uitvoer.stukken.length}`
                : `Schermlezer-voorvertoning ${i + 1}/${uitvoer.stukken.length}`,
            },
          })
        );
      }

      return NextResponse.json({
        stukken: rapporten.length,
        hoogte: uitvoer.hoogte,
        rapporten,
      });
    }

    const rapport = await prisma.pacRapport.create({
      data: {
        sampleItemId: params.id,
        fileName: file.name,
        fileType: file.type || 'image/png',
        fileSize: file.size,
        filePath: `/uploads/pac/${filename}`,
        label,
      },
    });

    return NextResponse.json(rapport);
  } catch (error) {
    console.error('PAC-rapport opslaan mislukt:', error);
    return NextResponse.json({ error: 'Opslaan van het PAC-rapport mislukte' }, { status: 500 });
  }
}

/** Het label bijwerken: welk PAC-scherm dit is. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { rapportId, label } = body ?? {};
    if (!rapportId) {
      return NextResponse.json({ error: 'rapportId ontbreekt' }, { status: 400 });
    }
    const rapport = await prisma.pacRapport.update({
      where: { id: rapportId },
      data: { label: typeof label === 'string' && label.trim() ? label.trim() : null },
    });
    return NextResponse.json(rapport);
  } catch (error) {
    console.error('PAC-label bijwerken mislukt:', error);
    return NextResponse.json({ error: 'Bijwerken mislukte' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rapportId = new URL(request.url).searchParams.get('rapportId');
    if (!rapportId) {
      return NextResponse.json({ error: 'rapportId ontbreekt' }, { status: 400 });
    }

    const rapport = await prisma.pacRapport.findUnique({ where: { id: rapportId } });
    if (!rapport || rapport.sampleItemId !== params.id) {
      return NextResponse.json({ error: 'Rapport niet gevonden' }, { status: 404 });
    }

    const bestand = path.join(process.cwd(), 'public', rapport.filePath.replace(/^\//, ''));
    if (existsSync(bestand)) {
      await unlink(bestand).catch(() => {});
    }
    await prisma.pacRapport.delete({ where: { id: rapportId } });

    // Een stuk van een scrollopname staat in een eigen map. Was dit het laatste,
    // dan moet die map mee -- anders blijft er een lege map met 73 weesbestanden
    // staan die nergens meer aan hangen.
    const map = path.dirname(rapport.filePath);
    if (/\/schermlezer$/.test(map) || /-schermlezer$/.test(map)) {
      const restant = await prisma.pacRapport.count({
        where: { sampleItemId: params.id, filePath: { startsWith: `${map}/` } },
      });
      if (restant === 0) {
        await rm(path.join(process.cwd(), 'public', map.replace(/^\//, '')), {
          recursive: true,
          force: true,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PAC-rapport verwijderen mislukt:', error);
    return NextResponse.json({ error: 'Verwijderen mislukte' }, { status: 500 });
  }
}
