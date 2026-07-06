import { prisma } from '../lib/prisma';

(async () => {
  const projectId = process.argv[2];
  const codes = process.argv.slice(3);
  const findings = await prisma.finding.findMany({
    where: { projectId, findingCode: { in: codes } },
    select: { id: true, findingCode: true, description: true },
  });
  for (const f of findings) {
    console.log(`${f.findingCode}  ${f.id}  ${f.description.slice(0, 70)}`);
  }
  await prisma.$disconnect();
})();
