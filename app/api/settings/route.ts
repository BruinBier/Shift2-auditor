import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings?key=default_user_agents
 * Fetches a setting by key
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Updates a setting by key
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}