# Werkwijze: video's toegankelijk maken voor de A2-gemeenten

A2 is het samenwerkingsverband van de gemeenten Cranendonck, Heeze-Leende en Valkenswaard
(niet "niveau AA"). Zij hebben een lijst bestaande video's die achteraf toegankelijk gemaakt
moeten worden: ondertiteling, audiodescriptie en een transcript. Dit is geen audit maar
productiewerk, en het gaat per video door dezelfde stappen.

De stappen zelf staan in de tool, op `/admin/video-a2-gemeenten` (menu Beheer, tegel op
`/admin`), in het uitklapblok "Werkwijze per video"
(`app/admin/video-a2-gemeenten/Werkwijze.tsx`). Dat blok is de plek waar de tien stappen
staan; dit bestand herhaalt ze niet, maar legt vast wat er omheen is afgesproken en wat
op de pagina nog niet is bijgewerkt.

## Wat de pagina doet

- Per video vijf vaste fasen: Voorbereiden, Ondertiteling, Audiodescriptie, Transcript,
  Publiceren. Elke fase heeft een timer die start en stopt; er loopt er maar één tegelijk
  (afgedwongen in de database). Modellen `Video` en `VideoPhase`, API onder `app/api/videos/*`
  en `app/api/video-phases/*`.
- Per video een notitieveld (`Video.notities`) voor wat er is gecorrigeerd, bijvoorbeeld de
  ondertitelfouten.
- Een statistiekoverzicht in de stijl van het tabblad Voortgang.

## De lijst komt uit Excel

Bron is `video_overzicht_gemeentenA2.xlsx`: een blad "Video-overzicht" met een kolom
Gemeente, plus één blad per gemeente. De YouTube-link staat in de kolom **URL-alias** (met
streepje), de titel in **Medianaam**. De importknop op de pagina
(`app/api/videos/import/route.ts`, parser `lib/parseVideoXlsx.ts`) leest dat formaat, ook
met de `x:`-naamruimte die het bestand meedraagt, en kiest het blad met de meeste bruikbare
rijen. Heeft het bestand een Gemeente-kolom, dan komt de gemeente per rij daaruit; anders
uit de keuze in het importvenster. Dubbele URL's worden overgeslagen, dus een bijgewerkte
lijst voegt alleen nieuwe video's toe. Op 24 juli 2026 zijn alle 29 rijen geïmporteerd.

Er is geen afvinkstap in de Excel: de voortgang staat alleen in de tool.

## Rolverdeling

De onderzoeker doet alles wat in YouTube gebeurt, ingelogd op het account van de gemeente:
downloaden, ondertiteling corrigeren, publiceren. Claude Code kan daar niet bij en hoort
daar ook niet bij te kunnen. Claude Code is tekst- en controlehulp:

- de ondertitel- of transcripttekst uit YouTube ("Transcript weergeven") wordt in de chat
  geplakt en komt gecorrigeerd terug: verkeerd verstane woorden, interpunctie,
  sprekersaanduiding, `[muziek]` en andere geluidsaanduidingen;
- de beschrijvende teksten voor de audiodescriptie per tijdstip;
- het transcript, met de skill `video-transcript` (gesproken tekst plus beeldbeschrijvingen);
- de status per video in het notitieveld.

## Afspraken die op de pagina ontbreken of anders staan

- **Downloaden gaat via YouTube Studio** (bevestigd 24 juli 2026). Als bewerker van het
  gemeentekanaal download je daar de originele video; geen Premium en geen losse tool nodig.
  Het menu "Downloaden" op de publieke kanaalpagina vereist wél Premium en is dus niet de
  route. 4K Video Downloader is alleen nog terugval als de Studio-download niet lukt. Stap 2
  op de pagina noemt nog 4K Video Downloader als hoofdroute; dat is achterhaald.
- **Downloaden gebeurt vroeg**, niet pas bij de montage.
- **Ingebrande ondertiteling zonder fouten is akkoord.** Alleen ingebrand mét fouten gaat
  terug naar de maker, op de aparte terug-naar-videomaker-lijst, want ingebrande tekst is
  niet zelf te corrigeren. Een eerdere aanname dat ingebrand altijd terug moet, was onjuist.
- **Automatisch gegenereerde ondertiteling voldoet zelden.** Een apart spoor dat automatisch
  is aangemaakt gaat altijd door de correctiestap.
- **De tijdstippenlijst uit stap 6 is werkmateriaal.** Hij dient om de audiodescriptie te
  plaatsen en als context voor het transcript, maar in het transcript zelf staan geen
  tijdcodes: dat is lopende tekst.
- **Onvoldoende stille ruimte is geen reden om terug te sturen.** De niet-hoorbare tekst
  gaat dan in het transcript.
- **Audiodescriptie via Narakeet** (narakeet.com, tekst naar audio): de mp3's komen in
  Premiere op de gemarkeerde stille momenten, in het project dat in stap 5 al klaarstaat
  met het geluid losgekoppeld. Er is geen aparte montagestap erna.
- **Eindcontrole 1.1.1:** het `aria-label` van de ingesloten video heeft de vorm
  "YouTube video: [onderwerp waar de video over gaat]". Leeg of generiek is een gebrek.

## Verwante bestanden

- `wcag-checklists/Toegankelijke_Video_Maken.md`: de snelstartgids voor het maken van een
  nieuwe video. Dit bestand gaat over bestaande video's achteraf.
- `wcag-regels/Shift2_Werkwijze_Video.md`: hoe een video in een audit wordt beoordeeld.
