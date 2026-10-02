import { NextResponse } from 'next/server';
import { controleer, leesWerkmap } from '@/lib/projecten-excel';
import { haalStandOp, leesUpload } from '@/lib/projecten-excel-stand';

export const dynamic = 'force-dynamic';

/**
 * Leest een Excelbestand in en geeft het controleoverzicht terug. Wijzigt niets:
 * toepassen gaat via ../toepassen, na bevestiging.
 */
export async function POST(request: Request) {
  try {
    const upload = await leesUpload(request);
    if (!upload.ok) return NextResponse.json({ error: upload.fout }, { status: 400 });

    const gelezen = await leesWerkmap(upload.buffer);
    if (!gelezen.ok) {
      return NextResponse.json({
        nieuw: [],
        gewijzigd: [],
        ongewijzigd: [],
        nietInBestand: [],
        fouten: gelezen.fouten,
        waarschuwingen: [],
        vingerafdruk: '',
      });
    }
    const { projecten, opdrachtgevers } = await haalStandOp();
    return NextResponse.json(controleer(gelezen, projecten, opdrachtgevers));
  } catch (error) {
    console.error('Controle van Excel-import mislukt:', error);
    return NextResponse.json({ error: 'Het bestand kon niet worden gecontroleerd. Probeer het opnieuw.' }, { status: 500 });
  }
}
