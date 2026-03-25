import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { newName, findText, replaceText } = await request.json();

    if (!newName || typeof newName !== 'string' || newName.trim() === '') {
      return NextResponse.json(
        { error: 'Nieuwe naam is verplicht' },
        { status: 400 }
      );
    }

    // Validate find/replace parameters
    if ((findText && !replaceText) || (!findText && replaceText)) {
      return NextResponse.json(
        { error: 'Als je tekst wilt vervangen, vul dan zowel findText als replaceText in' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingType = await prisma.researchType.findUnique({
      where: { name: newName },
    });

    if (existingType) {
      return NextResponse.json(
        { error: 'Een onderzoekstype met deze naam bestaat al' },
        { status: 409 }
      );
    }

    // Fetch the original research type with all its criteria
    const originalType = await prisma.researchType.findUnique({
      where: { id },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    if (!originalType) {
      return NextResponse.json(
        { error: 'Onderzoekstype niet gevonden' },
        { status: 404 }
      );
    }

    // Helper function to replace text globally (case-insensitive)
    const replaceAllText = (text: string | null, find: string, replace: string): string | null => {
      if (!text) return text;
      const regex = new RegExp(find, 'gi'); // g = global, i = case-insensitive
      return text.replace(regex, replace);
    };

    // Apply find/replace if provided
    let description = originalType.description;
    let reportIntro = originalType.reportIntro;
    let reportIntroPdf = originalType.reportIntroPdf;

    if (findText && replaceText) {
      description = replaceAllText(description, findText, replaceText) || description;
      reportIntro = replaceAllText(reportIntro, findText, replaceText);
      reportIntroPdf = replaceAllText(reportIntroPdf, findText, replaceText);
    }

    // Create the duplicate with all fields except id, name, createdAt, updatedAt
    const duplicatedType = await prisma.researchType.create({
      data: {
        name: newName,
        version: originalType.version,
        level: originalType.level,
        type: originalType.type,
        description: description,
        reportIntroHeader: originalType.reportIntroHeader,
        reportIntro: reportIntro,
        reportIntroPdf: reportIntroPdf,
        summaryTemplate: originalType.summaryTemplate,
        criteria: {
          create: originalType.criteria.map((criterion) => ({
            wcagCriterionId: criterion.wcagCriterionId,
          })),
        },
      },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    // Transform response to match frontend expectations
    const response = {
      ...duplicatedType,
      selectedCriteria: duplicatedType.criteria.map(c => c.wcagCriterionId),
      criteria: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error duplicating research type:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het dupliceren van het onderzoekstype' },
      { status: 500 }
    );
  }
}