import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExcelError, exportProjects, previewProjects, readProjects, snapshot } from '@/lib/project-excel';
import { applyPreview, readSnapshot, signPreview } from '@/lib/project-excel-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function failure(error: unknown) {
  if (error instanceof ExcelError) return NextResponse.json({ error: error.message, errors: error.errors }, { status: error.status });
  console.error('Project Excel workflow failed:', error);
  return NextResponse.json({ error: 'De Excelbewerking is mislukt. Er zijn geen wijzigingen opgeslagen. Probeer opnieuw.' }, { status: 500 });
}
export async function GET() {
  try {
    const { projects, owners } = await prisma.$transaction(tx => readSnapshot(tx), { isolationLevel: 'RepeatableRead' });
    const buffer = await exportProjects(projects, owners);
    return new NextResponse(new Uint8Array(buffer), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="shift2-projecten.xlsx"',
      'Cache-Control': 'no-store',
    } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    // Local application has no account system. Require same-origin browser mutations.
    const expectedOrigin = new URL(`${new URL(request.url).protocol}//${request.headers.get('host') || new URL(request.url).host}`).origin;
    if (request.headers.get('origin') !== expectedOrigin) throw new ExcelError(['Upload vanuit Shift2 Auditor zelf. Een externe website mag deze import niet uitvoeren.'], 403);
    const contentType = request.headers.get('content-type') || '';
    const maximum = contentType.startsWith('application/json') ? 2 * 1024 * 1024 + 100 : 6 * 1024 * 1024;
    const reader = request.body?.getReader();
    if (!reader) throw new ExcelError(['Het importverzoek is leeg.']);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new ExcelError(['Het importverzoek is te groot. Gebruik maximaal 5 MB.'], 413); }
      chunks.push(value);
    }
    const bodyRequest = new Request(request.url, { method: 'POST', headers: request.headers, body: Buffer.concat(chunks) });
    if (contentType.startsWith('application/json')) {
      const body = await bodyRequest.text();
      if (body.length > 2 * 1024 * 1024 + 100) throw new ExcelError(['Het controlevoorbeeld is te groot.']);
      let data;
      try { data = JSON.parse(body); } catch { throw new ExcelError(['Ongeldig importverzoek.']); }
      if (!data || data.action !== 'apply' || typeof data.token !== 'string') throw new ExcelError(['Een geldig controlevoorbeeld is verplicht. Upload eerst het Excelbestand.']);
      return NextResponse.json(await applyPreview(prisma, data.token));
    }
    if (!contentType.startsWith('multipart/form-data')) throw new ExcelError(['Upload een Excelbestand (.xlsx).']);
    const length = Number(request.headers.get('content-length'));
    if (length > 6 * 1024 * 1024) throw new ExcelError(['Gebruik een Excelbestand van maximaal 5 MB.'], 413);
    const form = await bodyRequest.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || !file.name.toLowerCase().endsWith('.xlsx') || file.size > 5 * 1024 * 1024) throw new ExcelError(['Gebruik een .xlsx-bestand van maximaal 5 MB.']);
    const rows = await readProjects(Buffer.from(await file.arrayBuffer()));
    const { projects, owners } = await prisma.$transaction(tx => readSnapshot(tx), { isolationLevel: 'RepeatableRead' });
    const changes = previewProjects(rows, projects, owners);
    return NextResponse.json({ changes, owners, token: signPreview(snapshot(projects, owners), changes) });
  } catch (error) { return failure(error); }
}
