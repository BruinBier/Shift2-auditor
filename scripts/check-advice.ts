import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const finding = await prisma.quickFinding.findFirst({
    where: {
      title: 'PDF - Afbeeldingen niet-getagde PDF'
    }
  });

  if (finding) {
    console.log('Title:', finding.title);
    console.log('Advice:');
    console.log(finding.advice);
    console.log('\nAdvice (raw):');
    console.log(JSON.stringify(finding.advice));
  } else {
    console.log('Finding not found!');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });