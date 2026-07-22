import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const rts = await p.researchType.findMany({
    where: { name: { contains: 'content' } },
    include: { criteria: { include: { wcagCriterion: true } } },
  });
  for (const rt of rts) {
    const codes = rt.criteria
      .map((c) => c.wcagCriterion.code)
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    console.log(JSON.stringify({ name: rt.name, count: codes.length, codes }, null, 2));
  }
  await p.$disconnect();
})();
