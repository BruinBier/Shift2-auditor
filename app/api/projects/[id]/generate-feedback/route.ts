import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Generate feedback API called');
    const params = await context.params;
    const projectId = params.id;
    console.log('Project ID:', projectId);

    // Fetch all findings for this project
    const findings = await prisma.finding.findMany({
      where: { projectId },
      include: {
        wcagCriterion: true,
        occurrences: {
          include: {
            sampleItem: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (findings.length === 0) {
      return NextResponse.json(
        { error: 'Geen bevindingen gevonden voor dit project.' },
        { status: 400 }
      );
    }

    // Prepare findings summary for AI
    const findingsSummary = findings.map((finding, index) => {
      const criterionInfo = finding.wcagCriterion
        ? `${finding.wcagCriterion.code} - ${finding.wcagCriterion.title}`
        : 'Onbekend criterium';

      return `
${index + 1}. ${criterionInfo}
   Status: ${finding.status === 'open' ? 'Afgekeurd' : finding.status === 'resolved' ? 'Opgelost' : 'Onbekend'}
   Beschrijving: ${finding.description || 'Geen beschrijving'}
   Advies: ${finding.advice || 'Geen advies'}
   Impact: ${finding.impact !== null ? finding.impact : 'Niet gespecificeerd'}
   Verantwoordelijkheid: ${finding.responsibility !== null ? finding.responsibility : 'Niet gespecificeerd'}
   Aantal voorkomens: ${finding.occurrences.length}
      `.trim();
    }).join('\n\n');

    // Create AI prompt
    const prompt = `Je bent een toegankelijkheidsexpert die een rapport schrijft over een website-audit. Op basis van de volgende bevindingen, schrijf een korte, professionele samenvatting van de belangrijkste toegankelijkheidsproblemen.

BELANGRIJK:
- Schrijf ALLEEN de samenvatting van de bevindingen zelf
- Begin NIET met de vaste introductietekst (die wordt al automatisch toegevoegd)
- Houd het KORT: maximaal 3-4 zinnen in één alinea
- Gebruik lopende tekst, geen bulletpoints
- Noem GEEN specifieke WCAG codes (zoals 1.1.1, 2.4.3, etc.)
- Gebruik NIET het woord "gedocumenteerd"
- Groepeer gerelateerde problemen in algemene categorieën
- Houd het professioneel en constructief

Bevindingen:
${findingsSummary}

Schrijf nu een korte professionele samenvatting:`;

    // Call OpenAI API (or use mock for testing)
    console.log('Calling OpenAI API...');
    console.log('Findings found:', findings.length);

    let aiSummary = '';

    // TEMPORARY: Mock AI response for testing without credits
    // To use real OpenAI, comment out this block and uncomment the OpenAI call below
    aiSummary = `Bij het onderzoek zijn ${findings.length} bevindingen geconstateerd die aandacht vragen. De problemen concentreren zich vooral rond de toegankelijkheid van interactieve elementen, tekstalternatieven en de structuur van content. Deze issues hebben directe invloed op de gebruikservaring van mensen met een beperking. De meeste geconstateerde problemen zijn relatief eenvoudig op te lossen met gerichte aanpassingen in de code en content.`;

    /*
    // REAL OpenAI CALL (uncomment when you have credits)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in webtoegankelijkheid (WCAG) die professionele rapporten schrijft. Je schrijft in het Nederlands, helder en bondig.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    console.log('OpenAI API call successful');
    aiSummary = completion.choices[0]?.message?.content || '';
    */

    if (!aiSummary) {
      return NextResponse.json(
        { error: 'AI heeft geen samenvatting gegenereerd.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ aiSummary });
  } catch (error: any) {
    console.error('Error generating AI feedback:');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error status:', error?.status);
    console.error('Full error:', JSON.stringify(error, null, 2));

    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota overschreden. Controleer je OpenAI account.' },
        { status: 402 }
      );
    }

    if (error?.status === 401 || error?.message?.includes('Incorrect API key')) {
      return NextResponse.json(
        { error: 'Ongeldige OpenAI API key. Controleer je .env bestand.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van de feedback: ' + (error?.message || 'Onbekende fout') },
      { status: 500 }
    );
  }
}