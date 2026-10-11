# Shift2-beoordelingsregels SC 2.5.8

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_5_8.md` als ze elkaar tegenspreken.

## Wel automatisch te meten — via de audit-sessie-Chrome

Dit criterium is exact meetbaar: het klikbare gebied moet minstens 24 bij 24 CSS-pixels zijn,
en dat lees je uit de gerenderde pagina met `getBoundingClientRect()`. Dat is geen schatting
maar een meting, inclusief padding.

Beoordeel 2.5.8 dus zelf; vul geen "voldoet" in zonder gemeten te hebben. De test draait via
de Chrome achter "Audit-sessie starten" (debugpoort 9222). Er stond hier een verwijzing naar
`tmp/targetsize.mjs` als werkend voorbeeld. Dat script bestond op 2026-10-11 nog, maar de map
`tmp/` wordt opgeruimd. Reken er dus niet op dat het er nog is. Een meting die je wilt kunnen
herhalen, hoort niet in tmp.

**Breedte en hoogte zijn niet genoeg.** Er moet een massief vierkant van 24 bij 24 pixels
in het doel passen, recht op de pagina. Een smal, schuin of hol doel kan een omsluitend vak
van 24 bij 24 hebben en toch te klein zijn. Bron: W3C Understanding 2.5.8, Intent. Besluit
Frits 2026-10-11: volg W3C.

### Werkwijze

1. **Verzamel de interactieve elementen** binnen de main-content:
   `a[href]`, `button`, `input:not([type="hidden"])`, `select`, `textarea`, en alles met
   `role="button" | "link" | "checkbox" | "radio" | "tab"`. Filter op zichtbaar
   (`offsetParent !== null` en afmetingen groter dan 0).
2. **Meet breedte en hoogte** per element. Is één van beide onder 24, dan is het een
   kandidaat, nog geen afkeuring.
3. **Toets de uitzonderingen** voordat je afkeurt:
   - **Inline** — de link staat middenin een lopende zin, of de grootte wordt bepaald door de
     regelhoogte van omringende tekst. Dan geldt de eis niet. Breekt een link over twee
     regels af, meet hem dan alsof hij op één regel staat (W3C-definitie "minimum bounding
     box").
   - **Ruimte**: leg een cirkel van 24px doorsnede op het midden van het omsluitende vak van
     elk te klein doel. Die cirkel mag geen ander doel snijden, en ook niet de cirkel van een
     ander te klein doel. Twee te kleine doelen naast elkaar: de middens liggen minstens 24px
     uit elkaar. Een te klein doel naast een doel dat groot genoeg is: het midden ligt
     minstens 12px van de rand van dat grote doel. Bron: W3C, SC-tekst 2.5.8, uitzondering
     Spacing. Besluit Frits 2026-10-11: volg W3C. De oude vuistregel "afstand tussen de
     middens minstens 24px" gold ook naast een groot doel, en dat klopt niet.
   - **Gelijkwaardig** — dezelfde functie is elders op de pagina bereikbaar via een target dat
     wél groot genoeg is.
   - **Bepaald door user agent**: de grootte komt van de browser en de auteur heeft er niets
     aan veranderd (bv. een kale `<input type="checkbox">` zonder eigen CSS). Heeft de auteur
     iets aan de maat of de opmaak veranderd, dan geldt de uitzondering niet. Bron: W3C
     Understanding 2.5.8. Besluit Frits 2026-10-11: volg W3C.
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

### Bedekt, nieuw verschenen en overlappend

Bron: W3C Understanding 2.5.8, Intent en definitie "target". Besluit Frits 2026-10-11: volg W3C.

- **Bedekte doelen** vallen erbuiten zolang ze bedekt zijn door iets dat na een handeling van
  de gebruiker verscheen: de links onder een uitgeklapt menu of onder een modal.
- **De knoppen in die nieuwe laag tellen wel mee.** De knoppen in een modal, een uitklapmenu
  of een cookiebalk zelf meet je gewoon.
- **Overlappende doelen:** het stuk dat overlapt telt niet mee voor de maat. Doen beide
  doelen hetzelfde of gaan ze naar dezelfde pagina, dan telt het wel mee.

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
- Bij een PDF geldt 2.5.8 voor de bedienbare elementen erin: links en formuliervelden. Een
  PDF zonder zulke elementen is `niet_aanwezig`. Bron: WCAG2ICT, 2.5.8 geldt rechtstreeks
  voor documenten, met als aanwijzing: meet op de zoom waarop het document bedoeld is.
  Besluit Frits 2026-10-11: volg W3C. De meetwijze voor een PDF is nog niet vastgelegd. Kun
  je het niet meten, zet het dan op `niet_te_bepalen` met een concrete vraag.

## Technieken (W3C)

Bron: W3C Understanding 2.5.8 en de Quick Reference, opgehaald op 2026-10-11.

- **Voldoende:** C42 (`min-height` en `min-width` op de container van het doel, zodat er
  genoeg ruimte is).
- **Aanvullend:** geen genoemd.
- **Fout:** geen genoemd.

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
is hij aanvechtbaar. Bij een PDF geldt het voor links en formuliervelden; zonder die
elementen is het niet aanwezig.

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

3. [agent] Per element onder 24 aan een van beide kanten: staat het in lopende tekst? Dan
   voldoet het. Anders: leg een cirkel van 24 pixels doorsnede op zijn midden. Snijdt die
   geen ander doel en geen cirkel van een ander te klein doel, dan voldoet het. Naast een
   groot doel betekent dat: minstens 12 pixels van het midden tot de rand van dat doel.
4. [agent] Is het een kaal browserelement waaraan de auteur niets heeft veranderd? Dan
   uitgezonderd.
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
het criterium; de knoppen in de cookiebalk zelf niet.

### Deelgebieden

1. Alle bedienbare elementen in de main-content gemeten: aantal en kleinste maat genoteerd
2. Elementen onder 24 pixels: uitzondering voor lopende tekst en voor ruimte getoetst
3. Gelijkwaardig en essentieel: als open vraag gemeld met de gemeten maten
4. De gemeten waarden staan in de onderbouwing en in elke bevinding

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
