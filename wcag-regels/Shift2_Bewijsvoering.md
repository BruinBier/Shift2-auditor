# Shift2-bewijsvoering: waarop rust een oordeel?

> Deze regels gelden voor **elk** succescriterium. Ze gaan niet over de vraag wat een
> afkeuring is, maar over de vraag of iemand kan nakijken hoe je eraan kwam.
>
> Het onderliggende probleem is telkens hetzelfde: **een schone uitkomst ziet er identiek
> uit aan niet-gekeken-hebben.** Bij een afkeuring kan de onderzoeker je corrigeren, want
> die wijst naar iets. Bij een onterecht "voldoet" of "niet aanwezig" wijst er niets, en
> merkt niemand het ooit.
>
> De scoperegels — welk deel van de pagina je beoordeelt — staan in
> `Shift2_Scope_Per_Sample.md`.

## Lever het bewijs mee waar het oordeel op rust

| Waar het oordeel op rust | Wat je meelevert |
|---|---|
| Kijken — reflow, contrast, hoogcontrastweergave, een handeling | de schermafdruk |
| Code — attributen, structuur, koppen | het codefragment |
| Meting — kleuren, breedtes, posities | de getallen én de schermafdruk |

**Ook als de uitkomst schoon is.** Dat is juist het geval waarin het misgaat.

Drie keer misgegaan op één dag op heuvelrug.nl. Een controle op media gaf zes keurige
nullen uit een kapotte reguliere expressie. Een leesvolgordemeting dekte 36 van de 54
elementen, omdat links met hun tekst in een span wegvielen. En de vraag of het uitklapmenu
op 320 pixels opengaat werd weggewuifd naar een ander criterium. Alle drie zagen ze eruit
als afgerond werk.

Een meting zonder beeld is een bewering.

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

**Noteer ook in welke browser je hebt gemeten.** De CLI meldt in elk antwoord of hij in de
auditsessie draaide of headless is teruggevallen. Een auditsessie houdt cookies,
inloggegevens en localStorage vast, headless begint elke keer schoon. Voor een openbare
pagina zonder login maakt dat vaak niets uit, en heeft headless zelfs een voordeel: een
instelling uit de ene meting kan de volgende niet vervuilen. Achter een login of een
cookiemuur heb je de auditsessie juist nodig.

Aanleiding: 1.1.1 op heuvelrug.nl (2026-08-15). De onderbouwing begon met "alle
img-elementen op de pagina nagelopen" en beschreef vervolgens alleen de header en de hero.
Of de footer was bekeken viel niet na te gaan. Bij 1.4.3 stond niet dat de meting headless
was gedaan, terwijl de vraag in het scherm om een auditsessie vroeg.

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
