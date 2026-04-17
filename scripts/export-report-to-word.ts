/**
 * Script to export a report's main content (left column) to a Word document
 * Usage: npx tsx scripts/export-report-to-word.ts <project-id>
 */

import { PrismaClient } from '@prisma/client';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Error: Please provide a project ID');
  console.error('Usage: npx tsx scripts/export-report-to-word.ts <project-id>');
  process.exit(1);
}

console.log(`📊 Exporting report for project: ${projectId}\n`);

async function exportReportToWord() {
  try {
    // Fetch project with all related data
    console.log('📖 Fetching project data...');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        clientProject: {
          include: {
            opdrachtgever: true,
          },
        },
        scopeUrls: true,
        sampleItems: {
          orderBy: { orderIndex: 'asc' },
        },
        findings: {
          include: {
            wcagCriterion: true,
            occurrences: {
              include: {
                sampleItem: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        criterionAssessments: {
          include: {
            wcagCriterion: true,
          },
        },
      },
    });

    if (!project) {
      console.error('❌ Project not found!');
      process.exit(1);
    }

    console.log(`✅ Found project: ${project.title}\n`);

    // Create a simple Word document with the report content
    console.log('🔨 Building Word document...');

    const content: string[] = [];

    // Title page
    content.push('TOEGANKELIJKHEIDSONDERZOEK');
    content.push('');
    content.push(project.subject || project.title);
    content.push('');
    content.push(`Rapportdatum: ${project.reportDate ? new Date(project.reportDate).toLocaleDateString('nl-NL') : '[datum]'}`);
    content.push(`Versie: ${project.version}`);
    content.push(`Uitgevoerd door: ${project.auditedByOrg}`);
    content.push('');
    content.push('---');
    content.push('');

    // 1. Samenvatting (if available)
    if (project.managementSummary) {
      content.push('1. SAMENVATTING');
      content.push('');
      content.push(stripHtml(project.managementSummary));
      content.push('');
    }

    // 2. Over het onderzoek
    content.push('2. OVER HET ONDERZOEK');
    content.push('');

    content.push('2.1 Inleiding');
    content.push('');
    if (project.aboutResearchText) {
      content.push(stripHtml(project.aboutResearchText));
      content.push('');
    }

    content.push('2.2 Reikwijdte');
    content.push('');
    if (project.scopeInfo) {
      content.push(stripHtml(project.scopeInfo));
      content.push('');
    }

    // Scope URLs
    const inScopeUrls = project.scopeUrls.filter(u => u.inScope);
    const outOfScopeUrls = project.scopeUrls.filter(u => !u.inScope);

    if (inScopeUrls.length > 0) {
      content.push('Binnen de reikwijdte:');
      inScopeUrls.forEach(url => {
        content.push(`  • ${url.url}`);
        if (url.note) content.push(`    ${url.note}`);
      });
      content.push('');
    }

    if (outOfScopeUrls.length > 0) {
      content.push('Buiten de reikwijdte:');
      outOfScopeUrls.forEach(url => {
        content.push(`  • ${url.url}`);
        if (url.note) content.push(`    ${url.note}`);
      });
      content.push('');
    }

    content.push('2.3 Steekproef');
    content.push('');
    if (project.sampleInfo) {
      content.push(stripHtml(project.sampleInfo));
      content.push('');
    }

    // Sample items
    if (project.sampleItems.length > 0) {
      content.push('Steekproef items:');
      project.sampleItems.forEach((item, index) => {
        content.push(`  ${index + 1}. ${item.title}`);
        if (item.url) content.push(`     ${item.url}`);
        if (item.description) content.push(`     ${stripHtml(item.description)}`);
      });
      content.push('');
    }

    content.push('2.4 Testomgeving');
    content.push('');
    if (project.userAgents) {
      content.push('Browsers en hulpmiddelen:');
      project.userAgents.split('\n').forEach(line => {
        if (line.trim()) content.push(`  • ${line.trim()}`);
      });
      content.push('');
    }

    if (project.technologies && project.technologies.length > 0) {
      content.push('Technologieën:');
      project.technologies.forEach(tech => {
        content.push(`  • ${tech}`);
      });
      content.push('');
    }

    // 3. Resultaten
    content.push('3. RESULTATEN');
    content.push('');

    content.push('3.1 Overzicht succescriteria');
    content.push('');

    // Calculate statistics
    const totalCriteria = project.criterionAssessments.length;
    const passedCriteria = project.criterionAssessments.filter(a => a.status === 'passed').length;
    const failedCriteria = project.criterionAssessments.filter(a => a.status === 'failed').length;
    const percentage = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;

    content.push(`Totaal beoordeelde criteria: ${totalCriteria}`);
    content.push(`Geslaagd: ${passedCriteria}`);
    content.push(`Niet geslaagd: ${failedCriteria}`);
    content.push(`Percentage geslaagd: ${percentage}%`);
    content.push('');

    // Criteria per principle
    const principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
    const principleNames: Record<string, string> = {
      Perceivable: 'Waarneembaar',
      Operable: 'Bedienbaar',
      Understandable: 'Begrijpelijk',
      Robust: 'Robuust',
    };

    principles.forEach(principle => {
      const criteriaPrinciple = project.criterionAssessments.filter(
        a => a.wcagCriterion.principle === principle
      );

      if (criteriaPrinciple.length > 0) {
        content.push(`${principleNames[principle]}:`);
        criteriaPrinciple.forEach(assessment => {
          const status = assessment.status === 'passed' ? '✓ Voldoet' :
                        assessment.status === 'failed' ? '✗ Voldoet niet' :
                        assessment.status === 'not_present' ? '- Niet aanwezig' :
                        assessment.status === 'not_tested' ? '? Niet getest' : '? Onbekend';

          content.push(`  ${assessment.wcagCriterion.code} ${assessment.wcagCriterion.titleNl} - ${status}`);

          if (assessment.explanation) {
            content.push(`    Toelichting: ${stripHtml(assessment.explanation)}`);
          }
        });
        content.push('');
      }
    });

    // 4. Bevindingen
    content.push('4. BEVINDINGEN');
    content.push('');

    if (project.findings.length === 0) {
      content.push('Geen bevindingen geregistreerd.');
      content.push('');
    } else {
      project.findings.forEach((finding, index) => {
        content.push(`${index + 1}. ${finding.findingCode} - ${finding.wcagCriterion.code} ${finding.wcagCriterion.titleNl}`);
        content.push('');

        if (finding.impact) {
          content.push(`Impact: ${finding.impact}`);
        }
        if (finding.responsibility) {
          content.push(`Verantwoordelijkheid: ${finding.responsibility}`);
        }
        content.push('');

        content.push('Beschrijving:');
        content.push(stripHtml(finding.description));
        content.push('');

        content.push('Advies:');
        content.push(stripHtml(finding.advice));
        content.push('');

        if (finding.occurrences.length > 0) {
          content.push('Locaties:');
          finding.occurrences.forEach(occ => {
            content.push(`  • ${occ.sampleItem?.title || 'Onbekend'}`);
            if (occ.url) content.push(`    ${occ.url}`);
          });
          content.push('');
        }

        content.push('---');
        content.push('');
      });
    }

    // 5. Conclusie
    if (project.conclusionText) {
      content.push('5. CONCLUSIE');
      content.push('');
      content.push(stripHtml(project.conclusionText));
      content.push('');
    }

    // Create a simple Word document
    const doc = createSimpleWordDocument(content.join('\n'));

    // Save the document
    const outputPath = path.join(process.cwd(), `report-${project.kenmerk || projectId}.docx`);
    fs.writeFileSync(outputPath, doc);

    console.log(`✅ Word document created: ${outputPath}\n`);
    console.log('📄 Document contains:');
    console.log(`   • Project info`);
    console.log(`   • Samenvatting`);
    console.log(`   • Over het onderzoek`);
    console.log(`   • ${project.scopeUrls.length} scope URLs`);
    console.log(`   • ${project.sampleItems.length} steekproef items`);
    console.log(`   • ${project.criterionAssessments.length} criteria beoordelingen`);
    console.log(`   • ${project.findings.length} bevindingen`);
    console.log(`   • Conclusie\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function stripHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  • ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function createSimpleWordDocument(text: string): Buffer {
  // Create a minimal Word document structure
  const minimalDocXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${text.split('\n').map(line => {
  if (!line.trim()) {
    return '    <w:p/>';
  }

  // Check if it's a heading
  if (line.match(/^\d+\.\s+[A-Z]/)) {
    return `    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`;
  }

  if (line.match(/^\d+\.\d+\s+[A-Z]/)) {
    return `    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`;
  }

  if (line === '---') {
    return '    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>';
  }

  return `    <w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
}).join('\n')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zip = new PizZip();

  // Add required files
  zip.file('word/document.xml', minimalDocXml);
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  return zip.generate({ type: 'nodebuffer' });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

exportReportToWord();