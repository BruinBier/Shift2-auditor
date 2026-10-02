import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { Change, ExcelError, Owner, StoredProject, snapshot } from './project-excel';

const globalKey = globalThis as typeof globalThis & { projectExcelKey?: Buffer };
const secret = process.env.PROJECT_EXCEL_SECRET || (globalKey.projectExcelKey ??= randomBytes(32));
type PreviewToken = { expires: number; baseline: string; changes: Change[] };
export function signPreview(baseline: string, changes: Change[], now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ expires: now + 15 * 60 * 1000, baseline, changes })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}
export function verifyPreview(token: string, now = Date.now()): PreviewToken {
  if (typeof token !== 'string' || token.length > 2 * 1024 * 1024) throw new ExcelError(['Het controlevoorbeeld is ongeldig. Upload opnieuw.']);
  const [payload, signature, extra] = token.split('.');
  const expected = createHmac('sha256', secret).update(payload || '').digest();
  const supplied = Buffer.from(signature || '', 'base64url');
  if (extra || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ExcelError(['Het controlevoorbeeld is ongeldig of de server is herstart. Upload opnieuw.']);
  let result: PreviewToken;
  try { result = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { throw new ExcelError(['Het controlevoorbeeld is ongeldig. Upload opnieuw.']); }
  if (result.expires <= now) throw new ExcelError(['Het controlevoorbeeld is verlopen (15 minuten). Upload opnieuw.'], 409);
  return result;
}

export const projectSelect = { id: true, name: true, opdrachtgeverId: true, projectnummer: true, cardanKenmerk: true, updatedAt: true } as const;
export const ownerSelect = { id: true, naam: true, kenmerk: true } as const;
export async function readSnapshot(db: Pick<Prisma.TransactionClient, 'clientProject' | 'opdrachtgever'>): Promise<{ projects: StoredProject[]; owners: Owner[] }> {
  const projects = await db.clientProject.findMany({ select: projectSelect, orderBy: { id: 'asc' } });
  const owners = await db.opdrachtgever.findMany({ select: ownerSelect, orderBy: { id: 'asc' } });
  return { projects, owners };
}
export async function applyPreview(db: PrismaClient, token: string) {
  const preview = verifyPreview(token);
  try {
    return await db.$transaction(async tx => {
      const { projects, owners } = await readSnapshot(tx);
      if (snapshot(projects, owners) !== preview.baseline) throw new ExcelError(['Projecten of opdrachtgevers zijn sinds het controlevoorbeeld gewijzigd. Niets is opgeslagen. Upload opnieuw.'], 409);
      let added = 0, changed = 0;
      for (const change of preview.changes) {
        if (change.kind === 'toegevoegd') {
          await tx.clientProject.create({ data: { id: change.id, ...change.after } });
          added++;
        } else if (change.kind === 'gewijzigd') {
          await tx.clientProject.update({ where: { id: change.id }, data: change.after });
          changed++;
        }
      }
      return { added, changed, unchanged: preview.changes.length - added - changed };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  } catch (error) {
    if (error instanceof ExcelError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002', 'P2025', 'P2003'].includes(error.code)) throw new ExcelError(['Er is een conflict tijdens het opslaan. Niets is opgeslagen. Upload opnieuw voor een nieuw controlevoorbeeld.'], 409);
    throw error;
  }
}
