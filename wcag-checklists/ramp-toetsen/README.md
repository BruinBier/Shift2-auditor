# RAMP-toetsen — schermafbeeldingen en vergelijking

RAMP is de auditbrowser van Accessible Web. Die knipt een succescriterium op in losse
toetsen: 1.3.1 heeft er onder "Semantics" negen, 1.1.1 heeft er onder "Pictures & Images"
vier of vijf. Elke toets heeft een eigen eenregelige eis, eigen instructies, een eigen
N/A-knop en een eigen lijst gevonden elementen.

Deze map bewaart die toetsen, zodat we ze naast onze eigen regels kunnen leggen.

## Wat hier staat

`schermafbeeldingen/` — de opnamen zelf.

`vergelijking.md` — per criterium wat er uit de vergelijking kwam: wat we al hadden, wat
ontbrak, en waar RAMP onze regels tegenspreekt.

## Hoe je een opname toevoegt

Sleep het bestand in `schermafbeeldingen/` en geef het een naam die zegt om welke toets het
gaat, met het criterium ervoor:

    1-3-1-emphasized-text.png
    1-1-1-complex-images.png

Met dat criteriumnummer vooraan staan de toetsen van hetzelfde criterium bij elkaar en is
in één oogopslag te zien welke er al zijn.

## Hoe we ermee omgaan

RAMP is een bron, geen norm. Het is een commercieel gereedschap met eigen keuzes, en die
keuzes zijn niet allemaal de onze — twee keer bleek het onze vastgelegde regels ronduit
tegen te spreken:

- **`b` en `i`.** RAMP eist dat visueel benadrukte tekst `strong` of `em` gebruikt en keurt
  `b` en `i` af. Dat is de opvatting van vóór HTML5. Onze regel gaat de andere kant op:
  `strong` en `em` beweren iets (belang, spraaknadruk), en om tekst die dat niet draagt
  horen ze juist niet te staan. Zie `Shift2_Regels_SC_1_3_1.md`.

- **Complexe afbeeldingen.** RAMP keurt af als een beschrijving niet programmatisch aan het
  beeld is gekoppeld. Onze regel vraagt dat de informatie op de pagina beschikbaar is, en
  eist geen `aria-describedby` of `figure`. Zie `Shift2_Regels_SC_1_1_1.md`.

Neem een formulering dus nooit rechtstreeks over. De volgorde is: vergelijken, verschil
benoemen, en pas veranderen als Frits dat beslist. Wat er wel uit overgenomen is, staat in
`vergelijking.md` met de datum erbij.
