import { fetchHtmlWithBrowser } from '../lib/crawler/browser-crawler';

async function checkVideo() {
  const url = 'https://www.valkenswaard.nl/afscheid-burgemeester-looijen';

  console.log(`Fetching ${url}...`);

  const html = await fetchHtmlWithBrowser(url, {
    userAgent: 'Shift2-Auditor/1.0 (Accessibility Crawler; +https://shift2.nl)',
    waitTime: 3000,
  });

  console.log('\n=== HTML Analysis ===');
  console.log(`Total HTML size: ${html.length} bytes`);

  // Check for video tag
  const videoMatch = html.match(/<video[^>]*>/gi);
  console.log(`\n<video> tags found: ${videoMatch ? videoMatch.length : 0}`);
  if (videoMatch) {
    videoMatch.forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.substring(0, 200)}`);
    });
  }

  // Check for iframe
  const iframeMatch = html.match(/<iframe[^>]*>/gi);
  console.log(`\n<iframe> tags found: ${iframeMatch ? iframeMatch.length : 0}`);
  if (iframeMatch) {
    iframeMatch.forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.substring(0, 200)}`);
    });
  }

  // Check for YouTube specifically
  const youtubeInHtml = html.includes('youtube.com') || html.includes('youtu.be');
  console.log(`\nContains "youtube.com" or "youtu.be": ${youtubeInHtml}`);

  if (youtubeInHtml) {
    // Find context around YouTube
    const youtubeIndex = html.indexOf('youtube.com') || html.indexOf('youtu.be');
    if (youtubeIndex > -1) {
      const start = Math.max(0, youtubeIndex - 200);
      const end = Math.min(html.length, youtubeIndex + 200);
      console.log(`\nContext around YouTube:`);
      console.log(html.substring(start, end));
    }
  }

  // Check for Vimeo
  const vimeoInHtml = html.includes('vimeo.com');
  console.log(`\nContains "vimeo.com": ${vimeoInHtml}`);

  // Check for common video players
  const jwplayerInHtml = html.includes('jwplayer') || html.includes('JW Player');
  console.log(`Contains JW Player: ${jwplayerInHtml}`);

  const videojsInHtml = html.includes('video-js') || html.includes('videojs');
  console.log(`Contains Video.js: ${videojsInHtml}`);
}

checkVideo().catch(console.error);
