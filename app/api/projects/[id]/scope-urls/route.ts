import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

/**
 * Fetch the title from a URL
 */
async function fetchTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Shift2-Auditor/1.0 (Title Fetcher)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = $('title').text().trim() || null;

    // Clean up title: remove trailing "Toegankelijkheid" or "Toegankelijk"
    if (title) {
      title = title.replace(/Toegankelijkheid$/gi, '');
      title = title.replace(/Toegankelijk$/gi, '');
      // Remove duplicate words at the end
      title = title.replace(/(\w{3,})\1+$/gi, '$1');
      // Remove trailing whitespace and periods
      title = title.trim().replace(/\s*\.\s*$/g, '');
      // If nothing left, set to null
      if (!title) title = null;
    }

    return title;
  } catch (error) {
    console.error('Error fetching title:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('Creating scope URL:', { projectId: params.id, ...body });

    // If title is empty or not provided, fetch it
    let title = body.title;
    if (!title || title.trim() === '') {
      console.log('Title is empty, fetching from URL...');
      title = await fetchTitle(body.url);
      console.log('Fetched title:', title);
    }

    const scopeUrl = await prisma.projectScopeUrl.create({
      data: {
        projectId: params.id,
        url: body.url,
        title: title || '',
        crawlerType: body.crawlerType,
        inScope: body.inScope ?? true,
        note: body.note,
      },
    });

    console.log('Scope URL created:', scopeUrl);
    return NextResponse.json(scopeUrl, { status: 201 });
  } catch (error) {
    console.error('Error creating scope URL:', error);
    return NextResponse.json({
      error: 'Failed to create scope URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
