import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateFindingTextRequest {
  testId: string;
  testName: string;
  testDetails: any;
  count: number;
}

/**
 * POST /api/sample-items/[id]/generate-finding-text
 * Generates finding description and advice using OpenAI GPT-4o-mini
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: GenerateFindingTextRequest = await request.json();
    const { testId, testName, testDetails, count } = body;

    if (!testName) {
      return NextResponse.json(
        { error: 'testName is required' },
        { status: 400 }
      );
    }

    // Create AI prompt for generating finding text
    const detailsString = testDetails ? JSON.stringify(testDetails, null, 2) : 'Geen specifieke details beschikbaar';

    const prompt = `Je bent een toegankelijkheidsexpert die bevindingen schrijft voor WCAG 2.2 audits.

CONTEXT:
Test: ${testName}
Test ID: ${testId}
Aantal gevonden issues: ${count}
Details: ${detailsString}

OPDRACHT:
Schrijf een Nederlandse beschrijving en advies voor deze toegankelijkheidsbevinding.

BELANGRIJK:
- Schrijf in professionele maar begrijpelijke taal
- Focus op de impact voor gebruikers
- Geef concrete, praktische adviezen
- Gebruik maximaal 3-4 zinnen voor de beschrijving
- Gebruik maximaal 2-3 zinnen voor het advies
- Vermeld GEEN WCAG codes (zoals 1.1.1, 2.4.3, etc.)
- Gebruik NIET technische jargon zoals "DOM", "HTML tags" tenzij noodzakelijk
- Schrijf vanuit het perspectief van "er is een probleem dat opgelost moet worden"

FORMAT:
Geef je antwoord ALLEEN in dit JSON formaat (geen extra tekst):
{
  "description": "Hier komt de beschrijving van het probleem en de impact op gebruikers",
  "advice": "Hier komt het concrete advies om het probleem op te lossen"
}`;

    console.log('[AI] Calling OpenAI for finding text generation...');
    console.log('[AI] Test:', testName);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in webtoegankelijkheid (WCAG) die professionele bevindingen schrijft voor audit rapporten. Je schrijft in het Nederlands, helder en bondig. Je output is altijd valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    console.log('[AI] OpenAI call successful');

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI heeft geen response gegenereerd' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error('[AI] Failed to parse AI response as JSON:', aiResponse);
      return NextResponse.json(
        { error: 'AI response was not valid JSON' },
        { status: 500 }
      );
    }

    const { description, advice } = parsedResponse;

    if (!description || !advice) {
      return NextResponse.json(
        { error: 'AI response missing description or advice fields' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description,
      advice,
    });

  } catch (error: any) {
    console.error('[AI] Error generating finding text:');
    console.error('[AI] Error type:', error?.constructor?.name);
    console.error('[AI] Error message:', error?.message);
    console.error('[AI] Error status:', error?.status);

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
      { error: 'Er ging iets mis bij het genereren van de tekst: ' + (error?.message || 'Onbekende fout') },
      { status: 500 }
    );
  }
}
