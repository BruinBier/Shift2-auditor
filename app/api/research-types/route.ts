import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all research types
export async function GET() {
  try {
    const researchTypes = await prisma.researchType.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(researchTypes);
  } catch (error) {
    console.error('Error fetching research types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research types' },
      { status: 500 }
    );
  }
}

// POST - Create new research type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, version, level, type, description } = body;

    // Validate required fields
    if (!name || !version || !level || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const researchType = await prisma.researchType.create({
      data: {
        name,
        version,
        level,
        type,
        description: description || null,
      },
    });

    return NextResponse.json(researchType, { status: 201 });
  } catch (error) {
    console.error('Error creating research type:', error);
    return NextResponse.json(
      { error: 'Failed to create research type' },
      { status: 500 }
    );
  }
}
