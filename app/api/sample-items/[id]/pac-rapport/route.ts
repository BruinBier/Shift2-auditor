import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
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
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Bestand is groter dan ${MAX_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      );
    }
    if (file.type && !TOEGESTAAN.includes(file.type)) {
      return NextResponse.json(
        { error: `Bestandstype ${file.type} wordt niet ondersteund. Gebruik PDF of een afbeelding.` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pac');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const veiligeNaam = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${params.id}-${Date.now()}-${veiligeNaam}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PAC-rapport verwijderen mislukt:', error);
    return NextResponse.json({ error: 'Verwijderen mislukte' }, { status: 500 });
  }
}
