import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.projectNote.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching project notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const note = await prisma.projectNote.create({
      data: {
        projectId: params.id,
        authorName: data.authorName,
        content: data.content,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating project note:', error);
    return NextResponse.json(
      { error: 'Failed to create project note' },
      { status: 500 }
    );
  }
}