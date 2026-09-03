# Shift2-regels SC 1.2.4 — Ondertiteling (live), niveau AA

Live uitgezonden video met geluid moet live ondertiteld worden. Voor de onderzoeksmethode zie
`Shift2_Werkwijze_Video.md`.

## Bijna altijd niet aanwezig

Op de meeste gemeentesites staat geen live video. Zet 1.2.4 dan op `niet_aanwezig` — maar doe
dat bewust, niet automatisch. Waar het wél voorkomt:

- **raadsvergaderingen** die live worden uitgezonden (vaak via een externe raadsinformatie-omgeving)
- **livestreams** van evenementen, persconferenties of informatiebijeenkomsten
- een **webcam** met geluid

## Vaststellen of iets live is

- Op YouTube: `isLive` of `isLiveContent` in `ytInitialPlayerResponse`, of het rode
  "LIVE"-label in de speler.
- Bij een `<video>`-element: `duration` is `Infinity` bij een echte livestream.
- In de tekst op de pagina: "live", "rechtstreeks", "uitzending".

Let op het onderscheid: een raadsvergadering die je **terugkijkt** is vooraf opgenomen en valt
onder 1.2.2, niet onder 1.2.4. Alleen de uitzending op het moment zelf telt hier.

Staat de livestream op een **externe** omgeving waar je alleen naartoe linkt, dan valt die
buiten een deelonderzoek content — net als een gelinkte YouTube-video. Zie
`Shift2_Scope_Per_Sample.md`.

## Beoordeling

| Situatie | Status |
|---|---|
| Geen live video op de pagina | `niet_aanwezig` |
| Livestream alleen gelinkt, niet ingesloten | `niet_aanwezig` (buiten de scope) |
| Livestream ingesloten, mét live ondertiteling | `voldoet` |
| Livestream ingesloten, zonder live ondertiteling | `afgekeurd` |
| Er staat een livestream maar die is nu niet actief | `niet_te_bepalen` + vraag aan de onderzoeker |

Dat laatste komt vaak voor: buiten vergadertijd is er niets te zien. Meld het dan, met de vraag
of tijdens de uitzending live ondertiteling beschikbaar is (zie
`feedback_onbeoordeelbaar_altijd_melden`). Nooit stilzwijgend op `voldoet` zetten.

## Bij een afkeuring

Drie zinnen volgens `Shift2_Schrijfregels.md`. Wie doof of slechthorend is, kan een
raadsvergadering op het moment zelf niet volgen en moet wachten tot de opname met ondertiteling
beschikbaar is. Impact `serieus`, verantwoordelijkheid `redacteur`.

Live ondertiteling wordt meestal door de streamingleverancier geleverd; het advies gaat dus over
die dienst inschakelen, niet over iets in het CMS.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort -- een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Live ondertiteling bij een rechtstreekse uitzending

### In het kort

Live uitgezonden video met geluid moet live ondertiteld worden. Wie doof of slechthorend is,
kan een raadsvergadering op het moment zelf anders niet volgen en moet wachten tot de opname
achteraf met ondertiteling beschikbaar is.

Op de meeste gemeentesites komt dit niet voor: een raadsvergadering, livestream of webcam is
zeldzaam, en een formulierstap heeft naar zijn aard nooit video. Zet het criterium dan bewust
op `niet_aanwezig` -- niet automatisch, maar ook niet met een zoektocht die niets kan vinden.

Het onderscheid met 1.2.2 is scherp: alleen de uitzending op het moment zelf telt hier. Een
raadsvergadering die je terugkijkt is vooraf opgenomen media.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 -- Is er live video?

1. [agent] Is dit een formulierstap uit de formuliergenerator? Dan `niet_aanwezig`, zonder
   verder te zoeken. Zie `Shift2_Scope_Per_Sample.md`, "Een formulierstap heeft nooit video".
2. [agent] Zoek naar een ingesloten speler met signalen van een livestream: het rode
   "LIVE"-label, `isLive` of `isLiveContent` in `ytInitialPlayerResponse`, een `duration` van
   `Infinity` bij een `<video>`-element, of tekst als "live", "rechtstreeks", "uitzending".
3. [agent] Staat de livestream alleen als **link** naar een externe omgeving, zonder speler op
   de pagina zelf? Dan valt hij buiten de scope: `niet_aanwezig`.

#### Stap 2 -- Actief op het moment van meten?

4. [agent] Is er geen ingesloten livestream gevonden, dan `niet_aanwezig`.
5. [agent] Staat er wel een livestream maar is die nu niet actief -- buiten vergadertijd is er
   vaak niets te zien -- dan `niet_te_bepalen`, met de vraag of er tijdens de uitzending live
   ondertiteling beschikbaar is. Nooit stilzwijgend op `voldoet`.
6. [agent] Is de livestream actief, controleer dan of er live ondertiteling meeloopt.

#### Stap 3 -- Wegen

7. [jij] Ingesloten, actief, mét live ondertiteling: `voldoet`. Zonder: `afgekeurd`.
8. [jij] Bij een afkeuring: impact `serieus`, verantwoordelijkheid `redacteur`. Drie zinnen.
   Live ondertiteling komt meestal van de streamingleverancier; het advies gaat over die
   dienst inschakelen, niet over iets in het CMS.

#### Stap 4 -- Wegschrijven

9. [agent] Dit criterium heeft geen deelgebieden: het is één vraag, geen verzameling losse
   deelvragen. De onderbouwing bij `reden` mag daarom de volledige afweging bevatten, in
   plaats van alleen de meetgeldigheid.

### Zo is het vastgesteld

Geen los meetcommando. De vaststelling loopt via `get-html` en `get-screenshot`: zoek in de
opgehaalde pagina naar een ingesloten speler en naar de livesignalen uit stap 1 en 2 hierboven.
