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
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to find "Accepteer alle cookies" button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.trim() || '');
      if (
        text.includes('Accepteer alle cookies') ||
        text.includes('Accept all cookies') ||
        text.includes('Accepteer alle') ||
        text.includes('Accept all')
      ) {
        console.log(`[BROWSER] Found cookie consent button: "${text}"`);
        // Click using JavaScript instead of Puppeteer's click to avoid visibility issues
        await button.evaluate((el: Element) => (el as HTMLElement).click());
        console.log(`[BROWSER] Clicked cookie consent button`);
        // Wait for the dialog to close and content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
    }

    // Fallback: try class-based selectors
    const cookieButtonSelectors = [
      'button[class*="CookieBanner"][class*="button"]',
      'button[class*="cookie"][class*="accept"]',
      'button[class*="Cookie"][class*="Accept"]',
    ];

    for (const selector of cookieButtonSelectors) {
      const button = await page.$(selector);
      if (button) {
        const text = await button.evaluate(el => el.textContent?.trim() || '');
        if (text.includes('Accepteer') || text.includes('Accept')) {
          console.log(`[BROWSER] Found cookie consent button: ${selector}`);
          await button.click();
          console.log(`[BROWSER] Clicked cookie consent button`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return;
        }
      }
    }

    console.log(`[BROWSER] No cookie consent dialog found`);
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
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
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
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set user agent
    if (options?.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`[BROWSER] Navigating to ${url}`);

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0', // Wait until network is idle
      timeout: 30000,
    });

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
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Get the full HTML after JavaScript execution
    const html = await page.content();

    console.log(`[BROWSER] ✓ Successfully fetched ${url} (${html.length} bytes)`);

    return html;

  } catch (error) {
    console.error(`[BROWSER] ✗ Failed to fetch ${url}:`, error);
    throw error;
  } finally {
    await page.close();
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