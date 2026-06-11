/**
 * Browser-based crawler using Puppeteer
 * This crawler executes JavaScript and can detect dynamically loaded content
 */

import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;

/**
 * Try to automatically accept cookie consent dialogs
 * Checks for common cookie consent button patterns
 */
async function handleCookieConsent(page: Page): Promise<void> {
  // Try to find and click cookie consent button by text content
  try {
    // Wait a moment for cookie banner to appear
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`[BROWSER] Looking for cookie consent dialog...`);

    // Step 1: Try to find and click the cookie modal button first (to open the modal)
    const openModalButtons = await page.$$('button');
    for (const button of openModalButtons) {
      const text = await button.evaluate(el => el.textContent?.trim() || '');
      const className = await button.evaluate(el => el.className || '');

      // Check if this is a button that opens the cookie modal
      if (
        className.includes('OpenCookieModalButton') ||
        text.includes('Cookie-instellingen') ||
        text.includes('Cookie settings')
      ) {
        console.log(`[BROWSER] Opening cookie modal first...`);
        await button.evaluate((el: Element) => (el as HTMLElement).click());
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      }
    }

    // Step 2: Look for checkboxes for "external_media" and enable them
    try {
      const externalMediaCheckbox = await page.$('#external_media');
      if (externalMediaCheckbox) {
        const isChecked = await externalMediaCheckbox.evaluate((el: Element) => (el as HTMLInputElement).checked);
        if (!isChecked) {
          console.log(`[BROWSER] Enabling external media checkbox...`);
          await externalMediaCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Also enable maps checkbox
      const mapsCheckbox = await page.$('#maps');
      if (mapsCheckbox) {
        const isChecked = await mapsCheckbox.evaluate((el: Element) => (el as HTMLInputElement).checked);
        if (!isChecked) {
          console.log(`[BROWSER] Enabling maps checkbox...`);
          await mapsCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      console.log(`[BROWSER] Could not toggle checkboxes:`, e);
    }

    // Step 3: Try to find "Accepteer alle cookies" or "Keuze opslaan" button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.trim() || '');
      const className = await button.evaluate(el => el.className || '');

      if (
        text.includes('Accepteer alle cookies') ||
        text.includes('Accept all cookies') ||
        text.includes('Accepteer alle') ||
        text.includes('Accept all') ||
        text.includes('Keuze opslaan') ||
        (className.includes('CookieModal') && className.includes('button'))
      ) {
        console.log(`[BROWSER] Found cookie consent button: "${text}"`);
        // Click using JavaScript instead of Puppeteer's click to avoid visibility issues
        await button.evaluate((el: Element) => (el as HTMLElement).click());
        console.log(`[BROWSER] Clicked cookie consent button`);
        // Wait for the dialog to close and content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        return;
      }
    }

    // Fallback: try class-based selectors
    const cookieButtonSelectors = [
      'button[class*="CookieBanner"][class*="button"]',
      'button[class*="cookie"][class*="accept"]',
      'button[class*="Cookie"][class*="Accept"]',
      'button.CookieModal_button__EBf5n',
    ];

    for (const selector of cookieButtonSelectors) {
      const button = await page.$(selector);
      if (button) {
        const text = await button.evaluate(el => el.textContent?.trim() || '');
        if (text.includes('Accepteer') || text.includes('Accept') || text.includes('opslaan')) {
          console.log(`[BROWSER] Found cookie consent button via selector: ${selector}`);
          await button.click();
          console.log(`[BROWSER] Clicked cookie consent button`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return;
        }
      }
    }

    console.log(`[BROWSER] No cookie consent dialog found or already accepted`);
  } catch (error) {
    console.log(`[BROWSER] Error handling cookie consent:`, error);
  }
}

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    console.log('[BROWSER] Launching headless browser...');
    try {
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        timeout: 60000, // 60 seconds timeout for browser launch
      });
      console.log('[BROWSER] ✓ Browser launched successfully');
    } catch (error) {
      console.error('[BROWSER] ✗ Failed to launch browser:', error);
      throw new Error(`Failed to launch Puppeteer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    console.log('[BROWSER] Closing browser...');
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Fetch HTML from a URL using Puppeteer
 * This will execute JavaScript and wait for the page to load
 */
export async function fetchHtmlWithBrowser(
  url: string,
  options?: {
    waitForSelector?: string;
    waitTime?: number;
    userAgent?: string;
  }
): Promise<string> {
  let page;

  try {
    console.log(`[BROWSER] Getting browser instance...`);
    const browser = await getBrowser();

    console.log(`[BROWSER] Creating new page...`);
    page = await browser.newPage();

    // Set user agent
    if (options?.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`[BROWSER] Navigating to ${url}`);

    // Navigate to the page with longer timeout and simpler wait condition
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // Wait for DOM, not network idle (faster)
      timeout: 60000, // 60 seconds
    });

    console.log(`[BROWSER] ✓ Page loaded, waiting for dynamic content...`);

    // Wait a bit for initial rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to handle cookie consent dialogs automatically
    await handleCookieConsent(page);

    // Wait for a specific selector if provided
    if (options?.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        timeout: 10000,
      }).catch(() => {
        console.log(`[BROWSER] Warning: Selector ${options.waitForSelector} not found`);
      });
    }

    // Additional wait time for JavaScript to execute
    const waitTime = options?.waitTime || 2000;
    console.log(`[BROWSER] Waiting ${waitTime}ms for lazy-loaded content...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Get the full HTML after JavaScript execution
    console.log(`[BROWSER] Extracting HTML content...`);
    const html = await page.content();

    console.log(`[BROWSER] ✓ Successfully fetched ${url} (${html.length} bytes)`);

    return html;

  } catch (error) {
    console.error(`[BROWSER] ✗ Failed to fetch ${url}`);
    console.error(`[BROWSER] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[BROWSER] Error message: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    if (page) {
      console.log(`[BROWSER] Closing page...`);
      await page.close().catch(e => console.error('[BROWSER] Error closing page:', e));
    }
  }
}

/**
 * Fetch HTML and run browser-based tests (contrast, label-in-name, auto-refresh)
 * in dezelfde pageload. Veel efficiënter dan twee aparte browser-sessies.
 */
export async function fetchHtmlAndRunBrowserTests(
  url: string,
  options?: {
    waitTime?: number;
    userAgent?: string;
  }
): Promise<{ html: string; browserTestResults: any[] }> {
  let page;
  const browserTestResults: any[] = [];

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    if (options?.userAgent) {
      await page.setUserAgent(options.userAgent);
    }
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    await handleCookieConsent(page);

    const waitTime = options?.waitTime || 2000;
    await new Promise(resolve => setTimeout(resolve, waitTime));

    const html = await page.content();

    // Browser-tests draaien op dezelfde pagina
    try {
      const { testColorContrast, testLabelInName, testAutoRefresh, testHiddenWithFocusableContent, testTableHeaderCellMissingHeaderRole } = await import('./browser-tests');
      const contrastResult = await testColorContrast(page);
      browserTestResults.push(contrastResult);
      const labelResult = await testLabelInName(page);
      browserTestResults.push(labelResult);
      const refreshResult = await testAutoRefresh(page, url);
      browserTestResults.push(refreshResult);
      const hiddenFocusableResult = await testHiddenWithFocusableContent(page);
      browserTestResults.push(hiddenFocusableResult);
      const tableHeaderResult = await testTableHeaderCellMissingHeaderRole(page);
      browserTestResults.push(tableHeaderResult);
    } catch (testErr) {
      console.error('[BROWSER] Browser-test fout:', testErr instanceof Error ? testErr.message : testErr);
    }

    return { html, browserTestResults };

  } catch (error) {
    console.error(`[BROWSER] ✗ Failed to fetch+test ${url}:`, error instanceof Error ? error.message : error);
    throw error;
  } finally {
    if (page) {
      await page.close().catch(e => console.error('[BROWSER] Error closing page:', e));
    }
  }
}

/**
 * Fetch HTML and take a screenshot
 */
export async function fetchHtmlWithScreenshot(
  url: string,
  screenshotPath: string,
  options?: {
    waitForSelector?: string;
    waitTime?: number;
    userAgent?: string;
  }
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (options?.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`[BROWSER] Navigating to ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    if (options?.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        timeout: 10000,
      }).catch(() => {
        console.log(`[BROWSER] Warning: Selector ${options.waitForSelector} not found`);
      });
    }

    const waitTime = options?.waitTime || 2000;
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Take screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log(`[BROWSER] Screenshot saved to ${screenshotPath}`);

    const html = await page.content();

    return html;

  } catch (error) {
    console.error(`[BROWSER] Failed to fetch ${url}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Check if a URL has specific elements (useful for pre-checking)
 */
export async function checkForElements(
  url: string,
  selectors: string[]
): Promise<{ [selector: string]: boolean }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const results: { [selector: string]: boolean } = {};

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        results[selector] = element !== null;
      } catch {
        results[selector] = false;
      }
    }

    return results;

  } catch (error) {
    console.error(`[BROWSER] Failed to check elements on ${url}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}