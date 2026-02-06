import * as cheerio from 'cheerio';

async function checkVideoOnPage() {
  const url = 'https://www.valkenswaard.nl/werken-bij-de-gemeente-valkenswaard';

  console.log(`Fetching: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Shift2-Auditor/1.0',
      },
    });

    if (!response.ok) {
      console.log(`Failed: HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Check for HTML5 video elements
    const videos = $('video');
    console.log(`HTML5 <video> elements: ${videos.length}`);
    videos.each((i, video) => {
      console.log(`  - Video ${i + 1}:`, {
        src: $(video).attr('src'),
        hasControls: $(video).attr('controls') !== undefined,
        hasAutoplay: $(video).attr('autoplay') !== undefined,
      });
    });

    // Check for iframes (embedded videos like YouTube, Vimeo)
    const iframes = $('iframe');
    console.log(`\niframes: ${iframes.length}`);
    iframes.each((i, iframe) => {
      const src = $(iframe).attr('src') || '';
      console.log(`  - iframe ${i + 1}:`, {
        src: src,
        isYouTube: src.includes('youtube.com') || src.includes('youtu.be'),
        isVimeo: src.includes('vimeo.com'),
        title: $(iframe).attr('title'),
      });
    });

    // Check for embed elements
    const embeds = $('embed[type*="video"], embed[src*="video"]');
    console.log(`\n<embed> video elements: ${embeds.length}`);

    // Check for object elements (old-style embeds)
    const objects = $('object[type*="video"]');
    console.log(`<object> video elements: ${objects.length}`);

    // Check for common video player divs/classes
    const videoPlayers = $(
      '[class*="video"], [class*="player"], [id*="video"], [id*="player"]'
    ).filter((i, el) => {
      const $el = $(el);
      const className = $el.attr('class') || '';
      const id = $el.attr('id') || '';
      return (
        /video|player|embed|youtube|vimeo/i.test(className + id) &&
        !$el.is('video') &&
        !$el.is('iframe')
      );
    });
    console.log(`\nVideo player containers: ${videoPlayers.length}`);
    videoPlayers.each((i, el) => {
      if (i < 5) {
        console.log(`  - ${el.tagName}:`, {
          class: $(el).attr('class'),
          id: $(el).attr('id'),
        });
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkVideoOnPage();