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
    console.log('Generate summary API called');
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
    const prompt = `Je bent een toegankelijkheidsexpert die een managementsamenvatting schrijft voor een website-audit rapport. Op basis van de volgende bevindingen, schrijf een korte managementsamenvatting.

BELANGRIJK:
- Schrijf een beknopte samenvatting voor management (niet-technisch publiek)
- Houd het KORT: maximaal 4-5 zinnen
- Focus op de belangrijkste conclusies en impact
- Noem GEEN specifieke WCAG codes (zoals 1.1.1, 2.4.3, etc.)
- Gebruik NIET het woord "gedocumenteerd"
- Vermeld het totaal aantal bevindingen
- Beschrijf de algemene staat van toegankelijkheid
- Geef een indicatie van de ernst
- Houd het professioneel maar toegankelijk

Bevindingen:
${findingsSummary}

Schrijf nu een korte managementsamenvatting:`;

    // Call OpenAI API (or use mock for testing)
    console.log('Calling OpenAI API...');
    console.log('Findings found:', findings.length);

    let aiSummary = '';

    // TEMPORARY: Mock AI response for testing without credits
    // To use real OpenAI, comment out this block and uncomment the OpenAI call below
    aiSummary = `<p>Dit toegankelijkheidsonderzoek heeft ${findings.length} bevindingen opgeleverd die de toegankelijkheid van de website beïnvloeden. De bevindingen betreffen voornamelijk de interactie met formulieren, navigatie-elementen en de leesbaarheid van content. Hoewel de basis van de website degelijk is opgezet, vraagt een aantal zaken aanpassing om volledig aan de toegankelijkheidsrichtlijnen te voldoen. Met gerichte verbeteringen kan de website voor alle gebruikers beter toegankelijk worden gemaakt.</p>`;

    /*
    // REAL OpenAI CALL (uncomment when you have credits)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in webtoegankelijkheid (WCAG) die professionele rapporten schrijft voor management. Je schrijft in het Nederlands, helder en bondig.',
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
    console.error('Error generating AI summary:');
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
      { error: 'Er ging iets mis bij het genereren van de samenvatting: ' + (error?.message || 'Onbekende fout') },
      { status: 500 }
    );
  }
}