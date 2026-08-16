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
