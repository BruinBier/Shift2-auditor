# Werkwijze: het gesprek verwerken

Dit bestand is de enige plek waar staat hoe een gesprek wordt verwerkt. Claude Code volgt
het als de onderzoeker erom vraagt, en de onderzoeker leest het om te weten wat hij kan
verwachten. Verander je iets, verander het dan hier en nergens anders.

Wat er uit het gesprek komt, komt als **uitkomst bij het bespreekpunt** te staan, en nergens
anders. Er was een knop die het hele gespreksverslag als notitie bewaarde; die is op
16 september 2026 weggehaald. Dat verslag herhaalde grotendeels de uitkomsten die al bij de
punten stonden, en van twee plekken met dezelfde afspraken wordt er één niet meer gelezen.
De uitkomst bij het punt is de plek die je bij een volgend gesprek terugpakt.

Eerder zat hier een knop die het transcript naar OpenAI stuurde; die ging op 15 september
2026 weg, samen met de route erachter. Een gesprek met een klant gaat niet naar een externe
dienst omdat het verslag dan sneller klaar is.

**Claude Code schrijft de uitkomsten niet weg.** Ze komen in de chat, de onderzoeker schaaft
ze bij en plakt ze zelf bij het punt. Wat er met de klant is afgesproken bepaalt hij.

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
  wat er is besproken en stel je daar de uitkomsten uit op. Zeg niet dat het transcript
  ontbreekt en vraag er niet om: wat hij vertelt is wat er is. Vraag wel door als een
  bespreekpunt onbeantwoord blijft, en laat het punt open als hij het niet meer weet.
- De **open bespreekpunten**: wat de onderzoeker vóór het gesprek had opgeschreven om te
  vragen of te vertellen. Haal ze zelf op met het projectId uit de opdracht
  (`GET /api/projects/<id>/bespreekpunten`); ze worden niet meegestuurd.
- Wat er over het onderzoek bekend is: kenmerk, website, opdrachtgever, of een extern
  bureau (Cardan) het onderzoek uitvoert.

## Wat je maakt

Per bespreekpunt de uitkomst, en opties voor scope en steekproef waaruit de onderzoeker
kiest. Geen lopend verslag: wat er is afgesproken hoort bij het punt waar het over ging.

### De uitkomst per bespreekpunt

Voor elk open bespreekpunt: is het aan bod gekomen, en wat is het antwoord?

- Aan bod gekomen: de uitkomst in één of twee zinnen, als antwoord op de vraag die in het
  punt stond. Begin met "Besproken." en dan de afspraak. Staat er in het punt ook een
  vervolgstap ("moet terug naar Cardan"), noem die dan bij de acties en niet in de uitkomst.
- Niet aan bod gekomen: zeg dat, en verzin geen antwoord. Het punt blijft dan open voor
  een volgend gesprek.
- Twijfel: dan is het niet aan bod gekomen. Een gok in een uitkomst ziet er hetzelfde uit
  als een antwoord, en dat is precies wat er mis kan gaan.

Taal: Nederlands, zakelijk, in de tegenwoordige of voltooide tijd ("De gemeente levert...",
"Er is afgesproken dat..."). Geen gedachtestreepjes. Geen citaten uit het transcript.

### Wat bij geen enkel punt hoort

Een gesprek levert bijna altijd meer op dan er punten stonden: een video die opvalt, een
afspraak om pagina's niet te wijzigen, een verouderde toegankelijkheidsverklaring. Zet dat
onder een kopje **Verder besproken** in de chat, met per onderwerp de afspraak in één of
twee zinnen, en daaronder **Acties**: wie doet wat, en wanneer als dat is gezegd.

De onderzoeker beslist wat daarmee gebeurt. Meestal wordt het een nieuw bespreekpunt, of
het staat al ergens anders in de tool thuis (een technisch issue, een aantekening bij de
scope). Maak zelf geen bespreekpunt aan en schrijf niets weg; leg het voor.

Is een naam in het transcript duidelijk verkeerd verstaan, gebruik dan de naam van de
contactpersoon uit de projectgegevens. Kun je hem niet thuisbrengen, laat hem dan weg en
zeg dat erbij.

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
  uitsluiting; zet die onder "Verder besproken" en niet in dit veld. De wettelijke uitzonderingen
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

De onderzoeker plakt de uitkomst bij het punt en vinkt het af. Zo blijft hij degene die
zegt wat er met de klant is afgesproken.

De voorbereidingsstap **"Gesprek verwerkt"** leest daaraan af of het gesprek is verwerkt:
hij staat op groen zodra elk bespreekpunt is afgevinkt én een uitkomst heeft. Een afgevinkt
punt zonder uitkomst telt niet -- dan staat er wel dat het langskwam, maar niet wat eruit
kwam, en dat laatste is waar de stap over gaat. Zijn er geen bespreekpunten, dan valt er
niets te meten en vink je de stap met de hand af.

De scopevelden blijven tot dan leeg: die schrijf je pas weg als de onderzoeker uit de
voorgelegde opties heeft gekozen. Meld daarna dat de projectpagina met F5 ververst moet
worden; die haalt zijn gegevens op bij het laden en ziet een wijziging via de API niet
vanzelf.
