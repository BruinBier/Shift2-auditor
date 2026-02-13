import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAllPagineringFindings() {
  try {
    // Finding 1: Paginering lijst, geen landmark (1.3.1)
    await prisma.quickFinding.update({
      where: { id: '9d78b59e-18c4-435d-b1a3-09527adb914e' },
      data: {
        description: `Op pagina URL staat een overzicht van artikelen met daaronder links om naar andere pagina's te gaan. Deze paginering is goed opgemaakt als een lijst. Complimenten daarvoor!

Het zou beter zijn om de paginering een zogenaamd <em lang="en">landmark</em> te plaatsen. Voor de ziende bezoeker is vanuit de locatie op de pagina en het ontwerp direct duidelijk dat deze set aan links bedoeld is voor paginering. Deze zelfde informatie is niet direct duidelijk voor bezoekers die afhankelijk zijn van een schermlezer.`,
        advice: `Plaats de lijst met links in een nav-element. Voorzie dit nav-element van een goede toegankelijkheidsnaam. Bijvoorbeeld:
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
Zie voor meer informatie over goede paginatie het voorbeeld [<em lang="en">Accessible pagination</em> op Codepen.io](https://codepen.io/cardan-a11y/pen/azoRJNj).`
      }
    });
    console.log('✅ Updated: Paginering lijst, geen landmark (1.3.1)');

    // Finding 2: Paginering (2.4.4)
    await prisma.quickFinding.update({
      where: { id: 'd40b8ad5-6445-4fc2-918b-54f387e92d4f' },
      data: {
        advice: `Zorg dat alle links in een ongeordende lijst geplaatst worden en dat het linkdoel van iedere link duidelijk is. Dat kan gedaan worden door, eventueel <em>visueel verborgen</em>, tekst toe te voegen aan de links.

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

Een voorbeeld van de juiste CSS voor de class \`sr-only\` is:
\`\`\`CSS
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}
\`\`\`
Verschillende frameworks bieden varianten van de sr-only-class.

Zie voor meer informatie over goede paginatie het voorbeeld [<em lang="en">Accessible pagination</em> op Codepen.io](https://codepen.io/cardan-a11y/pen/azoRJNj).`
      }
    });
    console.log('✅ Updated: Paginering (2.4.4)');

    console.log('\n🎉 All Paginering findings updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllPagineringFindings();