# Wat beoordeel je per sample: header, main of footer?

Deze regel geldt voor **alle** succescriteria en bepaalt welk deel van de pagina je
überhaupt bekijkt. Pas hem toe vóór je aan een criterium begint.

## De regel

| Sample | Wat je beoordeelt |
|---|---|
| **Homepage** (het eerste sample van de website) | header, main-content **én** footer |
| **Elk ander sample** | **alleen de main-content** |

Op een vervolgpagina sla je header en footer volledig over: geen tekstalternatieven, geen
koppen, geen links, geen structuur. Ook niet als je er iets ziet dat op de homepage is
gemist.

## Waarom

Header en footer zijn op elke pagina identiek. Ze bij elk sample opnieuw langslopen levert
niets op behalve dezelfde bevinding elf keer. Sitebrede problemen (sociale-media-structuur,
X/Twitter-mismatch, footer-adres, logo's) worden één keer op de homepage gerapporteerd en
gelden impliciet voor de hele website.

## Gevolgen voor de bevindingen

- Koppel een sitebrede bevinding **alleen aan het homepage-sample**. Vervolgpagina's "erven"
  het probleem; ze worden niet als extra sample-item toegevoegd.
- Voeg aan zo'n bevinding een zin toe als "Dit patroon is op alle pagina's van de website
  aanwezig".
- Kom je op een vervolgpagina toch iets in header of footer tegen: niet rapporteren. Hoort
  het bij de homepage, dan hoort het daar thuis.

## Eerst vaststellen: sta je wel op de goede pagina?

De CLI geeft bij elk commando een veld `omgeleid` terug. Staat dat op true, dan heeft de
server je naar een ander adres gestuurd dan je vroeg. Beoordeel dan niets: zet alle criteria
op `niet_te_bepalen` met het gevraagde en het werkelijke adres in de reden.

Dit klinkt als een randgeval en is het niet. Een formulier met stappen geeft elke stap een
eigen adres, maar laat je er alleen komen als de vorige stap is ingevuld. Kom je binnen
zonder sessie, dan sta je weer bij stap 1 — en die pagina ziet er niet uit als een fout. Het
is een keurige, werkende pagina met de goede titel. Er is geen enkel signaal behalve het
adres, en daar kijkt niemand naar.

Wil je zo'n stap tóch beoordelen, dan moet een mens het formulier invullen en de pagina
vanuit die sessie vastleggen. Uit een los opgevraagd adres komt hij niet.

Aanleiding: heuvelrug.nl (2026-08-16). Stap 2 en stap 3 van het contactformulier leiden
allebei terug naar stap 1. De oordelen die er stonden waren goed — die kwamen uit een ronde
waarin het formulier met de hand was doorlopen — maar een volgende workflow-ronde zou er 33
oordelen over stap 1 overheen hebben geschreven onder de naam van stap 2, met een verse
datum en `bron: workflow`, precies zoals bij elke andere pagina.

## Eerst vaststellen: is dit de homepage?

Doe dit vóór het eerste criterium, niet onderweg. Je hoeft het niet te onthouden of te
raden — `npm run cli -- get-html` zegt het in elk antwoord:

| | `homepageDetected` | `scope` | Wat je terugkrijgt |
|---|---|---|---|
| Homepage | `true` | `document` | de hele pagina, inclusief header en footer |
| Elk ander sample | `false` | `main` | alleen de main-content |

Op een vervolgpagina krijg je de footer dus niet eens terug. Staat er `scope: "main"` en
schrijf je toch iets over de header of de footer, dan heb je materiaal gebruikt dat je
niet is aangereikt — controleer dan waar die bewering vandaan komt.

Andersom net zo belangrijk: staat er `homepageDetected: true`, dan hoort de footer bij je
beoordeling en mag je hem niet overslaan.

## Begin elk sample met de pagina zonder opmaak

Draai vóór het eerste criterium:

```
npm run cli -- get-leesvolgorde <url> --zonder-css
```

Bekijk die kale schermafdruk voordat je aan de criteria begint. Zonder opmaak valt in één
blik te zien wat je anders in de HTML moet uitzoeken:

- een rij links die aan elkaar plakt is geen opsomming (1.3.1)
- scheidingstekens die als gewone tekst tussen links staan (1.3.1)
- de koppenhiërarchie, als kale h1/h2/h3 onder elkaar (1.3.1)
- een tabel die alleen visueel een tabel was (1.3.1)
- tekst die in een afbeelding blijkt te zitten, want die is dan niet leesbaar (1.1.1, 1.4.5)
- verborgen labels en instructies die opeens zichtbaar worden (3.3.2)

Aanleiding: heuvelrug.nl (2026-08-15). Twee bevindingen waren met code-inspectie gevonden —
de aan elkaar geplakte sociale-media-links en de verticale streepjes tussen Openingstijden,
Route en Gemeentegids — en beide sprongen eruit zodra de opmaak weg was. Dat had een half
uur gescheeld.

## Verantwoord in de onderbouwing wat je hebt nagelopen

Noem de gebieden afzonderlijk. Op het homepage-sample zijn dat er drie: header,
main-content en footer. Op elk ander sample schrijf je expliciet dat header en footer
buiten beschouwing blijven, zodat een lezer ziet dat het bewust is overgeslagen en niet
vergeten.

Schrijf nooit "alle afbeeldingen nagelopen" of "de hele pagina bekeken" en vervolgens
alleen wat er bovenaan staat. Dan is niet te toetsen of de onderkant werkelijk is
bekeken, en juist daar zitten de sociale-media-icoontjes, de externe-link-markeringen
en soms logo's van samenwerkingspartners.

**Maak op de homepage een full-page screenshot, geen viewport-opname.** Een
viewport-opname toont alleen het eerste scherm; de footer staat er niet op. Wie daarop
beoordeelt mist de onderkant zonder het te merken, en de onderbouwing beweert dan iets
wat niet is gedaan.

Aanleiding: 1.1.1 op heuvelrug.nl (2026-08-15). De onderbouwing begon met "alle
img-elementen op de pagina nagelopen" en beschreef vervolgens alleen de header en de
hero. Of de footer was bekeken viel niet na te gaan.

## Bij "niet aanwezig": noem wat je hebt gezocht

Een leeg resultaat en een mislukte zoekactie zien er in een onderbouwing precies
hetzelfde uit. "Er staat geen video op deze pagina" is niet te toetsen; "gezocht op
video, audio, iframe, embed en object, en op ingesloten spelers van YouTube, Vimeo en
Bright — geen van alle aanwezig" wel.

Noem daarom de elementen en patronen die je hebt afgezocht, en maak dat rijtje volledig
voor het criterium. Laat je er een weg, dan is dat precies het gat waar het volgende
geval in valt.

**Controleer je zoekactie op iets waarvan je wéét dat het er is.** Draait er een script
of een zoekopdracht onder, test die dan eerst op een patroon dat zeker voorkomt. Komt
daar ook nul uit, dan is niet de pagina leeg maar je gereedschap stuk.

Aanleiding: 1.2.1 op heuvelrug.nl (2026-08-15). Een controle op video, audio, iframe,
embed, object en source gaf zes keurige nullen — maar de gebruikte reguliere expressie
was kapot, zodat alles nul gaf. De uitkomst klopte toevallig; het bewijs was waardeloos.
Een tweede, werkende controle liet zien dat er zeven `source`-elementen zijn (in
`picture`, voor responsieve afbeeldingen — geen media in de zin van 1.2.1).

## Hoe je de main-content afbakent

Neem het `<main>`-element, of als dat ontbreekt het gebied tussen de sitebrede navigatie en
de footer. Alles in `<header>`, `<nav>` (sitebrede navigatie), `<footer>` en de
toegankelijkheidsbalk valt buiten je beoordeling op een vervolgpagina.

Twijfel je of een blok bij de main-content of bij de sitebrede template hoort? Kijk of het op
de homepage ook voorkomt. Zo ja, dan is het template en sla je het over.
