import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const data = await request.json();

    const note = await prisma.projectNote.update({
      where: { id: params.noteId },
      data: {
        content: data.content,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating project note:', error);
    return NextResponse.json(
      { error: 'Failed to update project note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    await prisma.projectNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project note:', error);
    return NextResponse.json(
      { error: 'Failed to delete project note' },
      { status: 500 }
    );
  }
}