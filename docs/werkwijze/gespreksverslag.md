# Werkwijze: gespreksverslag uit een transcript

Dit bestand is de enige plek waar staat hoe een gespreksverslag eruitziet. De tool leest het
als instructie voor de AI achter de knop "Maak gespreksverslag" (route
`app/api/projects/[id]/gespreksverslag`), Claude Code volgt het als het verslag met de hand
wordt gevraagd, en de onderzoeker leest het om te weten wat hij kan verwachten. Verander je
iets aan het verslag, verander het dan hier en nergens anders.

## Wat je krijgt

- Het **transcript** van een gesprek tussen de onderzoeker van Shift2 en de klant, meestal
  een gemeente. Automatisch gemaakt door Teams: met versprekingen, herhalingen en soms een
  verkeerd verstane naam.
- De **open bespreekpunten**: wat de onderzoeker vóór het gesprek had opgeschreven om te
  vragen of te vertellen.
- Wat er over het onderzoek bekend is: kenmerk, website, opdrachtgever, of een extern
  bureau (Cardan) het onderzoek uitvoert.

## Wat je maakt

Een **kort** gespreksverslag, en per bespreekpunt de uitkomst.

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

## Wat er daarna gebeurt

Het verslag komt als notitie bij het onderzoek te staan. De uitkomsten per bespreekpunt
zijn een **voorstel**: de onderzoeker neemt ze per punt over, en pas dan is het punt
afgevinkt. Zo blijft de onderzoeker degene die zegt wat er met de klant is afgesproken.
