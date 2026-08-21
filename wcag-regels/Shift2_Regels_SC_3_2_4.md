# Shift2-beoordelingsregels SC 3.2.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_2_4.md` als ze elkaar tegenspreken.

## Waar de norm zelf nog onduidelijk is

Bij het W3C loopt issue **#5225** ("3.2.4 Consistent Identification: ambiguities in the
Understanding document require clarification"). Het benoemt vijf onduidelijkheden die ook bij
onze beoordelingen spelen:

1. **Consistent versus identiek.** De Understanding-tekst zegt bij het ene voorbeeld dat labels
   "consistent, niet identiek" hoeven te zijn, en rekent bij het andere voorbeeld synoniemen
   als "zoeken" en "vinden" juist af. Waar de grens ligt, staat er niet.
2. **Geldt het binnen één pagina?** Het criterium spreekt van een "set webpagina's". Of
   herhaalde onderdelen bínnen één pagina eronder vallen, is niet uitgesproken.
3. **Zelfde functie of zelfde betekenis?** De definitie gaat over "hetzelfde resultaat bij
   gebruik", maar een voorbeeld behandelt een niet-interactief vinkje. Onduidelijk of statische
   beelden meetellen.
4. **Programmatisch of visueel?** De nadruk ligt op de toegankelijke naam, terwijl juist
   gebruikers met een cognitieve beperking op herkenbare iconen en patronen varen.
5. **Wat is een "component"?** De term is niet gedefinieerd.

Praktische lijn zolang dat zo is: beoordeel 3.2.4 **over de samples heen**, op onderdelen die
op meerdere pagina's terugkomen en dezelfde functie hebben. Twijfel je of iets binnen dit
criterium valt, meld het dan als open vraag in plaats van het stil te laten vallen.

## Zo meet je het

```
npm run cli -- get-consistentie <projectId>
```

Dat legt de pagina's van de steekproef naast elkaar en vergelijkt per onderdeel de
toegankelijke naam. Links worden gekoppeld op hun bestemming — de sterkste sleutel die er is —
knoppen op hun id of sjabloonklasse, en beide alleen binnen hetzelfde deel van de pagina
(header, navigatie, main, footer). Dat laatste is nodig omdat het logo en "Home" in het
kruimelpad allebei naar de startpagina gaan zonder hetzelfde onderdeel te zijn.

Naast de naam wordt ook het **icoon** vergeleken. Een icoon staat vrijwel altijd op
`aria-hidden` en valt dus buiten de toegankelijke naam, terwijl juist wie op herkenbare
beelden vaart in de war raakt als het per pagina verschilt; dat is punt 4 hierboven.
Vergeleken wordt waaraan het icoon te herkennen is: de bestandsnaam, de vorm van de svg of de
klasse van een icoonlettertype. Twee verschillende bestanden kunnen hetzelfde vergrootglas
tonen, dus dit is een signaal en geen bewijs.

Het overzichtsbestand bevat een **matrix**: onderdelen in de rijen, pagina's in de kolommen,
per vakje het nummer van de naamvariant en een punt waar het onderdeel ontbreekt. Daarin zie
je in één blik of een afwijking op één pagina zit of op de helft, en waar iets helemaal niet
staat.

Het commando scheidt twee dingen die er in de uitkomst hetzelfde uitzien:

- **anders benoemd tussen pagina's** — dat is 3.2.4
- **anders benoemd binnen één pagina** — dat valt er volgens de regel hierboven buiten, en
  staat apart in de uitvoer

Wat er niet in kan: of "Zoeken" en "Zoek" werkelijk van elkaar verschillen in de zin van dit
criterium. Dat is punt 1 hierboven en blijft een oordeel. Het commando zet ze naast elkaar met
de pagina's erbij.

Aanleiding: UTHEU-02 (2026-08-20). Alle twintig kaarten stonden op een oordeel zonder één
vergelijking eronder, negen ervan met een redenering bínnen één pagina. De eerste meting over
achttien pagina's leverde vier onderdelen op die niet overal hetzelfde heten, waaronder het
logo in de header.

## Waar het oordeel thuishoort

Op het homepage-sample, net als de andere sitebrede onderdelen (zie `Shift2_Scope_Per_Sample.md`).
Op de overige samples komt 3.2.4 op `niet_aanwezig` met als reden dat het sitebreed is
beoordeeld. Een oordeel per pagina is bij dit criterium geen onnauwkeurigheid maar een
categoriefout: aan één pagina is consistentie niet te zien.

## Regels

- NIET-GETAGDE PDF: zet 3.2.4 op niet_te_bepalen. Zonder tags zijn er geen programmatisch
  herkenbare onderdelen waarvan de identificatie te vergelijken valt. Dat de opmaak er
  visueel consistent uitziet (genummerde koppen volgens een vast schema, tabellen met
  doorlopende nummering, kaders met steeds dezelfde vorm) verandert dat niet. Vul hier dus
  nooit "voldoet" in. De wortel-oorzaak wordt al onder 1.3.1 afgekeurd. Zie
  `Shift2_Regels_SC_1_3_1.md` voor de volledige vervallijst. Vastgelegd door Frits op
  2026-08-02 bij UTHEU-01.
- Bij webpagina's gaat 3.2.4 over dezelfde functie die op verschillende pagina's anders wordt
  aangeduid (een zoekknop die op de ene pagina "Zoeken" heet en op de andere "Vind"). Beoordeel
  dat over de samples heen, niet binnen één pagina.
