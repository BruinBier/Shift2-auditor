# Shift2-beoordelingsregels SC 2.5.8

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_5_8.md` als ze elkaar tegenspreken.

## Wel automatisch te meten — via de audit-sessie-Chrome

Dit criterium is exact meetbaar: het klikbare gebied moet minstens 24 bij 24 CSS-pixels zijn,
en dat lees je uit de gerenderde pagina met `getBoundingClientRect()`. Dat is geen schatting
maar een meting, inclusief padding.

Beoordeel 2.5.8 dus zelf; vul geen "voldoet" in zonder gemeten te hebben. De test draait via
de Chrome achter "Audit-sessie starten" (debugpoort 9222). Zie `tmp/targetsize.mjs` voor het
werkende voorbeeld.

### Werkwijze

1. **Verzamel de interactieve elementen** binnen de main-content:
   `a[href]`, `button`, `input:not([type="hidden"])`, `select`, `textarea`, en alles met
   `role="button" | "link" | "checkbox" | "radio" | "tab"`. Filter op zichtbaar
   (`offsetParent !== null` en afmetingen groter dan 0).
2. **Meet breedte en hoogte** per element. Is één van beide onder 24, dan is het een
   kandidaat, nog geen afkeuring.
3. **Toets de uitzonderingen** voordat je afkeurt:
   - **Inline** — de link staat middenin een lopende zin, of de grootte wordt bepaald door de
     regelhoogte van omringende tekst. Dan geldt de eis niet.
   - **Ruimte** — leg een cirkel van 24px diameter op het midden van het target; raakt die
     geen ander target (of de cirkel van een ander klein target), dan voldoet het. Praktisch:
     bereken de afstand tussen de middens; is die minstens 24px, dan is er genoeg ruimte.
   - **Gelijkwaardig** — dezelfde functie is elders op de pagina bereikbaar via een target dat
     wél groot genoeg is.
   - **Bepaald door user agent** — de auteur heeft de grootte niet gewijzigd (bv. een kale
     `<input type="checkbox">` zonder eigen CSS).
   - **Essentieel** — de presentatie is essentieel of wettelijk vereist.
4. Wat na die filters overblijft, is een **afkeuring** (impact klein tot matig,
   responsibility ontwerper of ontwikkelaar).

### Wat je niet automatisch kunt bepalen — ALTIJD MELDEN

De uitzonderingen **gelijkwaardig** en **essentieel** vragen een inhoudelijk oordeel: doen twee
elementen echt hetzelfde, en is de vormgeving werkelijk noodzakelijk.

Kun je zo'n uitzondering niet zelf vaststellen, laat het target dan **nooit stilzwijgend
wegvallen**. Zet het criterium op `niet_te_bepalen` en formuleer de concrete vraag voor de
onderzoeker, met de gemeten afmetingen erbij. Bijvoorbeeld:

> Op [pagina] is [element] 18 bij 18 pixels, terwijl 24 bij 24 het minimum is. Is dezelfde
> functie elders op de pagina bereikbaar via een knop of link die wél groot genoeg is
> (uitzondering "gelijkwaardig"), of is deze vormgeving noodzakelijk (uitzondering
> "essentieel")?

Het alternatief, "ik kan de uitzondering niet toetsen dus ik laat het weg", levert een gemist
issue op dat niemand meer terugvindt. Meld het liever als open vraag.

Is er niets te klein gemeten, dan is dit oordeel niet nodig en kun je gewoon `voldoet`
invullen.

Bedekte of overlapte targets (dropdown over andere content, modal, cookiebalk) vallen buiten
dit criterium; die hoef je niet te meten.

### Noteer de gemeten waarden

Zet in de bevinding de werkelijke afmetingen, bijvoorbeeld "het klikgebied is 18 bij 18 pixels,
terwijl 24 bij 24 het minimum is". Een bevinding zonder getallen is aanvechtbaar.

Aanleiding: heuvelrug.nl (2026-08-02). Main-content 16 targets, hele pagina 45, niets onder
24x24 (kleinste 30x28). Op /nieuws-en-meer 50 targets met een kleinste van 24x25,9: krap maar
voldoende. De auditor had "voldoet" ingevuld zonder te meten; de uitkomst klopte, de
onderbouwing ontbrak. Frits vroeg hoe dit getest wordt.

## Regels

- Meet zelf in de audit-sessie-Chrome. Vul "voldoet" alleen in op basis van een meting, niet
  op het oog of uit de HTML.
- Meet het **klikbare** gebied, niet het zichtbare icoon. Een icoon van 16x16 met 4px padding
  rondom is 24x24 en voldoet.
- CSS-pixels veranderen niet bij zoom. Een te klein target wordt niet goed door in te zoomen.
- Bij een deelonderzoek content: beperk je tot de main-content. Hoofdmenu, hoofdnavigatie en
  toegankelijkheidsbalk vallen buiten de scope.
- Bij PDF-samples is 2.5.8 niet van toepassing.
