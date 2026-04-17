# Voorbeelden bevindingen

Deze voorbeelden dienen als referentie voor de schrijfstijl, structuur en toon van bevindingen in WCAG-audits. Claude gebruikt deze voorbeelden om consistente bevindingen te schrijven conform de Richtlijnen Bevindingen Cardan Auditor.

---

## Voorbeeld 1 – Video met automatische ondertiteling (Fout)

- **SC:** 1.2.2
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op de pagina https://www.op-morgen.nl/het-verhaal-van-david-en-esther-uit-vierakker staat een YouTube-video. Deze video heeft een automatisch gegenereerde ondertiteling. Deze vorm van ondertiteling bevat echter te veel fouten om te voldoen aan dit succescriterium. Zo worden bijvoorbeeld geen leestekens gebruikt, wat het lezen van de tekst moeilijker maakt. Daarnaast komen ook fouten voor in de vertaling naar tekst. Voorbeelden daarvan zijn:

- Esther: 'moeten we in ieder geval geen gas gaan gebruiken'. Ondertiteling: 'moeten we niet van geen gassen gaan gebruiken'. (00.24)
- Esther: 'maar we wilden ook gewoon echt een fijn huis om in te wonen'. Ondertiteling: 'maar wilde kon haar te fijn huizen met de woon en'. (00.30)

**Advies:**
Via YouTube Studio is de automatische ondertiteling eenvoudig te corrigeren. Zie voor uitleg de pagina Ondertiteling bewerken of verwijderen op YouTube Help.

---

## Voorbeeld 2 – Ontbrekende audiodescriptie (Fout)

- **SC:** 1.2.5
- **Oordeel:** Afgekeurd
- **Impact:** Matig
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Onder succescriterium 1.2.3 is een video beschreven waarbij audiodescriptie of een media-alternatief ontbreekt. Dit wordt ook afgekeurd onder dit succescriterium. Het gaat hierbij om de video op de pagina https://www.op-morgen.nl/het-verhaal-van-david-en-esther-uit-vierakker.

**Advies:**
Voor dit succescriterium is audiodescriptie verplicht (niveau AA), waar ruimte is in het standaard audiospoor om deze informatie te geven. Er is in deze video voldoende ruimte hiervoor aanwezig. Een media-alternatief is hier niet meer toegestaan als oplossing. Dit is van belang voor mensen die de video's niet (goed) kunnen zien.

---

## Voorbeeld 3 – Lijst niet als lijst opgemaakt (Fout)

- **SC:** 1.3.1
- **Oordeel:** Afgekeurd
- **Impact:** Matig
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op de pagina https://www.op-morgen.nl/kennis-en-netwerksessies-basiskwaliteit-natuur-voor-gelderse-vrijwilligers staat onder de kop 'Verschillende soorten vrijwilligers' een lijst die niet als lijst is opgemaakt. Hierdoor kan hulpsoftware bijvoorbeeld niet presenteren dat dit een lijst is of uit hoeveel items deze bestaat. Dit helpt bij het begrip van de tekst.

Op de website komen vaker problemen voor met lijsten, zo ook op:

- De pagina https://www.op-morgen.nl/als-huiseigenaar waar een lijst met quotes staat.

**Advies:**
Gebruik voor de opmaak van ongeordende lijsten het ul-element. De lijst-items moeten zich bevinden in een li-element.

---

## Voorbeeld 4 – Kop zonder inhoud door verkeerde hiërarchie (Fout)

- **SC:** 1.3.1
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op pagina https://www.op-morgen.nl/als-huiseigenaar staat een opsomming met 4 items die uitgevouwen kunnen worden. Item 4 heeft de kop "4. Je CV-ketel vervangen (door bijvoorbeeld een elektrische warmtepomp)". Deze kop is in een h2-element geplaatst. Deze kop wordt direct opgevolgd door de h2-kop "Warmteoplossing". Hierdoor heeft de eerstgenoemde h2-kop geen inhoud en dat is niet de bedoeling.

Dit probleem komt ook voor op pagina https://www.op-morgen.nl/minder-afval bij de uitvouwbare onderdelen.

**Advies:**
De kop "Warmteoplossing" en bijbehorende inhoud valt hierarchisch gezien onder de content van de kop "4. Je CV-ketel vervangen (door bijvoorbeeld een elektrische warmtepomp)". Zorg dat dit ook in de hierarchie van de koppen terugkomt, door bijvoorbeeld de kop "Warmtepomp" en de vergelijkbare koppen in dit onderdeel aan te passen naar h3-elementen.

---

## Voorbeeld 5 – PDF niet getagd (Fout)

- **SC:** 1.3.1
- **Oordeel:** Afgekeurd
- **Impact:** Serieus
- **Verantwoordelijke:** Redacteur

**Bevinding:**
De PDF-documenten 'Warmtepomp check' en 'Presentatie themabijeenkomst warmtetransitie' zijn niet getagd. Dit wil zeggen dat er geen structuur is aangegeven in het bestand door middel van tags. Hulpsoftware (zoals een screenreader) kan hierdoor niet bepalen wat koppen, lijsten en dergelijke zijn en zal afbeeldingen negeren.

**Advies:**
Als het bestand correct getagd wordt, kan hulpsoftware beter de structuur en relaties bepalen. Bij koppen kan dan bijvoorbeeld worden voorgelezen dat dit koppen zijn. In veel gevallen kan dit probleem worden opgelost door het document vanuit het bronbestand (meestal in Word of InDesign) opnieuw te exporteren naar PDF, maar dan inclusief tags of labels.

Omdat nu de tags ontbreken, kunnen andere succescriteria zoals 1.1.1 en 1.3.2 niet onderzocht worden. Let daarom op dat bij het oplossen van dit probleem nieuwe toegankelijkheidsproblemen kunnen ontstaan.

---

## Voorbeeld 6 – Codevolgorde wijkt af van visuele volgorde (Opmerking)

- **SC:** 1.3.2
- **Oordeel:** Opmerking
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op pagina https://www.op-morgen.nl/als-je-toch-bezig-bent staan diverse artikelen in een overzicht. Bij elk artikel is een foto (voorzien van een tekstalternatief), een kop, een stuk tekst en een link aanwezig. De afbeeldingen zijn content die bij de koppen horen, maar staat in de code boven de koptekst in plaats van eronder. Dit kan tot problemen leiden, omdat gebruikers dan kunnen denken dat deze content hoort bij een andere, bovenliggende kop. Dit speelt vooral voor gebruikers die de webpagina niet visueel zien, maar afhankelijk zijn van de volgorde in de code, bijvoorbeeld bij het gebruik van hulpsoftware. Dit is een technisch probleem en is dus niet afgekeurd.

**Advies:**
Indien het mogelijk is om in het CMS deze afbeeldingen als decoratief aan te geven, zou dat een oplossing kunnen bieden voor dit probleem. Indien dit probleem niet in de content opgelost kan worden, kan dit aan de technische kant opgelost worden door in de code de content daadwerkelijk onder de kop te zetten waar het bij hoort. Via CSS kan het dan zo opgemaakt worden dat er visueel niets hoeft te veranderen. Dit kan bijvoorbeeld via de eigenschap "order".

---

## Voorbeeld 7 – Onvoldoende kleurcontrast (Fout)

- **SC:** 1.4.3
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Ontwerper

**Bevinding:**
In het PDF-document 'Warmtepomp check' staat onder het logo de groene tekst 'Voor ons klimaat' op een witte achtergrond. Deze tekst `#8BC640` heeft niet voldoende contrast met de achtergrond `#FFFFFF`. Het kleurcontrast is 2,0:1.

**Advies:**
Het contrast van normale tekst moet minimaal 4,5:1 zijn en voor grote tekst minimaal 3,0:1.

---

## Voorbeeld 8 – Informatieve afbeelding zonder alt-tekst (Fout)

- **SC:** 1.1.1
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op pagina https://www.avres.nl/op-zoek-naar-tijdelijk-ander-werk staat een afbeelding zonder tekstalternatief. Het gaat om de afbeelding met het logo van Werkcentrum Gorinchem. Omdat het hier om een informatieve afbeelding gaat, moet deze afbeelding een tekstalternatief krijgen.

**Advies:**
Geef de afbeelding een correcte omschrijving waarin alle zichtbare tekst terugkomt. Gebruik hiervoor het alt-attribuut.

---

## Voorbeeld 9 – Logo zonder alt-tekst (Fout)

- **SC:** 1.1.1
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op pagina https://www.avres.nl/hulp-bij-schulden staat een afbeelding zonder tekstalternatief. Het gaat om de afbeelding met het logo van NVVK. Omdat een logo altijd een informatieve afbeelding is, moet deze afbeelding een tekstalternatief krijgen.

**Advies:**
Geef de afbeelding een correcte omschrijving waarin alle zichtbare tekst terugkomt. Gebruik hiervoor het alt-attribuut.

---

## Voorbeeld 10 – Inconsistent gebruik alt-attributen bij foto's (Fout)

- **SC:** 1.1.1
- **Oordeel:** Afgekeurd
- **Impact:** Klein
- **Verantwoordelijke:** Redacteur

**Bevinding:**
Op https://www.avres.nl/uw-contactpersoon-bij-avres staan foto's van medewerkers. De afbeeldingen van Tim Verdier, Marc van Riel en Mariska Terlouw hebben een leeg alt-attribuut. De overige foto's op deze pagina hebben wel een gevuld alt-attribuut.

**Advies:**
Laat bij alle foto's het alt-attribuut leeg zodat ze decoratief worden. De naam van de persoon staat immers al onder de foto. Door het alt-attribuut leeg te laten voorkom je dat hulpsoftware twee keer dezelfde naam opleest.
