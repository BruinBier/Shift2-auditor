import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[fetch-title] Fetching URL:', url);

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[fetch-title] Response status:', response.status);

      if (!response.ok) {
        console.error('[fetch-title] Failed to fetch URL:', response.status, response.statusText);
        return NextResponse.json({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`
        }, { status: 500 });
      }

      const html = await response.text();
      console.log('[fetch-title] HTML length:', html.length);

      // Extract title using regex
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      console.log('[fetch-title] Extracted title:', title || '(empty)');

      return NextResponse.json({ title });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('[fetch-title] Request timeout for URL:', url);
        return NextResponse.json({ error: 'Request timeout' }, { status: 500 });
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error('[fetch-title] Error:', error.message, error.stack);
    return NextResponse.json({
      error: `Failed to fetch title: ${error.message}`
    }, { status: 500 });
  }
}
