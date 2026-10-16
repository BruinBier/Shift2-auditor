/**
 * Meet in een open pagina of de JavaScript draait. Het oordeel zelf staat in
 * `lib/javascript-leeft.ts`; hier alleen het tellen, via de DevTools-verbinding.
 */

import type { Page } from 'puppeteer';
import {
  beoordeelJavascript,
  JAVASCRIPT_WAARNEMING_SCRIPT,
  type JavascriptOordeel,
  type JavascriptWaarneming,
} from '../../lib/javascript-leeft';

/**
 * Alleen afhandelaars voor bediening tellen. Een teller of een cookiescript hangt vaak een
 * `scroll`, `resize` of `beforeunload` aan window; dat zegt niets over een knop die werkt.
 */
const BEDIENING = new Set([
  'click', 'dblclick', 'auxclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
  'touchstart', 'touchend', 'keydown', 'keyup', 'keypress', 'input', 'change', 'submit',
  'focus', 'focusin', 'focusout', 'blur', 'mouseover', 'mouseenter', 'pointerover', 'toggle',
]);

async function telAfhandelaars(page: Page): Promise<JavascriptWaarneming['afhandelaars']> {
  const cdp = await ((page as any).createCDPSession
    ? (page as any).createCDPSession()
    : page.target().createCDPSession());
  try {
    const tel = async (objectId: string) => {
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId, depth: 0 });
      return (listeners as { type: string }[]).filter((l) => BEDIENING.has(l.type)).length;
    };
    const object = async (expressie: string) =>
      (await cdp.send('Runtime.evaluate', { expression: expressie })).result.objectId as string | undefined;

    const win = await object('window');
    const doc = await object('document');
    let elementen = 0;
    const lijst = await object('window.__auditJsBediening || []');
    if (lijst) {
      const { result } = await cdp.send('Runtime.getProperties', { objectId: lijst, ownProperties: true });
      for (const p of result as { name: string; value?: { objectId?: string } }[]) {
        if (!/^\d+$/.test(p.name) || !p.value?.objectId) continue;
        elementen += await tel(p.value.objectId);
      }
    }
    return {
      elementen,
      document: doc ? await tel(doc) : 0,
      window: win ? await tel(win) : 0,
    };
  } catch {
    return null;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

export async function meetJavascript(page: Page): Promise<JavascriptOordeel & { waarneming: JavascriptWaarneming }> {
  const basis = (await page.evaluate(JAVASCRIPT_WAARNEMING_SCRIPT)) as Omit<JavascriptWaarneming, 'afhandelaars'>;
  // Een draaiend framework is genoeg bewijs; dan hoeven we niets te tellen.
  const afhandelaars = basis.actiefFramework ? null : await telAfhandelaars(page);
  await page.evaluate('delete window.__auditJsBediening').catch(() => {});
  const waarneming = { ...basis, afhandelaars };
  return { ...beoordeelJavascript(waarneming), waarneming };
}
