import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update project status to "Gereed"
    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'Gereed',
      },
    });

    return NextResponse.json({
      success: true,
      project,
      message: 'Onderzoek succesvol afgerond'
    }, { status: 200 });
  } catch (error) {
    console.error('Error finalizing project:', error);
    return NextResponse.json({
      error: 'Failed to finalize project'
    }, { status: 500 });
  }
}