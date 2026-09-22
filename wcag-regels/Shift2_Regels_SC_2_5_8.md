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
   responsibility redacteur of ontwikkelaar).

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

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Klikgebieden zijn minstens 24 bij 24 pixels, of hebben ruimte om zich heen

### In het kort

Een link of knop die kleiner is dan 24 bij 24 CSS-pixels is voor wie trilt of een dikke
vinger heeft niet te raken. De maat is het klikbare gebied, inclusief padding, niet het
pictogram. Te klein is nog geen afkeuring: een link midden in een zin, een element met
genoeg ruimte om zich heen, een gelijkwaardig alternatief of een standaardelement van de
browser is uitgezonderd.

Meet het; vul geen "voldoet" in op het oog. En zet de gemeten maten in de bevinding, anders
is hij aanvechtbaar. Bij een PDF is dit criterium niet van toepassing.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [agent] Meet in de auditsessie per bedienbaar element in de main-content de breedte en
   hoogte van het klikbare gebied: links, knoppen, velden, en alles met een rol als knop,
   link, selectievakje, keuzerondje of tabblad. Alleen zichtbare elementen.
2. [agent] Noteer het aantal gemeten elementen en het kleinste, ook als niets te klein is.

#### Stap 2 — Beoordelen

3. [agent] Per element onder 24 aan een van beide kanten: staat het in lopende tekst, of is
   de afstand tot het midden van het dichtstbijzijnde andere element minstens 24 pixels? Dan
   voldoet het.
4. [agent] Is het een kaal browserelement zonder eigen opmaak? Dan uitgezonderd.
5. [jij] Gelijkwaardig of essentieel: doet een grotere knop elders hetzelfde, of is de
   vormgeving noodzakelijk? Dat is een weging; het element blijft als open vraag staan met
   zijn maten erbij.

#### Stap 3 — Vastleggen

6. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
7. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

Er is nog geen eigen meetcommando voor 2.5.8. De agent leest in de auditsessie per element
het klikbare gebied uit de opgemaakte pagina, inclusief padding; CSS-pixels veranderen niet
bij zoom.

Wat hier niet uit blijkt: of een te klein element een gelijkwaardig alternatief heeft en of
de vormgeving essentieel is. Bedekte elementen, zoals onder een cookiebalk, vallen buiten
het criterium.

### Deelgebieden

1. Alle bedienbare elementen in de main-content gemeten: aantal en kleinste maat genoteerd
2. Elementen onder 24 pixels: uitzondering voor lopende tekst en voor ruimte getoetst
3. Gelijkwaardig en essentieel: als open vraag gemeld met de gemeten maten
4. De gemeten waarden staan in de onderbouwing en in elke bevinding

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
