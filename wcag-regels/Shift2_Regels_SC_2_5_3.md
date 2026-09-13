# Shift2-beoordelingsregels SC 2.5.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_5_3.md` als ze elkaar tegenspreken.

## Wel automatisch te meten — via de audit-sessie-Chrome

De kern van 2.5.3 is een vergelijking: de **zichtbare tekst** van een element moet vóórkomen in
zijn **toegankelijke naam**. Beide zijn uit de gerenderde pagina te lezen, dus meet dit zelf.
Vul geen "voldoet" in zonder vergeleken te hebben.

```
npm run cli -- get-labelinnaam <url>
```

Dat commando doet de werkwijze hieronder: het bepaalt per bedieningselement de zichtbare
tekst en de toegankelijke naam, vergelijkt ze genormaliseerd, en zet de mismatches én de
gevallen die het niet kan vergelijken in het overzicht.

Hier stond eerder een verwijzing naar `tmp/labelinname.mjs`. Die map wordt opgeruimd, dus dat
gereedschap was verdwenen en op twintig kaarten stond een oordeel zonder vergelijking eronder.
Een meting die je wilt kunnen herhalen, hoort niet in tmp.

### Werkwijze

1. **Bepaal de zichtbare tekst** per interactief element. Verwijder daarbij:
   - alles met `aria-hidden="true"` (meestal de iconen)
   - visueel verborgen tekst (`sr-only`, `visually-hidden`, `screen-reader`)

   Wat overblijft is wat de gebruiker daadwerkelijk leest. Heeft een element geen zichtbare
   tekst (alleen een icoon), dan is 2.5.3 **niet van toepassing**; dat is een 4.1.2-kwestie.

2. **Bepaal de toegankelijke naam** in deze volgorde:
   `aria-labelledby` → `aria-label` → gekoppeld `<label>` (bij formuliervelden) →
   inhoud van het element (met het `alt` van afbeeldingen erin) → `title`.

3. **Vergelijk:** de zichtbare tekst moet als tekenreeks vóórkomen in de toegankelijke naam.
   Normaliseer op hoofdletters, dubbele spaties, harde spaties en aanhalingstekens.

4. **Mismatch = AFKEURING.** Het meest voorkomende geval is een `aria-label` die de zichtbare
   tekst overschrijft: de knop toont "Zoeken", maar `aria-label="Vind informatie op deze site"`.
   Spraakgestuurde gebruikers kunnen het element dan niet activeren met wat ze zien staan.

### Wat deze meting NIET dekt — altijd melden

Twee gevallen vallen buiten de automatische vergelijking. Kom je die tegen, zet het criterium
dan op `niet_te_bepalen` met een concrete vraag; laat het nooit stilzwijgend als "voldoet"
staan (zie de algemene regel: kun je iets niet beoordelen, meld het).

- **Zichtbaar label in een afbeelding van tekst.** Staat de knoptekst in een JPG of PNG, dan
  is die tekst niet uit te lezen en moet je op beeld beoordelen of de toegankelijke naam
  overeenkomt met wat er in de afbeelding staat.
- **Samengestelde `aria-labelledby`.** Wijst die naar meerdere elementen, of hebben de
  aangewezen elementen zelf weer een `aria-label`, dan is de vereenvoudigde berekening niet
  betrouwbaar. Controleer die gevallen met de hand in de accessibility-boom van de browser.

### Let op het verschil met 2.4.4 en 4.1.2

- **2.5.3** — er is zichtbare tekst, maar de toegankelijke naam bevat die niet
- **2.4.4** — de link heeft wel een naam, maar die maakt het linkdoel niet duidelijk
- **4.1.2** — het element heeft helemaal geen (betrouwbare) naam

Een X/Twitter-mismatch in de footer (X-logo zichtbaar, naam zegt nog "Twitter") is géén
2.5.3-kwestie: 2.5.3 vereist zichtbare **tekst**, en een logo is dat niet. Die hoort als
opmerking onder 2.4.4, zie `Shift2_Regels_SC_2_4_4.md`.

Aanleiding: heuvelrug.nl (2026-08-02). 41 elementen met een zichtbaar label, nul mismatches;
duurzaam.beverwijk.nl 32 elementen, ook nul. De auditor had "voldoet" ingevuld zonder te
vergelijken; de uitkomst klopte, de onderbouwing ontbrak. Frits vroeg hoe dit getest wordt.

## Een logo met een leeg tekstalternatief: ook hier een afkeuring

Toont het logo de organisatienaam en heeft de afbeelding `alt=""`, dan is dat een afkeuring
onder **1.1.1 én onder 2.5.3** — twee aparte bevindingen op hetzelfde defect.

De redenering, en let op dat het scharnier bij de lege alt zit:

- de zichtbare tekst van die link is het woordmerk: de organisatienaam
- met een leeg `alt` komt die tekst nergens in de toegankelijke naam terecht; die komt dan uit
  de `title` van de link, en die zegt iets anders ("Ga naar de homepage")
- **krijgt het logo wél een tekstalternatief** — de reparatie uit 1.1.1 — dan wordt dát de naam
  van de link, want de inhoud gaat vóór de `title`. De naam wordt "Logo gemeente X" en de
  zichtbare tekst staat er dan gewoon in. 2.5.3 is daarmee vanzelf hersteld.

Eén reparatie dus, twee bevindingen. Vastgelegd door Frits op 2026-08-20 bij heuvelrug.nl, waar
het logo "GEMEENTE UTRECHTSE HEUVELRUG" toont, `alt=""` heeft, en de link eromheen "Ga naar de
homepage" heet. 1.1.1 stond daar al op afgekeurd; 2.5.3 stond op voldoet zonder het logo te
noemen.

Let op het verschil met 4.1.2: daar gaat het erom of de naam de bestemming dekt, en dat doet
"Ga naar de homepage" wél (zie `Shift2_Regels_SC_4_1_2.md`). Drie criteria, drie vragen, en ze
kunnen verschillend uitvallen op dezelfde link.

W3C-issue [#5171](https://github.com/w3c/wcag/issues/5171) blijft van belang voor één ding: de
**slogan** hoeft niet in de naam. Zie de paragraaf hieronder.

## Logo met een slogan eronder: niet alles hoeft in de naam

Bevat een logo naast de organisatienaam ook een slogan of payoff ("Samen sterker", "voor de
kinderen van Ochakiv"), dan hoeft die tekst **niet** in de toegankelijke naam. Zet de
organisatienaam in het tekstalternatief en laat de slogan weg.

Reden: 2.5.3 bestaat voor spraakbesturing. Iemand zegt "klik gemeente X", niet de hele slogan.
Extra tekst in de naam maakt het commando juist lastiger.

Bij het W3C loopt hierover issue **#5171** ("2.5.3 Label in name, F96 example for logos"). De
faalconditie F96 dekt dit geval nu niet, waardoor een letterlijke lezing van 2.5.3 zou
suggereren dat álle zichtbare tekst in de naam moet. Dat is niet de bedoeling; er wordt om een
verduidelijkend voorbeeld gevraagd.

Praktische lijn: keur een logo niet af onder 2.5.3 omdat de slogan ontbreekt in het
tekstalternatief.

## Organisatienaam in het logo, niet in de toegankelijke naam: 1.1.1 EN 2.5.3

Staat de organisatienaam zichtbaar in het logo en komt hij niet terug in de toegankelijke
naam van de link, dan zijn dat **twee bevindingen**, geen keuze tussen twee criteria:

| Criterium | Wat er misgaat | Voor wie |
|---|---|---|
| 1.1.1 | de afbeelding heeft geen tekstalternatief | wie blind is en een schermlezer gebruikt, krijgt geen naam voor het logo |
| 2.5.3 | de zichtbare naam komt niet voor in de toegankelijke naam | wie spraakbediening gebruikt, leest de naam op het scherm, spreekt hem uit, en er gebeurt niets |

Dat één aanpassing allebei oplost, maakt het niet één bevinding. De gebruikersgroep en het
mechanisme verschillen, en in het rapport staan ze onder verschillende criteria.

Let op het onderscheid met de slogan hierboven: een ontbrekende **slogan** is geen
2.5.3-afkeuring, een ontbrekende **organisatienaam** wel.

Vastgesteld door Frits op 2026-08-18. Aanleiding: het logo op de homepage van heuvelrug.nl
toont "GEMEENTE UTRECHTSE HEUVELRUG" met een leeg tekstalternatief; de toegankelijke naam van
de link is "Ga naar de homepage", uit het title-attribuut. Ik adviseerde het bij 1.1.1 te
laten omdat de reparatie dezelfde is; Frits: "ik denk wel het zijn 2 verschillende dingen."

## Regels

- Meet zelf in de audit-sessie-Chrome. "Voldoet" alleen op basis van de vergelijking, niet op
  het oog of uit de HTML.
- Elementen zonder zichtbare tekst vallen buiten 2.5.3. Beoordeel die onder 4.1.2.
- De zichtbare tekst hoeft niet exact gelijk te zijn aan de naam, maar moet er wel volledig in
  zitten. "Zoeken" in "Zoeken op deze website" is goed; "Zoek" in "Zoeken" niet, want dan
  ontbreekt de zichtbare tekst.
- Bij een deelonderzoek content: beperk je tot de main-content. Hoofdmenu, hoofdnavigatie en
  toegankelijkheidsbalk vallen buiten de scope.
- Bij PDF-samples is 2.5.3 niet van toepassing.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

De zichtbare tekst zit in de toegankelijke naam

### In het kort

Wie met spraak bedient, zegt wat er op de knop staat: "klik Zoeken". Dat werkt alleen als
die zichtbare tekst ook in de toegankelijke naam zit. Een `aria-label` dat de zichtbare
tekst overschrijft is de klassieke afkeuring. Een element zonder zichtbare tekst valt
erbuiten; dat is 4.1.2.

Het logo: staat de organisatienaam zichtbaar in het logo en niet in de naam van de link,
dan is dat een 2.5.3-afkeuring naast de 1.1.1. Een slogan hoeft niet in de naam.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-labelinnaam <url>`, `--scope=main` op een vervolgpagina: per
   bedieningselement de zichtbare tekst en de toegankelijke naam, genormaliseerd
   vergeleken, met de mismatches en de niet te vergelijken gevallen in het overzicht.

#### Stap 2 — Beoordelen

2. [agent] Per mismatch: zit de zichtbare tekst volledig in de naam? "Zoeken" in "Zoeken op
   deze website" is goed; "Zoek" in "Zoeken" niet.
3. [agent] Het logo, op de homepage: welke tekst toont het, en komt de organisatienaam terug
   in de naam van de link? Een lege alt met alleen een title is een afkeuring hier én onder
   1.1.1; een ontbrekende slogan niet.
4. [jij] Tekst die in een afbeelding staat, en een samengestelde `aria-labelledby`: die kan
   het commando niet vergelijken. Kijk in de toegankelijkheidsboom van de browser.

#### Stap 3 — Vastleggen

5. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
6. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-labelinnaam` bepaalt in de browser per element de zichtbare tekst (zonder
`aria-hidden` en zonder verborgen tekst) en de toegankelijke naam in de volgorde
`aria-labelledby`, `aria-label`, gekoppeld label, inhoud met alt, `title`, en vergelijkt
ze genormaliseerd.

Wat hier niet uit blijkt: zichtbare tekst in een afbeelding en een samengestelde
`aria-labelledby`. Die staan apart in het overzicht en zijn met de hand na te kijken.

### Deelgebieden

1. Knoppen en links met zichtbare tekst: de tekst komt volledig voor in de naam
2. Formuliervelden: het zichtbare label komt voor in de naam
3. Het logo op de homepage: de organisatienaam zit in de naam van de link, een slogan hoeft niet
4. Niet te vergelijken gevallen: tekst in een afbeelding en samengestelde aria-labelledby, gemeld

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
