import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/extra/generate-summary
 * Generate AI summary of test results for creating findings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, url } = body;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results array is required' },
        { status: 400 }
      );
    }

    // Filter only found issues
    const foundIssues = results.filter((r: any) => r.found);

    if (foundIssues.length === 0) {
      return NextResponse.json({
        summary: 'Geen toegankelijkheidsproblemen gevonden! De pagina voldoet aan alle 130+ tests.',
      });
    }

    // Categorize by severity
    const critical = foundIssues.filter((r: any) => r.details?.critical === true);
    const serious = foundIssues.filter((r: any) =>
      r.details?.classification?.includes('serieus') ||
      (!r.details?.critical && !r.details?.informational)
    );
    const informational = foundIssues.filter((r: any) => r.details?.informational === true);

    // Prepare context for AI
    const context = `
Je bent een toegankelijkheidsexpert die een WCAG 2.2 audit uitvoert.
Analyseer de volgende test resultaten en genereer een gestructureerde samenvatting.

URL getest: ${url || 'Niet opgegeven'}
Totaal aantal tests: ${results.length}
Gevonden problemen: ${foundIssues.length}

GEVONDEN ISSUES (gesorteerd op ernst):

KRITIEKE ISSUES (${critical.length}):
${critical.map((r: any, i: number) => `
${i + 1}. ${r.testName} (Test ID: ${r.testId})
   Aantal: ${r.count}
   WCAG Level: ${r.details?.wcagLevel || 'N/A'}
   WCAG Criteria: ${r.details?.wcagCriteria?.join(', ') || 'N/A'}
   Details: ${JSON.stringify(r.details, null, 2)}
`).join('\n')}

SERIEUZE ISSUES (${serious.length}):
${serious.map((r: any, i: number) => `
${i + 1}. ${r.testName} (Test ID: ${r.testId})
   Aantal: ${r.count}
   Details: ${JSON.stringify(r.details, null, 2)}
`).join('\n')}

INFORMATIEF (${informational.length}):
${informational.map((r: any, i: number) => `
${i + 1}. ${r.testName} (Test ID: ${r.testId})
   Aantal: ${r.count}
`).join('\n')}

GENEREER EEN SAMENVATTING IN DIT FORMAAT:

# Toegankelijkheidsaudit Samenvatting

## Overzicht
- Totaal aantal problemen: [aantal]
- Kritiek: [aantal]
- Serieus: [aantal]
- Informatief: [aantal]

## Bevindingen (Prioriteit: Hoog → Laag)

### 1. [Korte titel van bevinding]
**Ernst:** Kritiek / Serieus / Matig
**WCAG:** [criteria nummers]
**Aantal voorkomens:** [aantal]

**Beschrijving:**
[Duidelijke uitleg wat er mis is]

**Impact:**
[Waarom dit een probleem is voor gebruikers]

**Advies:**
[Concrete stappen om het op te lossen]

---

[Herhaal voor elk probleem]

## Prioriteiten voor Oplossing
1. [Meest urgente probleem]
2. [Tweede prioriteit]
3. etc.

BELANGRIJK:
- Groepeer vergelijkbare problemen samen
- Geef concrete, uitvoerbare adviezen
- Schrijf in het Nederlands
- Focus op de impact voor gebruikers
- Prioriteer op basis van WCAG level (A > AA > AAA) en ernst
`;

    console.log('[AI] Generating summary...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een WCAG 2.2 toegankelijkheidsexpert die audit rapporten schrijft in het Nederlands. Je schrijft helder, concreet en actionable.',
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const summary = completion.choices[0]?.message?.content || 'Kon geen samenvatting genereren.';

    console.log('[AI] Summary generated successfully');

    return NextResponse.json({
      summary,
      stats: {
        totalIssues: foundIssues.length,
        critical: critical.length,
        serious: serious.length,
        informational: informational.length,
      },
    });

  } catch (error) {
    console.error('Error generating summary:', error);

    // More detailed error logging
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('OpenAI API Error Response:', (error as any).response?.data);
    }

    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het genereren van de samenvatting',
        details: error instanceof Error ? error.message : 'Unknown error',
        fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined
      },
      { status: 500 }
    );
  }
}