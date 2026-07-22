import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const id = process.argv[2];
  const f = await p.finding.findUnique({
    where: { id },
    include: { occurrences: { include: { sampleItem: { select: { title: true } } } } },
  });
  if (f) {
    console.log(JSON.stringify(f, null, 2));
    await p.$disconnect();
    return;
  }
  const q = await p.quickFinding.findUnique({ where: { id } });
  console.log(JSON.stringify(q, null, 2));
  await p.$disconnect();
})();
