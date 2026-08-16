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
