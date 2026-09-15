# Werkwijze: gespreksverslag uit een transcript

Dit bestand is de enige plek waar staat hoe een gespreksverslag eruitziet. Claude Code volgt
het als het verslag wordt gevraagd, en de onderzoeker leest het om te weten wat hij kan
verwachten. Verander je iets aan het verslag, verander het dan hier en nergens anders.

Het verslag wordt buiten de tool gemaakt en geplakt in het blok Bespreekpunten, met de knop
"Gespreksverslag plakken". Er was een knop die het transcript naar OpenAI stuurde; die is op
15 september 2026 weggehaald, samen met de route erachter. Een gesprek met een klant gaat
niet naar een externe dienst omdat het verslag dan sneller klaar is.

Het transcript komt de tool niet in. In het blok Bespreekpunten staat een opdracht met het
projectId erin; die kopieert de onderzoeker en plakt hij met zijn transcript in de chat.
Het transcriptveld op Details > Planning is op 15 september 2026 weggehaald: een leeg veld
telde als ontbrekende stap en hield een onderzoek eindeloos op "transcript toevoegen", ook
als er niets te plakken viel omdat het Teams-transcript niet had aangestaan.

## Wat je krijgt

- Het **transcript** van een gesprek tussen de onderzoeker van Shift2 en de klant, meestal
  een gemeente. Automatisch gemaakt door Teams: met versprekingen, herhalingen en soms een
  verkeerd verstane naam. Het staat in de chat, achter de opdracht, en niet in de database.

  Soms is er geen transcript, omdat het opnemen niet aanstond. Dan vertelt de onderzoeker
  wat er is besproken en maak je daar het verslag van. Zeg niet dat het transcript
  ontbreekt en vraag er niet om: wat hij vertelt is wat er is. Vraag wel door als een
  bespreekpunt onbeantwoord blijft, en laat het punt open als hij het niet meer weet.
- De **open bespreekpunten**: wat de onderzoeker vóór het gesprek had opgeschreven om te
  vragen of te vertellen. Haal ze zelf op met het projectId uit de opdracht
  (`GET /api/projects/<id>/bespreekpunten`); ze worden niet meegestuurd.
- Wat er over het onderzoek bekend is: kenmerk, website, opdrachtgever, of een extern
  bureau (Cardan) het onderzoek uitvoert.

## Wat je maakt

Een **kort** gespreksverslag, per bespreekpunt de uitkomst, en opties voor scope en
steekproef waaruit de onderzoeker kiest.

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

### Opties voor scope en steekproef

Schrijf deze velden **niet** zelf weg. Leg opties voor en laat de onderzoeker kiezen: hij
weet welke pagina's samen de contenttypes dekken, en dat staat niet in het transcript.

Loop het gesprek na op twee dingen en zet per veld de kandidaten op een rij:

- **Door de klant aangedragen pagina's** (`sampleClientPages`): pagina's die de klant noemt.
  Maak onderscheid tussen een verzoek ("neem die pagina mee") en een pagina die langskomt
  als aandachtspunt (de video staat erop, de visual valt op). Allebei zijn kandidaten,
  maar dat verschil bepaalt het antwoord, dus zeg erbij welke van de twee het is.
- **Buiten scope** (`scopeOutOfScope`): wat in het gesprek wordt uitgesloten. Alleen een
  echte afspraak. Een constatering over de site ("er staan geen PDF's op") is geen
  uitsluiting; zet die in het verslag en niet in dit veld. De wettelijke uitzonderingen
  horen er ook niet in: die staan in `scopeInfo` en vult de tool zelf.

Zeg per kandidaat waar hij vandaan komt, met het tijdstip of een korte aanduiding uit het
gesprek. Ontbreekt de URL, zeg dat dan: `import-planning` slaat een regel zonder URL over,
dus een omschrijving wordt geen sample-item. Is er voor een veld niets gezegd, zeg dan dat
er niets is en laat het leeg.

Raad nooit een URL uit een verbasterd transcript; een verkeerde pagina in de steekproef ziet
er hetzelfde uit als een goede. Staat er al iets in een veld, noem dat dan, en stel voor om
aan te vullen in plaats van te overschrijven.

Na de keuze van de onderzoeker doe je beide stappen zelf, zonder dat hij ergens hoeft te
klikken:

1. `PATCH /api/projects/<id>` met de gekozen regels (één pagina per regel, met een streepje
   ervoor). Beide velden staan op **Details > Planning**, niet op het tabblad Scope, en ze
   gaan de planningsmail in.
2. `POST /api/projects/<id>/import-planning` maakt er echte records van: `scopeInScope` en
   `scopeOutOfScope` worden scope-URL's, `sampleClientPages` wordt een sample-item. Pas
   daarna staan ze op het tabblad Scope en in de steekproef. De route slaat bestaande URL's
   over, dus hij mag meer dan eens draaien.

De knop "Importeer naar scope & steekproef" op de projectpagina doet dezelfde tweede stap;
die is voor als de onderzoeker de velden zelf heeft bewerkt. Doe je het hier, gebruik dan de
route en zeg wat eruit kwam: hoeveel scope-URL's en sample-items erbij zijn gekomen, en wat
is overgeslagen omdat het er al stond of geen URL bevatte.

## Wat er daarna gebeurt

Het verslag komt als notitie bij het onderzoek te staan. De uitkomst per bespreekpunt
levert dit verslag als voorstel: de onderzoeker vult hem zelf in bij het punt en vinkt het
af. Zo blijft de onderzoeker degene die zegt wat er met de klant is afgesproken.

De scopevelden blijven tot dan leeg: die schrijf je pas weg als de onderzoeker uit de
voorgelegde opties heeft gekozen. Meld daarna dat de projectpagina met F5 ververst moet
worden; die haalt zijn gegevens op bij het laden en ziet een wijziging via de API niet
vanzelf.
