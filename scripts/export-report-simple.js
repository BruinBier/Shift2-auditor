const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Simple HTML export script that creates standalone HTML files
 * Usage: node scripts/export-report-simple.js <project-id>
 */

async function exportReport(projectId, outputDir) {
  console.log(`Starting export for project: ${projectId}`);

  const exportDir = path.join(outputDir, projectId);

  // Create output directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Copy fonts directory
  console.log('Copying fonts...');
  const fontsSource = path.join(__dirname, '../public/fonts');
  const fontsDest = path.join(exportDir, 'fonts');
  if (fs.existsSync(fontsSource)) {
    copyDirectory(fontsSource, fontsDest);
    console.log('✓ Fonts copied');
  }

  // Copy logo
  console.log('Copying logo...');
  const logoSource = path.join(__dirname, '../public/shift2-logo.svg');
  const logoDest = path.join(exportDir, 'shift2-logo.svg');
  if (fs.existsSync(logoSource)) {
    fs.copyFileSync(logoSource, logoDest);
    console.log('✓ Logo copied');
  }

  // Create instruction HTML
  console.log('Creating export instructions...');
  const instructionsHtml = createInstructionsPage(projectId);
  fs.writeFileSync(path.join(exportDir, 'README.html'), instructionsHtml);

  // Create a note about manual export
  const noteText = `
EXPORT INSTRUCTIES
==================

Deze map bevat alle benodigde assets (fonts, logo) voor het rapport.

OM HET RAPPORT TE EXPORTEREN:

1. Open je browser naar: http://localhost:3001/report/${projectId}

2. Gebruik de browser's "Print" functie:
   - Chrome/Edge: CTRL+P
   - Kies "Save as PDF"
   - Of gebruik browser's "Save Page As" → "Webpage, Complete"

3. Plaats de geëxporteerde HTML/PDF in deze map

4. Upload alles naar: rapporten.shift2.nl/${projectId}/

AUTOMATISCHE EXPORT (als dev server draait):
============================================

Voor automatische export met alle tabs, gebruik:
npm run export-full ${projectId}

(Vereist dat de dev server draait op http://localhost:3001)
`;

  fs.writeFileSync(path.join(exportDir, 'INSTRUCTIES.txt'), noteText);
  console.log('✓ Instructions created');

  // Create zip
  console.log('Creating zip archive...');
  const zipPath = path.join(outputDir, `${projectId}.zip`);
  await createZip(exportDir, zipPath);

  console.log('\n✅ Export voltooid!');
  console.log(`📁 Map: ${exportDir}`);
  console.log(`📦 Zip: ${zipPath}`);
  console.log('\nOm rapport te exporteren:');
  console.log(`1. Ga naar: http://localhost:3001/report/${projectId}`);
  console.log('2. Gebruik browser Print → Save as PDF');
  console.log('3. Of gebruik "Save Page As" voor HTML versie');
  console.log(`4. Plaats bestanden in: ${exportDir}`);
  console.log(`5. Upload naar server: rapporten.shift2.nl/${projectId}/`);
}

function createInstructionsPage(projectId) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export Instructies - Shift2 Rapport</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #290047;
      border-bottom: 3px solid #290047;
      padding-bottom: 10px;
    }
    h2 {
      color: #6b2d8f;
      margin-top: 30px;
    }
    .button {
      display: inline-block;
      background: #6b2d8f;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin: 10px 10px 10px 0;
      font-weight: 500;
    }
    .button:hover {
      background: #290047;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .step {
      background: #f8f9fa;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #6b2d8f;
      border-radius: 4px;
    }
    .file-list {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Shift2 WCAG Rapport Export</h1>

    <p><strong>Project ID:</strong> <code>${projectId}</code></p>

    <h2>📦 Wat zit er in deze export?</h2>
    <div class="file-list">
      ${projectId}/<br>
      ├── fonts/<br>
      │   ├── Neulis sans/ (body font)<br>
      │   └── Brockmann Roman Desktop/ (headings)<br>
      ├── shift2-logo.svg<br>
      ├── README.html (dit bestand)<br>
      └── INSTRUCTIES.txt
    </div>

    <h2>🚀 Rapport Exporteren</h2>

    <div class="step">
      <strong>Stap 1: Open het rapport</strong><br>
      <a href="http://localhost:3001/report/${projectId}" class="button" target="_blank">
        Open Rapport in Browser
      </a>
      <br><small>Zorg dat de dev server draait met: <code>npm run dev</code></small>
    </div>

    <div class="step">
      <strong>Stap 2: Exporteer naar PDF</strong><br>
      • Druk op <code>CTRL+P</code> (of CMD+P op Mac)<br>
      • Kies "Save as PDF"<br>
      • Sla op als: <code>${projectId}.pdf</code>
    </div>

    <div class="step">
      <strong>Stap 3: Upload naar server</strong><br>
      Upload deze hele map naar:<br>
      <code>rapporten.shift2.nl/${projectId}/</code>
    </div>

    <h2>🔗 URL na Upload</h2>
    <p>Het rapport is dan beschikbaar op:</p>
    <code>https://rapporten.shift2.nl/${projectId}/${projectId}.pdf</code>

    <h2>💡 Tips</h2>
    <ul>
      <li>De lange ID in de URL maakt het rapport moeilijk te raden (security)</li>
      <li>Fonts en logo worden automatisch meegeladen vanuit deze map</li>
      <li>Voor HTML versie: Gebruik browser's "Save Page As" functie</li>
      <li>Test altijd de upload door de URL te bezoeken</li>
    </ul>

    <h2>📝 Voor Later: Geautomatiseerd</h2>
    <p>Deze handmatige stappen kunnen later geautomatiseerd worden met een "Export" knop in de admin interface.</p>
  </div>
</body>
</html>`;
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
      console.log(`✓ Zip created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
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
  console.error('❌ Project ID is verplicht!');
  console.error('Gebruik: node scripts/export-report-simple.js <project-id>');
  console.error('');
  console.error('Voorbeeld:');
  console.error('  node scripts/export-report-simple.js b38444c8-a9ac-4beb-a9d5-b918cc0e845b');
  process.exit(1);
}

exportReport(projectId, outputDir)
  .then(() => {
    console.log('\n✅ Klaar! Open README.html in de export map voor verdere instructies.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Export mislukt:', error);
    process.exit(1);
  });
