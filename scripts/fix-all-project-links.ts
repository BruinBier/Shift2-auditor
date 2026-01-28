import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllProjectLinks() {
  console.log('\n=== Fixing All Project Links ===\n');

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

  let fixedCount = 0;

  for (const project of projects) {
    let needsUpdate = false;
    const updateData: any = {};

    // Fix 1: Project has clientProject but auditedByOrg doesn't match
    if (project.clientProject && project.auditedByOrg !== project.clientProject.opdrachtgever.naam) {
      needsUpdate = true;
      updateData.auditedByOrg = project.clientProject.opdrachtgever.naam;

      console.log(`🔧 Fixing MISMATCH for ${project.kenmerk}`);
      console.log(`   Changing auditedByOrg: "${project.auditedByOrg}" → "${project.clientProject.opdrachtgever.naam}"`);
    }

    // Fix 2: Project has no clientProject but could be linked
    if (!project.clientProject && project.auditedByOrg) {
      // Try to find a matching opdrachtgever and client project
      const opdrachtgever = await prisma.opdrachtgever.findFirst({
        where: { naam: project.auditedByOrg },
      });

      if (opdrachtgever) {
        const clientProjects = await prisma.clientProject.findMany({
          where: { opdrachtgeverId: opdrachtgever.id },
        });

        if (clientProjects.length === 1) {
          // Only auto-link if there's exactly one client project for this opdrachtgever
          needsUpdate = true;
          updateData.clientProjectId = clientProjects[0].id;

          console.log(`🔧 Fixing NO LINK for ${project.kenmerk}`);
          console.log(`   Linking to client project: ${clientProjects[0].name}`);
        } else if (clientProjects.length > 1) {
          console.log(`⚠️  Multiple client projects for ${project.kenmerk} - skipping auto-link`);
          console.log(`   Manual intervention needed. Available projects:`);
          clientProjects.forEach((cp, index) => {
            console.log(`     ${index + 1}. ${cp.name} (ID: ${cp.id})`);
          });
        }
      }
    }

    // Apply updates if needed
    if (needsUpdate) {
      await prisma.project.update({
        where: { id: project.id },
        data: updateData,
      });
      fixedCount++;
      console.log(`   ✅ Fixed!\n`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total projects checked: ${projects.length}`);
  console.log(`Projects fixed: ${fixedCount}`);

  if (fixedCount === 0) {
    console.log('✅ No fixes needed - all projects are correctly linked!');
  } else {
    console.log(`✅ Successfully fixed ${fixedCount} project(s)!`);
  }
}

fixAllProjectLinks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });