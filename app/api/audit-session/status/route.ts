import { NextResponse } from 'next/server';

const DEBUG_URL = process.env.AUDIT_CLI_CHROME_DEBUG_URL || 'http://localhost:9222';

export const dynamic = 'force-dynamic';

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${DEBUG_URL}/json/version`, { signal: controller.signal });
    if (!res.ok) {
      return NextResponse.json({ running: false });
    }
    const info = (await res.json()) as { Browser?: string; 'User-Agent'?: string };
    return NextResponse.json({
      running: true,
      browser: info.Browser ?? null,
      userAgent: info['User-Agent'] ?? null,
    });
  } catch {
    return NextResponse.json({ running: false });
  } finally {
    clearTimeout(timeout);
  }
}
