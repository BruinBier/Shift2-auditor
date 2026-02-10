import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportToHardcoded() {
  try {
    console.log('📤 Exporting database to hardcoded file...');

    const findings = await prisma.quickFinding.findMany({
      orderBy: [
        { criterionCode: 'asc' },
        { title: 'asc' }
      ]
    });

    console.log(`📊 Found ${findings.length} quick findings`);

    const mappedFindings = findings.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      advice: f.advice,
      criterionCode: f.criterionCode,
      keywords: f.keywords,
      crawler: f.crawler,
      crawlerTestId: f.crawlerTestId,
      status: f.status,
      impact: f.impact,
      responsibility: f.responsibility,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    const content = `// Hardcoded Quick Findings - Deze bevindingen zijn altijd beschikbaar zonder database

export interface QuickFinding {
  id?: string;
  title: string;
  description: string;
  advice: string;
  criterionCode: string;
  keywords?: string | null;
  crawler?: boolean;
  crawlerTestId?: string | null;
  status?: 'open' | 'published' | 'resolved' | null;
  impact?: 'klein' | 'matig' | 'serieus' | 'kritiek' | 'onbekend' | null;
  responsibility?: 'redacteur' | 'ontwikkelaar' | 'ontwerper' | 'onbekend' | null;
  createdAt?: string;
  updatedAt?: string;
}

export const QUICK_FINDINGS: QuickFinding[] = ${JSON.stringify(mappedFindings, null, 2)};
`;

    const outputPath = path.join(process.cwd(), 'lib', 'quick-findings-data.ts');
    fs.writeFileSync(outputPath, content);

    console.log(`✅ Exported to ${outputPath}`);
    console.log(`📝 Total: ${findings.length} quick findings`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportToHardcoded();