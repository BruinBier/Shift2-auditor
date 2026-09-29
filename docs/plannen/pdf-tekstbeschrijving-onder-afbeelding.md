# Tekstbeschrijving onder een afbeelding in een bestaande PDF

**Status:** ONDERZOEK, nog niets gebouwd (25 september 2026)
**Fase:** 1, zichtbare tekst toevoegen; nog niets met PDF-tags
**Afbakening:** een los onderdeel; bestaande functionaliteit van de Auditor blijft ongemoeid

## De vraag

In een bestaande, ongetagde PDF een afbeelding, infographic, grafiek of diagram kiezen, een
tekstbeschrijving invoeren, en die als echte tekst direct onder de afbeelding plaatsen. Er
moet altijd ruimte gemaakt worden: wat eronder staat schuift naar beneden, en wat daardoor
over de onderrand valt loopt door naar de volgende pagina. Bestaande inhoud mag niet bedekt
of verwijderd worden. De toegevoegde tekst moet zichtbaar, selecteerbaar, doorzoekbaar en
later te taggen zijn.

## Conclusie

| Onderdeel | Betrouwbaar? |
|---|---|
| Echte, zichtbare, selecteerbare en doorzoekbare tekst toevoegen | **Ja**, met elke genoemde bibliotheek |
| Bestaande inhoud op dezelfde pagina naar beneden schuiven | **Alleen bij eenvoudige opmaak**: één kolom, geen vlakken of kaders die over de snijlijn lopen |
| Wat over de onderrand valt door laten lopen naar de volgende pagina | **Nee.** Geen enkele bibliotheek of SDK kan dat, ook de commerciële niet |

## Waarom dit moeilijk is: een PDF heeft geen doorloop

Een PDF-pagina is een lijst tekeninstructies met vaste coördinaten: "zet deze tekens op
x=72, y=540", "trek hier een lijn". Een alinea bestaat in die lijst niet. Wat een lezer als
"de bestaande alinea" ziet, zijn voor de PDF veertig losse tekstfragmenten, elk met een eigen
positie. Een ongetagde PDF heeft ook geen structuur die zegt wat bij elkaar hoort.

"Inhoud naar beneden schuiven" bestaat daarom uit drie stappen:

1. **Weten wat er staat.** De instructies ontleden tot objecten met een omsluitende
   rechthoek. Dat lukt goed.
2. **Beslissen wat "onder de afbeelding" is.** Dit is het zwakke punt, en het werkt met
   aannames. Het gaat mis bij:
   - **kolommen:** onder de afbeelding in de linkerkolom zegt niets over de rechterkolom;
   - **objecten die de snijlijn kruisen:** een achtergrondvlak, een kaderlijn of een
     watermerk;
   - **kop- en voettekst en paginanummer:** die moeten juist blijven staan;
   - **groepen van tekeninstructies:** één Form XObject kan zowel boven als onder de lijn
     tekenen, en is dan niet te splitsen zonder hem te herschrijven.
3. **Verschuiven.** Dat is op zich betrouwbaar. Maar kleur, lettertype en uitsnijding erven
   over van eerdere instructies, dus zomaar knippen breekt de weergave. Links en
   formuliervelden staan bovendien niet in die lijst maar los op de pagina. Hun klikgebied
   moet apart mee, anders staat het naast de tekst.

## Waarom doorlopen naar de volgende pagina niet betrouwbaar kan

- **Het houdt niet op.** Wat naar pagina 2 gaat, duwt de inhoud van pagina 2 omlaag, die
  duwt pagina 3, en zo verder door het hele document.
- **Splitsen kan alleen tussen regels.** Een tabel, afbeelding of kader dat op de
  paginagrens valt, kan niet gesplitst worden.
- **Paginanummers, inhoudsopgave en interne links** kloppen daarna niet meer. Nieuwe
  pagina's hebben geen kop- en voettekst.

In feite is dat het hele document opnieuw opmaken, en dat doet geen enkele SDK. Ook Acrobat
Pro doet het niet: "Tekst bewerken" herschikt alleen binnen één tekstvak. De Reflow-module
van Apryse maakt HTML om te lezen en schrijft niet terug naar de PDF.

## De bibliotheken vergeleken

| | Tekst toevoegen | Objecten verplaatsen | Rechthoek per object bepalen | Doorlopen naar volgende pagina | Licentie |
|---|---|---|---|---|---|
| **Apache PDFBox** (Java) | ja | alles zelf bouwen, inclusief het bijhouden van kleur en lettertype | tekst goed, lijnen en afbeeldingen zelf | nee | Apache 2.0, gratis |
| **iText 9** | ja | geen functie om te verplaatsen; pdfSweep kan inhoud in een gebied wel echt verwijderen | goed | nee | AGPL of commercieel |
| **Apryse SDK** | ja | **ja**: per element lezen, positie aanpassen, terugschrijven (het sterkste model) | ja | nee | commercieel |
| **Foxit PDF SDK** | ja | **ja**: per tekenobject de positie aanpassen | ja | nee | commercieel |
| **PyMuPDF** (al in het project) | ja | niet direct | uitstekend, per tekeninstructie | nee | AGPL of commercieel |
| **pikepdf** (al in het project) | omslachtig | de instructies lezen en terugschrijven, maar alles zelf | nee, geen geometrie | nee | MPL, gratis |
| **pdf-lib** (al in het project) | ja | kan de tekeninstructies niet lezen | nee | nee | ongeschikt |

Er is geen betere bibliotheek die het wel kan. De grens ligt in het PDF-formaat, niet in de
bibliotheek. Apryse en Foxit besparen veel eigen code bij het verplaatsen, maar maken het
beslissen wat eronder staat niet betrouwbaarder.

## Twee manieren om binnen een pagina te schuiven

**A. Per object verplaatsen.** Met Apryse of Foxit, of zelf gebouwd met PyMuPDF plus pikepdf
of met PDFBox.
- Voordeel: het resultaat is schoon. Elke tekst bestaat één keer, blijft selecteerbaar en kan
  later getagd worden.
- Nadeel: het gaat mis bij de gevallen uit stap 2 hierboven.

**B. Knippen en schuiven.** De pagina wordt twee keer getekend, elk met een uitsnede: het
deel boven de lijn op zijn plek, het deel eronder lager.
- Voordeel: de pagina ziet er altijd goed uit, ook bij ingewikkelde opmaak.
- Nadeel: wat buiten de uitsnede valt, staat er onzichtbaar nog in. Selecteren, zoeken en
  voorlezen geven de tekst dan dubbel.
- Dat is alleen op te lossen door die inhoud echt te verwijderen. Tekst die over de
  snijlijn loopt, raakt dan hele tekens of regels kwijt.

Route B is een omweg. Hij staat hier alleen om te bespreken, niet als voorstel.

## Het toegevoegde tekstblok

Dat deel is eenvoudig:
- een eigen, volledig ingesloten lettertype;
- een koppeling van tekens naar Unicode (ToUnicode), anders is de tekst niet doorzoekbaar;
- een eigen blok in de pagina-inhoud, zodat het later getagd kan worden.

Het lettertype van het document zelf is meestal niet bruikbaar: daar zitten vaak alleen de
tekens in die het document al gebruikt.

## Voorstel voor het proof of concept

De vraag of het betrouwbaar werkt, hangt meer af van de PDF's die in audits langskomen dan
van de bibliotheek.

1. **Een proefset van 10 tot 15 echte PDF's.** Per PDF vaststellen: één of meer kolommen,
   achtergrondvlakken, kop- en voettekst. Daaruit blijkt welk deel route A überhaupt aankan.
2. **Een controle na afloop.** Maak het betrouwbaar door na elke bewerking te toetsen in
   plaats van te hopen dat het goed ging:
   - staat alle tekst van vóór er nog;
   - overlapt er niets;
   - staat er niets buiten de pagina?

   Faalt die controle, dan weigert de tool en beslist de onderzoeker.
3. **Techniek:** Python als backend. Eerst PyMuPDF (bepalen wat eronder staat) met pikepdf
   (herschrijven), want die staan er al en kosten niets. Blijkt het verplaatsen zelf te
   bewerkelijk, dan een proeflicentie van Apryse om te vergelijken.
   - PyMuPDF valt onder AGPL. Voor eigen intern gebruik is dat meestal geen probleem, maar
     het wordt anders als de tool naar buiten gaat.

## Proefmeting: TESTPDF.pdf (25 september 2026)

Eerste PDF van de proefset: 166 pagina's, ongetagd, gemaakt met Aspose.PDF. Het zijn twee
documenten achter elkaar: een Word-export van de gemeente (p. 1-99) en een rapport van
Bureau Stadsnatuur (p. 100-166). Gemeten met PyMuPDF; er is niets aan de PDF veranderd.

**68 figuren** (afbeeldingen breder dan 150 en hoger dan 60 punten; het logo in de kop van
deel 2 telt niet mee).

| | Deel 1 (Word) | Deel 2 (bSR) |
|---|---|---|
| Figuren | 45 | 23 |
| Vrije ruimte onderaan de pagina, mediaan | 52 pt | 39 pt |
| Past 1 regel (15 pt) | 42 | 21 |
| Past 2 regels (30 pt) | 36 | 18 |
| Past 3 regels (45 pt) | 25 | 10 |

Wat de opmaak betreft is dit het gunstigste geval:

- **Eén kolom overal.** Er staat nergens tekst naast een figuur.
- **Niets kruist de snijlijn.** Geen achtergrondvlak, kader of lijn loopt van boven de
  afbeelding naar eronder.
- **Deel 1 is netjes opgebouwd.** Elk tekstfragment staat in een eigen blok met zijn eigen
  kleur en lettertype, dus het is los te verschuiven zonder iets van zijn voorganger te
  erven.
- **Kop en voet zijn herkenbaar.** In deel 1 zijn ze nog gemarkeerd als paginering (de
  structuurboom is weg, de markeringen niet). In deel 2 staan ze tussen twee vaste lijnen
  op 57 en 795 pt.

Toch past bij **half van de figuren (33 van 68) geen drie regels** zonder dat er iets naar de
volgende pagina moet. Een echte beschrijving van een kaart of infographic is vaak langer dan
drie regels. Deel 1 is een Word-document met afbeeldingen die zo groot mogelijk op de pagina
zijn gezet, en de pagina's zijn vol.

Het doorlopen naar een volgende pagina zou hier ook raken aan **120 interne links** (de
inhoudsopgave op p. 2-4) en de bladwijzers, die allemaal naar een vaste pagina en positie
wijzen.

Conclusie van deze meting: **schuiven binnen de pagina is voor dit document technisch goed
te doen, maar lost het probleem voor ongeveer de helft van de figuren niet op.** Hoe er
met de rest omgegaan wordt, is de open vraag hieronder, en die weegt zwaarder dan eerst
leek.

## Besluit: alleen binnen de pagina (25 september 2026)

**Past de beschrijving niet op de pagina, dan meldt de tool dat en verandert hij niets.** Er
loopt geen inhoud door naar een volgende pagina. Daarmee valt het deel af dat niet
betrouwbaar kan, en blijven links, bladwijzers en paginanummers vanzelf kloppen.

Voor het proof of concept betekent dit:
- vooraf uitrekenen hoeveel ruimte de beschrijving nodig heeft en hoeveel er vrij is tot
  de voettekst;
- is dat te weinig, dan een melding met beide getallen, zodat de onderzoeker kan inkorten
  of voor het brondocument kan kiezen;
- past het wel, dan schuiven, plaatsen en daarna de controle uit het voorstel hierboven.

## Besluit: de beschrijving komt onder het bijschrift (25 september 2026)

Staat er een bijschrift onder de figuur, dan komt de beschrijving daaronder. Staat er geen,
dan direct onder de afbeelding. De vrije ruimte verandert daar niet door: wat er onder het
invoegpunt staat schuift net zo ver omlaag.

De tool moet dus herkennen wat een bijschrift is. In TESTPDF.pdf, bij de 68 figuren:

| Wat staat er direct onder | Aantal |
|---|---|
| Een bijschrift dat begint met "Afbeelding", "Figuur" en dergelijke, 7 tot 9 pt eronder | 36 |
| Nog een afbeelding (twee of drie foto's onder elkaar, één bijschrift onder de groep) | 20 |
| Gewone tekst of niets: geen bijschrift | 12 |

Herkennen op het beginwoord en de korte afstand lukt hier goed. Bij een andere PDF kan een
bijschrift er anders uitzien; toont de tool daarom vooraf waar hij de beschrijving wil
zetten, dan kan de onderzoeker dat corrigeren.

## Open punten

Er komt geen omweg voor het doorlopen naar de volgende pagina zonder dat die eerst besproken
is. Gekozen is mogelijkheid 1. De mogelijkheden waren:

1. **Past het niet op de pagina, dan melden en niets doen.** De tool schuift alleen binnen
   de pagina.
2. **De pagina langer maken.** Niets hoeft naar de volgende pagina, maar het paginaformaat
   wijkt af, en dat valt op bij afdrukken.
3. **De beschrijving op een ingevoegde pagina direct erna.** Dat is niet "direct onder de
   afbeelding".
4. **Terug naar het brondocument.** In Word is dit één alinea toevoegen en opnieuw
   exporteren. Als het brondocument er is, is dat altijd betrouwbaarder dan de PDF bewerken.

Nog te beantwoorden:
- Bij foto's onder elkaar met één bijschrift onder de groep: komt de beschrijving van één
  foto onder dat gezamenlijke bijschrift, of beschrijft de onderzoeker dan de hele groep?
- Is er een proefset met PDF's?
- Is er budget voor een commerciële licentie, als Apryse of Foxit duidelijk beter blijkt?
