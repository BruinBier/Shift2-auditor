import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

/**
 * Gespreksverslag uit het transcript, gemaakt door de tool zelf.
 *
 * De onderzoeker plakt het Teams-transcript in "Transcript scopegesprek" (of "Transcript
 * klantgesprek" bij een extern bureau) en drukt op "Maak gespreksverslag". Deze route leest
 * het transcript en de open bespreekpunten, laat de AI een kort verslag schrijven volgens
 * docs/werkwijze/gespreksverslag.md, zet dat verslag als notitie bij het onderzoek en geeft
 * per bespreekpunt een voorgestelde uitkomst terug. Die voorstellen worden hier NIET
 * weggeschreven: de onderzoeker neemt ze per punt over, en pas dan is het punt afgevinkt.
 *
 * De werkwijze staat in dat markdownbestand en nergens anders, zodat de tool zonder Claude
 * Code werkt en Claude Code hetzelfde bestand volgt als het verslag met de hand wordt
 * gevraagd. Een tweede kopie van de regels in deze code zou een tweede waarheid worden.
 */

const WERKWIJZE = path.join(process.cwd(), 'docs', 'werkwijze', 'gespreksverslag.md');

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Er is geen OpenAI-sleutel ingesteld (OPENAI_API_KEY in .env).' },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        kenmerk: true,
        title: true,
        commissionedBy: true,
        researcherName: true,
        isExternalProject: true,
        externalBureau: true,
        scopeCallTranscript: true,
        clientProject: { select: { contactnaam: true } },
        bespreekpunten: { where: { besprokenOp: null }, orderBy: { createdAt: 'asc' }, select: { id: true, tekst: true } },
      },
    });
    if (!project) return NextResponse.json({ error: 'Onderzoek niet gevonden' }, { status: 404 });

    const transcript = project.scopeCallTranscript?.trim();
    if (!transcript) {
      return NextResponse.json(
        { error: 'Er staat nog geen transcript bij dit onderzoek. Plak het eerst op het tabblad Details.' },
        { status: 400 },
      );
    }

    const werkwijze = await readFile(WERKWIJZE, 'utf-8');
    const punten = project.bespreekpunten;
    const puntenTekst = punten.length
      ? punten.map((p, i) => `${i + 1}. [id ${p.id}] ${p.tekst}`).join('\n')
      : '(geen open bespreekpunten)';

    const context = [
      `Kenmerk: ${project.kenmerk ?? '-'}`,
      `Website: ${project.title.replace(/^website\s+/i, '')}`,
      `Opdrachtgever: ${project.commissionedBy ?? '-'}`,
      `Contactpersoon bij de klant: ${project.clientProject?.contactnaam ?? '-'}`,
      `Onderzoeker van Shift2: ${project.researcherName ?? '-'}`,
      project.isExternalProject
        ? `Het onderzoek wordt uitgevoerd door een extern bureau: ${project.externalBureau ?? 'onbekend'}.`
        : 'Shift2 voert het onderzoek zelf uit.',
      `Datum van vandaag: ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    ].join('\n');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `Je schrijft gespreksverslagen voor Shift2, een bureau voor toegankelijkheidsonderzoek. Volg de werkwijze hieronder precies.\n\n${werkwijze}\n\n` +
            'Antwoord als JSON met precies deze vorm: {"verslag": "<markdown>", "uitkomsten": [{"id": "<id van het bespreekpunt>", "aanBodGekomen": true|false, "uitkomst": "<tekst, leeg als niet aan bod gekomen>"}]}. Neem elk open bespreekpunt precies één keer op, met zijn id.',
        },
        {
          role: 'user',
          content: `Gegevens over het onderzoek:\n${context}\n\nOpen bespreekpunten:\n${puntenTekst}\n\nTranscript:\n${transcript}`,
        },
      ],
    });

    const ruw = completion.choices[0]?.message?.content ?? '';
    let uitvoer: { verslag?: string; uitkomsten?: Array<{ id?: string; aanBodGekomen?: boolean; uitkomst?: string }> };
    try {
      uitvoer = JSON.parse(ruw);
    } catch {
      return NextResponse.json({ error: 'De AI gaf geen leesbaar antwoord terug.' }, { status: 502 });
    }
    const verslag = uitvoer.verslag?.trim();
    if (!verslag) return NextResponse.json({ error: 'De AI heeft geen verslag gemaakt.' }, { status: 502 });

    // Alleen voorstellen voor punten die echt open staan; een id dat de AI verzint valt af.
    const bekend = new Set(punten.map((p) => p.id));
    const voorstellen = (uitvoer.uitkomsten ?? [])
      .filter((u) => u.id && bekend.has(u.id))
      .map((u) => ({
        id: u.id as string,
        aanBodGekomen: Boolean(u.aanBodGekomen) && Boolean(u.uitkomst?.trim()),
        uitkomst: u.uitkomst?.trim() ?? '',
      }));

    const notitie = await prisma.projectNote.create({
      data: { projectId: params.id, authorName: 'AI-verslag, nog na te kijken', content: verslag },
    });

    return NextResponse.json({ notitie, voorstellen });
  } catch (error: any) {
    console.error('Error generating gespreksverslag:', error?.message ?? error);
    if (error?.status === 401) {
      return NextResponse.json({ error: 'De OpenAI-sleutel is ongeldig. Controleer OPENAI_API_KEY in .env.' }, { status: 401 });
    }
    if (error?.status === 429 || error?.error?.type === 'insufficient_quota') {
      return NextResponse.json({ error: 'Het OpenAI-tegoed is op of de limiet is bereikt.' }, { status: 402 });
    }
    return NextResponse.json({ error: `Het maken van het verslag is niet gelukt: ${error?.message ?? 'onbekende fout'}` }, { status: 500 });
  }
}
