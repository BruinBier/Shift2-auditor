import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeBase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'screenshot';
}

function extensionFor(type: string, originalName: string): string {
  const fromName = originalName.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (type === 'image/png') return 'png';
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  return 'png';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const subdirRaw = (formData.get('subdir') as string | null) || 'uploads';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'file is verplicht' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Bestand is te groot (max 10 MB)' }, { status: 400 });
    }

    const type = file.type || 'image/png';
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: `Bestandstype niet toegestaan: ${type}` }, { status: 400 });
    }

    const originalName = (file as File).name || 'screenshot';
    const ext = extensionFor(type, originalName);
    const base = sanitizeBase(originalName);
    const filename = `${base}-${randomUUID().slice(0, 8)}.${ext}`;

    const safeSubdir = subdirRaw
      .replace(/\\/g, '/')
      .split('/')
      .filter((part) => part && part !== '..' && /^[a-z0-9_-]+$/i.test(part))
      .join('/');
    const subdir = safeSubdir || 'uploads';

    const targetDir = path.join(process.cwd(), 'public', 'cms-paragrafen', subdir);
    await mkdir(targetDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(targetDir, filename), buffer);

    const publicPath = `/cms-paragrafen/${subdir}/${filename}`;
    return NextResponse.json({ path: publicPath, filename });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 });
  }
}
