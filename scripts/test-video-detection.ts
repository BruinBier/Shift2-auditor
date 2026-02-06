import { fetchHtmlWithBrowser, closeBrowser } from '../lib/crawler/browser-crawler';
import * as cheerio from 'cheerio';

async function testVideoDetection() {
  const url = 'https://www.valkenswaard.nl/werken-bij-de-gemeente-valkenswaard';

  console.log(`Testing video detection on: ${url}\n`);

  try {
    // Fetch HTML with Puppeteer (executes JavaScript)
    console.log('Fetching HTML with headless browser...');
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: 'Shift2-Auditor/1.0 (Test)',
      waitTime: 3000,
    });

    console.log(`\nHTML fetched: ${html.length} bytes\n`);

    // Parse HTML
    const $ = cheerio.load(html);

    // Check for video elements
    console.log('=== Video Detection Results ===\n');

    // HTML5 video elements
    const videos = $('video');
    console.log(`HTML5 <video> elements: ${videos.length}`);
    videos.each((i, video) => {
      console.log(`  Video ${i + 1}:`);
      console.log(`    - src: ${$(video).attr('src')}`);
      console.log(`    - controls: ${$(video).attr('controls') !== undefined}`);
      console.log(`    - autoplay: ${$(video).attr('autoplay') !== undefined}`);

      // Check for source elements
      const sources = $(video).find('source');
      if (sources.length > 0) {
        console.log(`    - sources: ${sources.length}`);
        sources.each((j, source) => {
          console.log(`      - ${$(source).attr('src')} (${$(source).attr('type')})`);
        });
      }
    });

    // iframes (YouTube, Vimeo, etc.)
    const iframes = $('iframe');
    console.log(`\niframes: ${iframes.length}`);
    iframes.each((i, iframe) => {
      const src = $(iframe).attr('src') || '';
      console.log(`  iframe ${i + 1}:`);
      console.log(`    - src: ${src}`);
      console.log(`    - title: ${$(iframe).attr('title')}`);
      console.log(`    - YouTube: ${src.includes('youtube.com') || src.includes('youtu.be')}`);
      console.log(`    - Vimeo: ${src.includes('vimeo.com')}`);
    });

    // Embed elements
    const embeds = $('embed');
    console.log(`\n<embed> elements: ${embeds.length}`);

    // Object elements
    const objects = $('object');
    console.log(`<object> elements: ${objects.length}`);

    console.log('\n=== Summary ===');
    const totalVideos = videos.length + iframes.length + embeds.length + objects.length;
    console.log(`Total video-related elements found: ${totalVideos}`);

    if (totalVideos === 0) {
      console.log('\n⚠️  No video elements found. The video might be:');
      console.log('   1. Loaded after 3 seconds (try increasing waitTime)');
      console.log('   2. Inside a shadow DOM');
      console.log('   3. Loaded via a custom video player');

      // Check for video-related classes/IDs
      const videoContainers = $('[class*="video"], [id*="video"]');
      if (videoContainers.length > 0) {
        console.log(`\nFound ${videoContainers.length} elements with "video" in class/id:`);
        videoContainers.slice(0, 5).each((i, el) => {
          console.log(`  - ${el.tagName}: ${$(el).attr('class')} ${$(el).attr('id')}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeBrowser();
  }
}

testVideoDetection();