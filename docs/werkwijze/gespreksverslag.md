# Werkwijze: gespreksverslag uit een transcript

Dit bestand is de enige plek waar staat hoe een gespreksverslag eruitziet. Claude Code volgt
het als het verslag wordt gevraagd, en de onderzoeker leest het om te weten wat hij kan
verwachten. Verander je iets aan het verslag, verander het dan hier en nergens anders.

Het verslag wordt buiten de tool gemaakt en geplakt in het blok Bespreekpunten, met de knop
"Gespreksverslag plakken". Er was een knop die het transcript naar OpenAI stuurde; die is op
15 september 2026 weggehaald, samen met de route erachter. Een gesprek met een klant gaat
niet naar een externe dienst omdat het verslag dan sneller klaar is.

## Wat je krijgt

- Het **transcript** van een gesprek tussen de onderzoeker van Shift2 en de klant, meestal
  een gemeente. Automatisch gemaakt door Teams: met versprekingen, herhalingen en soms een
  verkeerd verstane naam.
- De **open bespreekpunten**: wat de onderzoeker vóór het gesprek had opgeschreven om te
  vragen of te vertellen.
- Wat er over het onderzoek bekend is: kenmerk, website, opdrachtgever, of een extern
  bureau (Cardan) het onderzoek uitvoert.

## Wat je maakt

Een **kort** gespreksverslag, per bespreekpunt de uitkomst, en de scopevelden die uit het
gesprek volgen.

### Het verslag

Geen samenvatting van het gesprek. Alleen wat er is afgesproken en wat er nog moet
gebeuren. Wie later alleen dit verslag leest, moet weten wat er is besloten zonder het
transcript erbij te pakken.

Opbouw, in markdown:

1. Een kop: `## Gespreksverslag <soort gesprek> <datum>`. De soort haal je uit de inhoud
   (scopegesprek, klantgesprek, adviesgesprek); de datum uit het transcript, en als die er
   niet in staat de datum van vandaag.
2. Eén regel met wie erbij waren, met organisatie erachter. Namen zoals ze in het
   transcript staan; is een naam duidelijk verkeerd verstaan, gebruik dan de naam van de
   contactpersoon uit de projectgegevens.
3. Per onderwerp een vetgedrukt kopje en daaronder de afspraak in één of twee zinnen. Geen
   verloop van het gesprek ("eerst werd besproken..."), alleen het resultaat.
4. Onderaan een kop `**Acties**` met een lijstje: wie doet wat, en wanneer als dat is
   gezegd. Iets dat naar een ander moet (bij een Cardan-onderzoek vaak: terugkoppelen aan
   Cardan) staat hier als actie voor de onderzoeker. Het verslag verstuurt niets.

Lengte: bij een gesprek van een halfuur ongeveer tien tot vijftien regels. Liever te kort
dan te lang; wat er niet is afgesproken, staat er niet in.

Taal: Nederlands, zakelijk, in de tegenwoordige of voltooide tijd ("De gemeente levert...",
"Er is afgesproken dat..."). Geen gedachtestreepjes. Geen citaten uit het transcript.

### De uitkomst per bespreekpunt

Voor elk open bespreekpunt: is het aan bod gekomen, en wat is het antwoord?

- Aan bod gekomen: de uitkomst in één of twee zinnen, als antwoord op de vraag die in het
  punt stond. Staat er in het punt ook een vervolgstap ("moet terug naar Cardan"), dan
  noem je die niet in de uitkomst maar in de acties van het verslag.
- Niet aan bod gekomen: zeg dat, en verzin geen antwoord. Het punt blijft dan open voor
  een volgend gesprek.
- Twijfel: dan is het niet aan bod gekomen. Een gok in een uitkomst ziet er hetzelfde uit
  als een antwoord, en dat is precies wat er mis kan gaan.

### De scopevelden

Een scopegesprek levert bijna altijd twee dingen op die de klant zelf noemt. Vul ze, want ze
staan nergens anders: het transcript verdwijnt uit beeld zodra het verslag er is, en wie
later de steekproef samenstelt weet dan niet meer dat de klant om een bepaalde pagina vroeg.

- **Door de klant aangedragen pagina's** (`sampleClientPages`): pagina's waarvan de klant
  vraagt of zegt dat ze in de steekproef moeten. Ook als ze al voor de hand liggen.
- **Buiten scope** (`scopeOutOfScope`): wat in het gesprek is uitgesloten. Alleen wat er
  echt is gezegd; de wettelijke uitzonderingen horen hier niet, die staan in
  `scopeInfo` en vult de tool zelf.

Allebei één URL of omschrijving per regel, met een streepje ervoor. Beide velden staan op
**Details > Planning**, niet op het tabblad Scope. Ze gaan de planningsmail in, en met
`POST /api/projects/<id>/import-planning` worden er echte records van: `scopeInScope` en
`scopeOutOfScope` worden scope-URL's, `sampleClientPages` wordt een sample-item. Pas daarna
staan ze op het tabblad Scope en in de steekproef. Die route slaat bestaande URL's over, dus
hij mag meer dan eens draaien.

Twee dingen om niet te doen. **Niet raden**: een pagina die je uit een verbasterd transcript
moet afleiden leg je voor in plaats van in te vullen, want een verkeerde URL in de steekproef
ziet er hetzelfde uit als een goede. En **niet overschrijven**: staat er al iets, vul dan aan
en zeg wat er stond.

## Wat er daarna gebeurt

Het verslag komt als notitie bij het onderzoek te staan. De uitkomst per bespreekpunt
levert dit verslag als voorstel: de onderzoeker vult hem zelf in bij het punt en vinkt het
af. Zo blijft de onderzoeker degene die zegt wat er met de klant is afgesproken.

Hetzelfde geldt voor de scopevelden: leg ze voor voordat je ze wegschrijft, en zeg na het
wegschrijven of `import-planning` nog moet draaien om ze op het tabblad Scope te krijgen.
Meld ook dat de projectpagina met F5 ververst moet worden; die haalt zijn gegevens op bij
het laden en ziet een wijziging via de API niet vanzelf.
