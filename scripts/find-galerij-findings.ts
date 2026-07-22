import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const projects = await p.project.findMany({
    where: { title: { contains: 'sselstein', mode: 'insensitive' } },
    select: { id: true, kenmerk: true, title: true, checkPhase: true, parentProjectId: true, userAgents: true },
  });
  for (const pr of projects) {
    console.log('---');
    console.log(`${pr.kenmerk} | ${pr.title} | phase=${pr.checkPhase} | parent=${pr.parentProjectId}`);
    console.log('userAgents:', pr.userAgents);
  }
  await p.$disconnect();
})();
