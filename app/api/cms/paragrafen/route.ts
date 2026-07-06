import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const paragrafen = await prisma.cmsParagraph.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        helpteksten: { orderBy: [{ order: 'asc' }, { title: 'asc' }] },
      },
    });
    return NextResponse.json(paragrafen);
  } catch (error) {
    console.error('Failed to fetch CMS paragrafen:', error);
    return NextResponse.json({ error: 'Failed to fetch CMS paragrafen' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'name is verplicht' }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugify(body.name);

    const paragraph = await prisma.cmsParagraph.create({
      data: {
        name: body.name,
        slug,
        description: body.description?.trim() || null,
        order: typeof body.order === 'number' ? body.order : 0,
      },
      include: { helpteksten: true },
    });

    return NextResponse.json(paragraph, { status: 201 });
  } catch (error) {
    console.error('Failed to create CMS paragraph:', error);
    return NextResponse.json({ error: 'Failed to create CMS paragraph' }, { status: 500 });
  }
}
