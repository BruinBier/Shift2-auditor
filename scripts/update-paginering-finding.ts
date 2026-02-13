import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePagineringFinding() {
  try {
    const finding = await prisma.quickFinding.findFirst({
      where: {
        title: {
          contains: 'Paginering'
        }
      }
    });

    if (!finding) {
      console.log('Paginering finding not found');
      return;
    }

    const updatedAdvice = `Zorg dat alle links in een ongeordende lijst geplaatst worden.

<em lang="en">Best practice</em> is dat deze paginering ook in een zogenaamd <em lang="en">landmark</em> wordt geplaatst. Voor de ziende bezoeker is vanuit de locatie op de pagina en het ontwerp direct duidelijk dat deze set aan links bedoeld is voor paginering. Deze zelfde informatie is niet direct duidelijk voor bezoekers die afhankelijk zijn van een schermlezer.

Bijvoorbeeld:
\`\`\`HTML
<nav aria-label="Meer artikelen" aria-roledescription="pagination">
	<ul>
		<li>
			<span>vorige </span><span class="sr-only"> pagina</span>
		</li>
		<li>
			<span class="sr-only">Pagina </span> <span>1</span>
		</li>
		<li>
			<a href="#"><span class="sr-only">Pagina </span> 2</a>
		</li>
		<li>
			<a href="#"><span class="sr-only">Pagina </span> 3</a>
		</li>
		<li>
			<a href="#">Volgende <span class="sr-only"> pagina</span></a>
		</li>
	</ul>
</nav>
\`\`\`
Zie voor meer informatie over goede paginatie het voorbeeld [<em lang="en">Accessible pagination</em> op Codepen.io](https://codepen.io/cardan-a11y/pen/azoRJNj).`;

    const updated = await prisma.quickFinding.update({
      where: { id: finding.id },
      data: {
        advice: updatedAdvice
      }
    });

    console.log('✅ Updated finding:', updated.title);
    console.log('\nNew advice:');
    console.log(updated.advice);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePagineringFinding();