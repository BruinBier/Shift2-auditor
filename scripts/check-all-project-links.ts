import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllProjectLinks() {
  console.log('\n=== Checking All Project Links ===\n');

  // Get all projects
  const projects = await prisma.project.findMany({
    include: {
      clientProject: {
        include: {
          opdrachtgever: true,
        },
      },
    },
    orderBy: { kenmerk: 'asc' },
  });

  let issuesFound = 0;
  const issues: Array<{
    type: string;
    project: any;
    expectedOpdrachtgever?: string;
    expectedClientProjectId?: string;
  }> = [];

  for (const project of projects) {
    let hasIssue = false;

    // Issue 1: Project has clientProject but auditedByOrg doesn't match
    if (project.clientProject && project.auditedByOrg !== project.clientProject.opdrachtgever.naam) {
      hasIssue = true;
      issues.push({
        type: 'MISMATCH',
        project,
        expectedOpdrachtgever: project.clientProject.opdrachtgever.naam,
      });
      issuesFound++;

      console.log(`❌ ISSUE ${issuesFound}: MISMATCH`);
      console.log(`   Project: ${project.kenmerk} - ${project.title}`);
      console.log(`   Current auditedByOrg: "${project.auditedByOrg}"`);
      console.log(`   Expected auditedByOrg: "${project.clientProject.opdrachtgever.naam}"`);
      console.log(`   Client Project: ${project.clientProject.name}`);
      console.log('');
    }

    // Issue 2: Project has no clientProject but could be linked
    if (!project.clientProject && project.auditedByOrg) {
      // Try to find a matching opdrachtgever and client project
      const opdrachtgever = await prisma.opdrachtgever.findFirst({
        where: { naam: project.auditedByOrg },
      });

      if (opdrachtgever) {
        const clientProjects = await prisma.clientProject.findMany({
          where: { opdrachtgeverId: opdrachtgever.id },
          include: { opdrachtgever: true },
        });

        if (clientProjects.length > 0) {
          hasIssue = true;
          issues.push({
            type: 'NO_LINK',
            project,
            expectedClientProjectId: clientProjects[0].id,
          });
          issuesFound++;

          console.log(`⚠️  ISSUE ${issuesFound}: NO CLIENT PROJECT LINK`);
          console.log(`   Project: ${project.kenmerk} - ${project.title}`);
          console.log(`   auditedByOrg: "${project.auditedByOrg}"`);
          console.log(`   Found ${clientProjects.length} possible client project(s):`);
          clientProjects.forEach((cp, index) => {
            console.log(`     ${index + 1}. ${cp.name} (ID: ${cp.id})`);
          });
          console.log('');
        }
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total projects checked: ${projects.length}`);
  console.log(`Issues found: ${issuesFound}`);

  if (issuesFound === 0) {
    console.log('✅ All projects are correctly linked!');
  } else {
    console.log('\n⚠️  Run fix-all-project-links.ts to fix these issues');
  }

  return issues;
}

checkAllProjectLinks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });