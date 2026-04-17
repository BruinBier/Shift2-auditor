import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function generateTestReport() {
  // Find a project with findings
  const project = await prisma.project.findFirst({
    where: {
      findings: {
        some: {}
      }
    },
    include: {
      findings: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  if (!project) {
    console.log('No suitable project found with findings');
    process.exit(1);
  }

  console.log(`Found project: ${project.title} (ID: ${project.id})`);
  console.log(`Findings: ${project.findings.length}`);
  console.log('\nGenerating report via API...');

  // Make API request to generate DOCX
  const response = await fetch(`http://localhost:3000/api/reports/${project.id}/docx`);

  if (!response.ok) {
    console.error('Failed to generate report:', response.statusText);
    const text = await response.text();
    console.error('Response:', text);
    process.exit(1);
  }

  // Save the DOCX file
  const buffer = await response.arrayBuffer();
  const outputPath = path.join(process.cwd(), 'test-output.docx');
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  console.log(`\n✓ Report generated successfully!`);
  console.log(`✓ Saved to: test-output.docx`);
  console.log(`✓ File size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
}

generateTestReport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });