import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get team info
export async function GET() {
  try {
    // Get the first (and only) team record
    let team = await prisma.team.findFirst();

    // If no team exists, create default one
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: 'Shift2',
          language: 'Nederlands',
          address: 'Rembrandt 15, 2311 GN Capelle a/d IJssel',
          email: 'contact@shift2.nl',
          phone: '088 770 8811',
          website: 'https://www.shift2.nl/',
          about: 'Shift2 helpt lokale overheden tijdens bij innovaties in de aan waar digitale dienstverlening blijft van het super eenvoudig. Wij maken het super eenvoudig toegankelijk, waarbij digitaal begrijpelijk en een vast onderdeel van onze dienstverlening.',
          logoUrl: '/shift2-logo.svg',
          useCardanAI: true,
        },
      });
    }

    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// PUT - Update team info
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the first team or create if doesn't exist
    let team = await prisma.team.findFirst();

    if (!team) {
      // Create new team
      team = await prisma.team.create({
        data: {
          name: body.name || 'Shift2',
          language: body.language || 'Nederlands',
          address: body.address,
          email: body.email,
          phone: body.phone,
          website: body.website,
          about: body.about,
          logoUrl: body.logoUrl,
          useCardanAI: body.useCardanAI ?? true,
        },
      });
    } else {
      // Update existing team
      team = await prisma.team.update({
        where: { id: team.id },
        data: {
          name: body.name,
          language: body.language,
          address: body.address,
          email: body.email,
          phone: body.phone,
          website: body.website,
          about: body.about,
          logoUrl: body.logoUrl,
          useCardanAI: body.useCardanAI,
        },
      });
    }

    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}