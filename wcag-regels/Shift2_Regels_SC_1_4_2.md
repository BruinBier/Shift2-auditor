# Shift2-beoordelingsregels SC 1.4.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_2.md` als ze elkaar tegenspreken.

## De vraag

Start er op de pagina geluid **uit zichzelf**, en duurt dat langer dan drie seconden? Zo ja,
dan moet de bezoeker het kunnen pauzeren of stoppen, of het volume ervan los van het
systeemvolume kunnen regelen. Zo nee, dan is de eis leeg.

Dit is een van de vier criteria met **non-interferentie**: ook geluid uit een ingesloten
kader van een ander domein telt, en één kader dat uit zichzelf begint te spelen keurt de
hele pagina af. Wie een schermlezer gebruikt, hoort zijn eigen hulpsoftware niet meer als er
muziek overheen komt.

## Geen geluid is `niet_aanwezig`, niet `voldoet`

Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`: de eis geldt alleen vóór geluid dat automatisch
start. Is dat er niet, dan is er niets om te bedienen. Geluid dat pas klinkt nadat de
bezoeker op een afspeelknop of een voorleesknop heeft gedrukt, is niet automatisch; ook dan
is het `niet_aanwezig`.

Eén uitzondering op "de bezoeker deed iets": de CLI maakt een slapende pagina wakker met een
muisbeweging (versnellers als WP Rocket stellen alle scripts uit tot de eerste beweging). Dat
is geen handeling van de bezoeker. Begint er geluid na die beweging, dan is dat automatisch.

## Wat wél een afkeuring is

- **Video of audio met `autoplay` en met geluid**, langer dan drie seconden, zonder pauze-,
  stop- of volumeknop die vóór de content in de tabvolgorde staat. Een knop die pas ná de
  hele pagina te bereiken is, helpt de schermlezergebruiker niet: die hoort ondertussen niets.
- **Ingesloten kader dat uit zichzelf begint te spelen met geluid**: een YouTube- of
  Vimeo-speler met `autoplay=1` zonder `mute=1`, een sociale-mediawidget met video.
- **Achtergrondmuziek of een geluidseffect uit een script**, zonder media-element in de code.
  Daar is niets te pauzeren, want er is geen speler.

Impact **serieus**, verantwoordelijkheid **ontwikkelaar**: het probleem raakt elke
schermlezergebruiker op de hele pagina, niet alleen bij de speler.

## Wat GEEN bevinding is

- **Een video die gedempt afspeelt** (`muted`, of `mute=1` in het insluitadres). Geen geluid,
  dus niets voor 1.4.2. Of hij te pauzeren is, hoort bij 2.2.2.
- **Geluid dat binnen drie seconden stopt** en zich niet herhaalt.
- **Een voorleesknop** (ReadSpeaker, "Lees voor"). Die start op verzoek en heeft zijn eigen
  bediening.
- **Een videogesprek of vergadering**: dat is interactie, geen automatisch geluid.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Geluid dat uit zichzelf start, is te stoppen

### In het kort

Begint er geluid zonder dat de bezoeker erom vroeg, en duurt dat langer dan drie
seconden, dan moet er een pauze- of stopknop zijn, of een eigen volumeregelaar. Die
bediening hoort vooraan op de pagina, want wie een schermlezer gebruikt hoort zijn eigen
hulpsoftware niet meer zolang het geluid speelt.

Start er niets uit zichzelf, dan is dit criterium niet aanwezig. Dat is geen "voldoet": er
was niets om te bedienen. Een voorleesknop of een afspeelknop telt niet; die zet de
bezoeker zelf aan.

Sinds 2026-09-14 wordt dit niet meer per pagina uitgezocht. 1.4.2 staat in `ALTIJD_NIET_AANWEZIG` (`lib/metingen.ts`) en krijgt op elke pagina `niet_aanwezig` met bron `steekproef`. Op deze websites start er nooit geluid vanzelf, ook niet als er een video op de pagina staat: een ingesloten speler begint pas als de bezoeker erop klikt. Het vervalt dus ook met het video-vinkje AAN.


### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html` na JavaScript, in de auditsessie: alle `audio`, `video`, `iframe`,
   `embed` en `object`, met hun `autoplay`- en `muted`-attributen en het insluitadres.
2. [meting] `get-videos`: elke speler op de pagina met zijn insluitcode, ook in afgeschermde
   wortels, en of het adres `autoplay=1` of `mute=1` bevat.
3. [meting] `get-beweging`: de pagina acht seconden laten staan en uitlezen welke media er
   speelt en welke kaders met autoplay in het adres staan. Dit is de enige stap die ziet wat
   er werkelijk gebeurt; de code zegt alleen wat er zou kunnen gebeuren.

#### Stap 2 — Beoordelen

4. [agent] Speelt er niets uit zichzelf, dan is het oordeel `niet_aanwezig`. Schrijf bij de
   deelgebieden op waar je hebt gezocht; "geen geluid" en "niet gekeken of er geluid is"
   leveren anders dezelfde zin op.
5. [agent] Speelt er iets: is het gedempt? Een `muted`-video is geen geluid. Zo niet, duurt het
   langer dan drie seconden of herhaalt het zich?
6. [agent] Langer dan drie seconden: zoek de pauze-, stop- of volumeknop, en kijk waar die in
   de tabvolgorde staat. Een knop achter de hele pagina is geen bediening voor wie de pagina
   met een schermlezer opent.
7. [jij] Geluid uit een kader van een ander domein waarvan de speler niet uit te lezen is:
   open de pagina in de auditsessie en luister. Dat is de enige manier om zeker te weten
   dat een speler die "speelt" ook geluid geeft.

#### Stap 3 — Vastleggen

8. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` leest de media-elementen en kaders uit de code na JavaScript; `get-videos` leest
van elke speler de insluitcode, ook achter een afgeschermde wortel; `get-beweging` laat de
pagina acht seconden staan en meldt welke media er werkelijk speelt en welke kaders
`autoplay` in het adres hebben. Samen zeggen ze of er iets uit zichzelf begint.

Wat hier niet uit blijkt: of er ook geluid uit de luidspreker komt. De metingen lezen of een
speler speelt en of hij gedempt is, niet wat er te horen is. Een speler in een kader van een
ander domein die zijn toestand niet prijsgeeft, blijft een open vraag voor de auditsessie.
Geluid dat pas start na een cookiemuur of een login zie je alleen in de auditsessie; headless
haalt de versie van vóór de cookiemuur op.

### Deelgebieden

1. Media-elementen in de code: audio en video met autoplay, gedempt of niet
2. Ingesloten kaders van een ander domein: videospelers, kaarten en sociale media met autoplay in het adres of in het gedrag
3. Geluid dat een script zelf start: geluidseffecten, meldingen en achtergrondmuziek zonder media-element
4. Bediening als er geluid start: pauze, stop of een eigen volumeregelaar, vooraan in de tabvolgorde

> Aangemaakt op 2026-09-13 bij ZOET-01: 1.4.2 had geen regelbestand en dus geen kaartblok,
> terwijl 1.4.1 er die dag een kreeg. De regels hierboven komen uit de checklist en uit
> `Shift2_Voldoet_Of_Niet_Aanwezig.md`; er zitten nog geen correcties uit audits in. Zet
> uitleg bij deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer
> aan het laatste gebied vast.
