# Shift2-werkwijze: video's beoordelen

> Hoe je een video op een pagina beoordeelt, en welk deel Claude zelf kan vaststellen.
> De criterium-specifieke regels staan in `Shift2_Regels_SC_1_2_3.md` en
> `Shift2_Regels_SC_1_2_5.md`; dit bestand gaat over het onderzoek dat daaraan voorafgaat.

## Stap 1 — Zit er een video op de pagina, en valt die binnen de scope?

| Situatie | In de scope? |
|---|---|
| `<iframe>` met een YouTube- of Vimeo-speler in de main-content | **ja** |
| `<video>`-element in de pagina | **ja** |
| Alleen een **link** naar YouTube of Vimeo | **nee**, valt buiten een deelonderzoek content |

Zie `Shift2_Scope_Per_Sample.md`. Bij alleen een link zet je 1.2.1 tot en met 1.2.5 op
`niet_aanwezig`; beoordeel dan niets over ondertiteling of audiodescriptie.

Controleer dit machinaal: tel de `iframe`- en `video`-elementen binnen `<main>`.

## Stap 2 — Metadata ophalen

Uit de YouTube-watchpagina (`ytInitialPlayerResponse` in de HTML):

- **titel** — nodig voor de bevinding, die begint met "Op de pagina staat de video 'X'"
- **duur in seconden** — bepaalt hoeveel frames je scant
- **ondertitelsporen** — `captions.playerCaptionsTracklistRenderer.captionTracks`

Bij een spoor betekent `kind: 'asr'` dat het **automatisch gegenereerd** is.

## Stap 3 — Gesloten ondertiteling vaststellen

Gesloten ondertiteling kan de kijker aan- en uitzetten. Twee onafhankelijke controles:

1. **De spelerknop**: `.ytp-subtitles-button` met zijn `aria-label`. Staat er "Ondertiteling niet
   beschikbaar" of ontbreekt de knop, dan is er geen gesloten spoor.
2. **Het timedtext-endpoint**: `https://www.youtube.com/api/timedtext?type=list&v=<id>`. Nul
   bytes betekent geen spoor.

Doe ze allebei. Zeggen ze hetzelfde, dan staat het vast.

## Stap 4 — OPEN ondertiteling: alleen te zien, niet te meten

**Dit is de valkuil.** Open ondertiteling is in het beeld gebrand en staat dus nergens in de
speler-API. Vind je geen gesloten spoor, concludeer dan NIET meteen dat er geen ondertiteling
is: kijk eerst naar de frames.

Bij BEV-03 (duurzaam.beverwijk.nl/energiehub-bedrijven) zei de speler "Ondertiteling niet
beschikbaar" en gaf het endpoint nul bytes, terwijl de video de hele tijd ingebrande
ondertiteling toont. Zonder de frames te bekijken was dat een onterechte 1.2.2-bevinding
geworden.

## Stap 5 — Frames scannen op YouTube zelf

Scan de video **op YouTube zelf**, niet in de embed op de pagina. Klik op het YouTube-logo in de
speler, of ga rechtstreeks naar `https://www.youtube.com/watch?v=<id>`. Twee voordelen:

- het beeld is ruim twee keer zo groot (989×556 tegenover een krappe embed), dus kleine tekst
  is leesbaar;
- de bedieningsbalk **verdwijnt** zodra je de muis wegbeweegt, zodat de onderste strook vrij is.
  Precies daar staan naambalkjes en open ondertiteling.

Dat laatste lukt in de embed niet: CSS injecteren om de bediening te verbergen werkt daar niet,
want de speler rendert in een eigen laag. Op de watchpagina is `page.mouse.move(5, 5)` genoeg.

Gebruik `scripts/video-scan.mjs` met het YouTube-id en eventueel een interval:

```bash
npx tsx scripts/video-scan.mjs H2-bwf31PAI 3
```

De frames komen in `tmp/frames/` te staan, met het tijdstip als bestandsnaam (`00-09.png`).
Bekijk ze daarna met je Read-tool. Wat er misgaat als je het anders doet:

1. **Open de embed niet los.** `youtube-nocookie.com/embed/<id>` rechtstreeks openen geeft
   "Fout 153: fout bij configuratie van videospeler".
2. **Klik de cookiemelding weg** voordat je begint, anders ligt er een overlay over het beeld.
3. **Zet `muted = true`** voordat je afspeelt, anders blokkeert de browser het starten.

Per moment: `currentTime` zetten, ongeveer anderhalve seconde wachten, pauzeren, muis naar de
hoek, ruim drie seconden wachten tot de balk vervaagt, dan screenshot met `clip` op het
video-element. De speler landt een paar seconden ná het gevraagde tijdstip; lees daarom de
werkelijke `currentTime` uit en gebruik díe in de bevinding.

Interval van 3 seconden werkt goed: bij een video van 93 seconden zijn dat 31 frames, en
naambalkjes staan lang genoeg in beeld om gevangen te worden.

**Let op de scope:** je scant op YouTube, maar je beoordeelt de video zoals die op de
gemeentepagina staat. Een transcript of beschrijving die alleen op YouTube staat, telt niet mee
als alternatief op de pagina zelf.

## Stap 6 — De frames bekijken

Loop ze langs en noteer per frame:

- **Naambalkjes / lower thirds** — "Suzanne Klaassen, Wethouder Beverwijk" op 00:09
- **Locatie- of datumlabels**
- **Tekst in beeld** die niet wordt uitgesproken
- **Open ondertiteling** — loopt die de hele video door, of maar een deel?
- **Handelingen zonder tekst** — iemand bedient een apparaat, wijst iets aan op een kaart, doet
  iets voor. Daar staat geen letter bij, maar het is wél visuele informatie.

De tijdstippen die je zo vindt gaan letterlijk in de bevinding, in de vorm `00:09 "tekst"`.

Zoek dus niet alleen naar letters. Een video kan volledig tekstloos zijn en tóch visuele
informatie bevatten die iemand die blind is mist. Zie je zo'n handeling, leg de video dan voor
met de vraag of het ook wordt verteld.

## Wat je zelf beslist en wat je voorlegt

Leg alleen voor wat er echt toe doet. Een vraag die de onderzoeker met "akkoord" beantwoordt,
voegt niets toe en verdringt de vragen die wél aandacht nodig hebben.

Vind je niets dat hoorbaar gemaakt moet worden, zet 1.2.3 en 1.2.5 dan zelf op `voldoet`. Maar
noteer in het veld `reden` van de dekkingslijst waaróp je dat baseert: aantal frames, interval,
wat er in beeld stond. De onderzoeker ziet die lijst per sample naast alle andere criteria en
kan zo wegen of het oordeel klopt, zonder de video te openen.

Waarom juist bij een goedkeuring: een afkeuring komt in het rapport terecht en wordt gelezen,
dus daar valt een fout op. Een goedkeuring levert geen tekst op — het criterium staat groen en
er is niets om over te struikelen. `voldoet` is dus de status waar een fout onzichtbaar blijft,
en daarom hoort daar het bewijs bij. Een leeg `reden`-veld betekent: aangenomen, niet onderzocht.

## Wat Claude WEL en NIET kan

| Claude zelf | Vraag aan de onderzoeker |
|---|---|
| Is er een video, ingesloten of gelinkt | Is er **ruimte in het audiospoor** voor audiodescriptie? |
| Titel en duur | Klopt de ondertiteling inhoudelijk? |
| Gesloten ondertiteling: aanwezig, automatisch of niet | Bevat het geluid informatie die niet in beeld is? |
| Open ondertiteling: aanwezig en over welk deel | Wordt de tekst uitgesproken — **alleen als er géén ondertiteling is** |
| Naambalkjes en tekst in beeld, mét tijdstip | |
| Transcript-knop bij de speler | |
| **Audiodescriptie: apart audiospoor aanwezig of niet** | |
| **Of tekst-in-beeld hoorbaar is — via de open ondertiteling** | |

### Audiodescriptie zelf vaststellen

Audiodescriptie is een **tweede audiospoor**. Lees de `adaptiveFormats` uit
`ytInitialPlayerResponse` en kijk of er formats met een `audioTrack` zijn; is er maar één spoor,
dan is er geen audiodescriptie. Bij een andere speler: zoek een knop of menu-optie
"audiodescriptie".

Let op wat dat wel en niet bewijst. Geen apart spoor betekent: geen audiodescriptie. Het betekent
**niet** dat de tekst in beeld onhoorbaar is — de spreker kan hem gewoon zelf noemen. Zie
`Shift2_Regels_SC_1_2_3.md` voor de drie routes die 1.2.3 accepteert.

### Open ondertiteling beantwoordt de luistervraag

Heeft de video open ondertiteling, dan geeft die weer wat er gesproken wordt. Leg dan per
tijdstip de tekst in beeld naast de ondertiteling eronder: zegt de ondertiteling op dat moment
iets heel anders, dan wordt de tekst in beeld niet uitgesproken. Controleer ook het frame ervoor
en erna, want iemand kan zich net vóór of ná het naambalkje voorstellen.

Zo vervalt de luistervraag helemaal. Alleen bij een video **zonder** ondertiteling en zonder
transcript blijft die vraag staan.

Wat sowieso voor de onderzoeker overblijft, is of er stiltes in het audiospoor zitten waarin
audiodescriptie past. Dat antwoord bepaalt de vorm van het 1.2.5-advies, niet of er een bevinding
is; zie `Shift2_Regels_SC_1_2_5.md`.

## Volgorde bij het beoordelen

1. Video aanwezig en binnen de scope? Zo nee: 1.2.1 t/m 1.2.5 op `niet_aanwezig`.
2. **1.2.2** — gesloten spoor? Zo nee, frames bekijken op open ondertiteling. Beide afwezig is
   een afkeuring; automatisch gegenereerde ondertiteling ook (zie de QuickFindings).
3. **1.2.1** — is het een video zonder geluid of alleen audio? Meestal `niet_aanwezig`.
4. **1.2.4** — alleen bij een live-uitzending. Meestal `niet_aanwezig`.
5. **1.2.3 en 1.2.5** — frames scannen op tekst in beeld en tijdstippen verzamelen. Stel daarna
   zelf vast: is er een apart audiospoor, is er een transcript-knop, en zegt de open
   ondertiteling op die tijdstippen iets anders dan wat er in beeld staat? Zijn alle drie de
   routes dicht, dan is het een afkeuring zonder dat je iets hoeft te vragen. Zie de
   regelbestanden voor de vaste teksten.

Controleer bij 1.2.3 eerst of de speler een transcript-knop heeft: dan is er een geldig
alternatief en vervalt de bevinding.

Aanleiding: BEV-03 (2026-08-04), video "Netcongestie? In Beverwijk zoeken we samen naar
oplossingen" op de pagina Energiehub bedrijven. Frits wees erop dat er twee soorten
ondertiteling zijn en dat open ondertiteling niet uit de speler te halen is.
