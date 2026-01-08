const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function exportReport(projectId, outputDir) {
  console.log(`Starting export for project: ${projectId}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Wait for server to be ready
    console.log('Connecting to http://localhost:3001/report/' + projectId);
    await page.goto(`http://localhost:3001/report/${projectId}`, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Create output directory
    const exportDir = path.join(outputDir, projectId);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Copy fonts directory
    console.log('Copying fonts...');
    const fontsSource = path.join(__dirname, '../public/fonts');
    const fontsDest = path.join(exportDir, 'fonts');
    if (fs.existsSync(fontsSource)) {
      copyDirectory(fontsSource, fontsDest);
    }

    // Copy logo
    console.log('Copying logo...');
    const logoSource = path.join(__dirname, '../public/shift2-logo.svg');
    const logoDest = path.join(exportDir, 'shift2-logo.svg');
    if (fs.existsSync(logoSource)) {
      fs.copyFileSync(logoSource, logoDest);
    }

    // Get all tabs
    const tabs = ['about', 'results', 'findings', 'sample'];
    const tabNames = {
      about: 'over-dit-onderzoek',
      results: 'resultaten',
      findings: 'bevindingen',
      sample: 'steekproef'
    };

    for (const tab of tabs) {
      console.log(`Exporting tab: ${tab}`);

      // Click tab
      await page.click(`button:has-text("${getTabText(tab)}")`);
      await page.waitForTimeout(1000);

      // Get HTML
      const html = await page.content();

      // Process HTML to make it standalone
      const standaloneHtml = processHtml(html, projectId);

      // Save to file
      const filename = `${tabNames[tab]}.html`;
      fs.writeFileSync(path.join(exportDir, filename), standaloneHtml);
      console.log(`Saved: ${filename}`);
    }

    // Create index.html that defaults to "over dit onderzoek"
    fs.copyFileSync(
      path.join(exportDir, 'over-dit-onderzoek.html'),
      path.join(exportDir, 'index.html')
    );

    console.log('Creating zip archive...');
    await createZip(exportDir, path.join(outputDir, `${projectId}.zip`));

    console.log(`✅ Export completed! Files saved to: ${exportDir}`);
    console.log(`📦 Zip archive: ${path.join(outputDir, projectId + '.zip')}`);

  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

function getTabText(tab) {
  const texts = {
    about: 'Over dit onderzoek',
    results: 'Resultaten',
    findings: 'Bevindingen',
    sample: 'Steekproef'
  };
  return texts[tab];
}

function processHtml(html, projectId) {
  // Remove Next.js scripts and replace localhost URLs
  let processed = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/http:\/\/localhost:3001/g, '.')
    .replace(/\/_next\/static/g, '.')
    .replace(/href="\//g, 'href="./')
    .replace(/src="\//g, 'src="./')
    .replace(/url\(\/fonts\//g, 'url(./fonts/');

  // Remove interactive elements (no-print class)
  processed = processed.replace(/class="([^"]*?)no-print([^"]*?)"/g, 'class="$1$2" style="display: none;"');

  // Add navigation links
  const nav = `
    <style>
      .static-nav {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
      }
      .static-nav a {
        display: block;
        margin: 5px 0;
        color: #1f0036;
        text-decoration: none;
        padding: 5px 10px;
        border-radius: 4px;
      }
      .static-nav a:hover {
        background: #79e792;
        color: #290047;
      }
      @media print {
        .static-nav { display: none; }
      }
    </style>
    <nav class="static-nav">
      <a href="over-dit-onderzoek.html">Over dit onderzoek</a>
      <a href="resultaten.html">Resultaten</a>
      <a href="bevindingen.html">Bevindingen</a>
      <a href="steekproef.html">Steekproef</a>
    </nav>
  `;

  processed = processed.replace('</body>', nav + '</body>');

  return processed;
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function createZip(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zip created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Main execution
const projectId = process.argv[2];
const outputDir = process.argv[3] || path.join(__dirname, '../exports');

if (!projectId) {
  console.error('Usage: node export-report.js <project-id> [output-directory]');
  process.exit(1);
}

exportReport(projectId, outputDir)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
