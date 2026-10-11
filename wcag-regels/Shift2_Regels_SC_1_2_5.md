# Shift2-beoordelingsregels SC 1.2.5

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_5.md` als ze elkaar tegenspreken.

## Meestal zelf te bepalen

De voorbeelden met tijdstip verzamel je zelf met een videoscan, net als bij 1.2.3. Zie
`Shift2_Werkwijze_Video.md`.

1.2.5 is strenger dan 1.2.3: hier telt **alleen audiodescriptie**, een transcript volstaat niet
(Understanding 1.2.5: "under Success Criterion 1.2.5 authors must provide an audio
description"). Audiodescriptie kan drie vormen hebben, en alle drie voldoen:

- Een tweede, te kiezen audiospoor (G78). Lees de `adaptiveFormats` uit
  `ytInitialPlayerResponse` en kijk of er meer dan één `audioTrack` is. Bij een andere speler:
  is er een knop of menu-optie "audiodescriptie"?
- Een aparte versie van de video met audiodescriptie (G173). Staat die op een andere pagina,
  dan moet er een link naartoe zijn bij de video.
- Beschrijving die in het enige geluidsspoor is ingesproken (G226, onderdeel van G173).

Eén audiospoor betekent dus niet automatisch geen audiodescriptie. Bron: W3C Understanding
1.2.5, sufficient techniques G78, G173, G226. Besluit Frits 2026-10-11: volg W3C.

Eén uitzondering op "alleen audiodescriptie": bij een video met **één pratend persoon** voor een
vaste achtergrond, zonder andere belangrijke beeldinformatie, volstaat een korte statische tekst
bij de video met wat in beeld staat en niet gezegd wordt: naam en functie uit het naambalkje,
de setting, eventuele titels (G203). Die tekst hoort programmatisch aan de video gekoppeld te
zijn. Niet bij meerdere sprekers die alleen met tekst in beeld worden voorgesteld. Bron: W3C
Understanding 1.2.5, G203. Besluit Frits 2026-10-11: volg W3C.

Is er geen audiodescriptie in een van die drie vormen, is het geen G203-geval, **en** staat er
visuele informatie in beeld die niet hoorbaar is (zie 1.2.3 voor hoe je dat laatste vaststelt
via de open ondertiteling), dan is dat een **afkeuring**. Daar hoef je niets voor te vragen.

### De ruimte-vraag bepaalt het ADVIES, niet of er een bevinding is

Of er natuurlijke pauzes in het audiospoor zitten, kun je niet zien; daarvoor moet je luisteren.
Maar dat antwoord verandert de bevinding niet, alleen de vorm van het advies:

| Ruimte in het audiospoor | Gevolg |
|---|---|
| Volledig ruimte | Bevinding. Audiodescriptie in de pauzes (G78 of G173). Kortere samenvatter-stijl die naar de 1.2.3-bevinding verwijst |
| Deels wel, deels niet | Bevinding. Vierdelig advies (zie de mengvorm-regel hieronder): audiodescriptie in de pauzes die er zijn, uitgebreide audiodescriptie waar ze te kort zijn |
| Helemaal geen ruimte | Bevinding. Advies: uitgebreide audiodescriptie (G8), waarbij de video stilstaat zodat de beschrijving past. Een transcript dekt 1.2.5 niet |
| Eén pratend persoon, vaste achtergrond, alleen naam, functie of setting in beeld | Een statische tekst bij de video voldoet (G203). Staat die er, dan geen bevinding; staat hij er niet, dan bevinding met die tekst als advies |

De ruimte-vraag laat de bevinding nooit vervallen. Bronnen: G8 (uitgebreide audiodescriptie is
bedoeld voor als "the pauses between dialogue/narration are too short") en F113 (fout: "not using
available pauses in dialogue to provide audio descriptions of important visual content"). Een
pauze die er is maar niet gebruikt wordt, is dus een fout op F113. Besluit Frits 2026-10-11:
volg W3C.

> Historische noot. Tot 2026-10-11 hield Frits bewust een andere lezing aan: was er helemaal
> geen ruimte in het geluid, dan was er geen 1.2.5-bevinding nodig, omdat het transcript onder
> 1.2.3 het dekte; bij een mengvorm mocht het transcript de momenten zonder ruimte dekken. Die
> lezing is op 2026-10-11 losgelaten om W3C te volgen. W3C kent voor 1.2.5 geen terugval op een
> transcript.

Zet 1.2.5 dus niet op `niet_te_bepalen` omdat je de pauzes niet kunt horen: schrijf de
bevinding, en stel de ruimte-vraag erbij zodat de onderzoeker het advies kan aanscherpen.

> In de video 'X' op [pagina] is geen audiodescriptie-spoor aanwezig, terwijl er op 00:09 en
> 00:43 tekst in beeld staat die niet wordt uitgesproken. Is er in het audiospoor ruimte voor
> audiodescriptie (natuurlijke pauzes), of wordt er continu gesproken? Graag met tijdstip.

Stel die vraag samen met een eventuele vraag bij 1.2.3: het gaat om dezelfde video en de
onderzoeker hoeft hem dan maar één keer te bekijken.

Vind je bij het scannen niets dat hoorbaar gemaakt moet worden, zet het dan **zelf** op
`voldoet` en noteer in `reden` wat je hebt gescand (aantal frames, interval, wat er in beeld
stond). Dezelfde regel als bij 1.2.3: niet voorleggen, wel het bewijs vastleggen, want een
goedkeuring levert geen tekst in het rapport op waar een fout aan het licht komt. Let daarbij
op dat de scan alleen tékst vindt en geen handelingen; zie `Shift2_Regels_SC_1_2_3.md`.

## Regels

- Altijd samen met 1.2.3 als er visuele informatie zonder hoorbaar alternatief is. Twee aparte bevindingen, want de eisen verschillen: 1.2.3 staat transcript OF audiodescriptie toe, 1.2.5 alleen audiodescriptie (bij te korte pauzes uitgebreide audiodescriptie, G8). De enige uitzondering is één pratend persoon met een statische tekst (G203).
- Gebruik QuickFinding 50baed61-a658-4b18-8286-9b2104fdd43c. Zelfde beschrijvingsopzet als 1.2.3 (probleem, doelgroep, voorbeelden met tijdstip). De volledige titel, beschrijving en het advies staan hieronder onder "Vaste tekst uit de QuickFinding-bibliotheek".
- MENGVORM (video heeft deels wel en deels geen ruimte voor audiodescriptie): een 1.2.5-bevinding per pagina met een vierdelig advies. 1) audiodescriptie als algemene oplossing, 2) concreet tijdstip noemen waar WEL ruimte is ("audiodescriptie is dan verplicht"; een ongebruikte pauze is een fout op F113), 3) momenten zonder ruimte benoemen: daar is uitgebreide audiodescriptie nodig, waarbij de video stilstaat voor de beschrijving (G8), 4) verwijzing naar 1.2.3: een transcript helpt daar, maar dekt 1.2.5 niet. Besluit Frits 2026-10-11: volg W3C.
- Video met VOLLEDIG ruimte voor audiodescriptie: kortere samenvatter-stijl die naar de 1.2.3-bevinding verwijst.
- Video met HELEMAAL GEEN ruimte voor audiodescriptie: wél een 1.2.5-bevinding, met als advies uitgebreide audiodescriptie (G8). Het transcript onder 1.2.3 dekt 1.2.5 niet. Besluit Frits 2026-10-11: volg W3C; tot die datum gold hier "geen bevinding nodig".
- Video met één pratend persoon voor een vaste achtergrond, en in beeld alleen naam, functie of setting: staat er een statische tekst bij de video met die gegevens, dan geen bevinding (G203). Staat hij er niet, dan een bevinding met die tekst als eenvoudigste oplossing.
- Impact matig, responsibility redacteur, status open.

## Technieken (W3C)

| Soort | Techniek |
|---|---|
| Voldoende | G78 Tweede, te kiezen audiospoor met audiodescriptie |
| Voldoende | G173 Versie van de video met audiodescriptie, ook via SM6/SM7 of G226 (beschrijving ingesproken in het geluidsspoor) |
| Voldoende | G8 Video met uitgebreide audiodescriptie (SM1/SM2), voor als de pauzes te kort zijn |
| Voldoende | G203 Statische tekst bij een video met één pratend persoon |
| Aanvullend | H96 `track`-element voor audiodescriptie |
| Fout | F113 Beschikbare pauzes in de dialoog niet gebruikt voor audiodescriptie van belangrijke beeldinformatie |

Een transcript (G69) staat bij 1.2.3 als voldoende techniek, niet bij 1.2.5.

## Vaste tekst uit de QuickFinding-bibliotheek

Deze tekst is door Frits goedgekeurd en ligt vast. Neem hem letterlijk over en vul alleen de
titel van de video en de voorbeelden in. Niet herformuleren en niet "verbeteren"; de
woordkeuze die vastligt ("beschrijft", "is opgenomen", "onder de video", geen "namelijk")
staat in `Shift2_Regels_SC_1_2_3.md` en geldt hier net zo.

### QuickFinding 50baed61-a658-4b18-8286-9b2104fdd43c (1.2.5)

Titel: **Video met visuele informatie zonder audiodescriptie**

Beschrijving:

> Op de pagina staat een video. In deze video komt visuele informatie voor die niet
> beschikbaar is voor mensen die blind of slechtziend zijn.
>
> Voorbeelden:
> - MM:SS "tekst in beeld"
> - MM:SS "tekst in beeld"

Advies:

> Voeg een audiodescriptie toe om belangrijke visuele informatie hoorbaar te maken. Dit kan
> door een tweede audiospoor aan de video toe te voegen dat zowel de originele audio als de
> audiodescriptie bevat.
>
> Op momenten waar ruimte is in het audiospoor is een audiodescriptie verplicht. Is er in het
> audiospoor écht geen ruimte? Neem de visuele informatie dan als alternatief op in een
> teksttranscript.

Bij toepassen: "een video" wordt "de video 'X'" met de titel van de video; dezelfde twee tot
drie voorbeelden met tijdstip als in de 1.2.3-bevinding over dezelfde video; impact `matig`,
verantwoordelijkheid `redacteur`, status `open`. Dit advies is de basis; bij een mengvorm
(deels wel, deels geen ruimte) wordt het het vierdelige advies uit de regels hierboven, bij
volledig ruimte de korte vorm die naar de 1.2.3-bevinding verwijst.

**Deze tekst botst sinds 2026-10-11 met de regels.** De laatste zin ("Is er in het audiospoor
écht geen ruimte? Neem de visuele informatie dan als alternatief op in een teksttranscript")
volgt de oude Shift2-lezing. Volgens W3C is dan uitgebreide audiodescriptie nodig (G8), en geen
transcript. Besluit Frits 2026-10-11: volg W3C. Pas de bibliotheektekst niet zelf aan en
herformuleer hem niet in een bevinding: dat beslist Frits. Meld bij elke 1.2.5-bevinding op
basis van deze QuickFinding aan de onderzoeker dat die zin botst, zodat hij kan kiezen.

De 1.2.3-tegenhanger (QuickFinding ed3a4d2a-ce67-4474-88a0-edba1c124624) staat in
`Shift2_Regels_SC_1_2_3.md`. Het advies dáár bevat dezelfde transcript-terugval; onder 1.2.3
klopt die, en wat er met de zin over 1.2.5 in de8bf36c gebeurt staat in dat bestand.

## Alleen ingesloten media telt mee

Media valt onder dit criterium wanneer de speler **op de pagina zelf is ingesloten**:
een `<video>`, een `<audio>`, of een `<iframe>` naar YouTube of Vimeo binnen de
beoordeelde pagina.

Staat er alleen een **link** naar een video elders — bijvoorbeeld een tekstlink naar
YouTube — dan is er op deze pagina geen media om te beoordelen. Zet het criterium dan op
`niet_aanwezig` met als reden dat de video niet is ingesloten.

Dat geldt ook als de video van de organisatie zelf is. De grens ligt bij het insluiten,
niet bij het eigendom.

Vastgelegd door Frits op 2026-08-15, naar aanleiding van heuvelrug.nl/archeologie: zes
afleveringen van "Graven in het Groen" die uitsluitend als tekstlink naar YouTube zijn
opgenomen.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort -- een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Audiodescriptie bij vooraf opgenomen video

### In het kort

Strenger dan 1.2.3: hier telt alleen audiodescriptie, een transcript volstaat niet.
Audiodescriptie kan een tweede spoor zijn, een gelinkte aparte versie (G173), of beschrijving
die in het enige geluidsspoor is ingesproken (G226). Is er visuele informatie die niet hoorbaar
wordt gemaakt -- een naambalkje, een handeling zonder woorden -- en is er geen audiodescriptie
in een van die vormen, dan is dat een afkeuring, zonder iets te hoeven vragen. Uitzondering:
één pratend persoon met een korte tekst bij de video met naam, functie en setting (G203).

De vraag die je wél moet stellen gaat niet over de bevinding maar over het advies: zit er
ruimte in het audiospoor (natuurlijke pauzes)? Bij volledige ruimte is het advies kort en
verwijst naar de 1.2.3-bevinding; bij deels ruimte krijgt het advies vier onderdelen; bij
helemaal géén ruimte is het advies uitgebreide audiodescriptie (G8). De bevinding vervalt
nooit door gebrek aan ruimte. Besluit Frits 2026-10-11: volg W3C.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 -- Is er iets te beoordelen?

1. [agent] Zoek de ingesloten videospelers: `video`-elementen en `iframe`-insluitingen van
   YouTube, Vimeo of een eigen speler. Noteer waarop je hebt gezocht.
2. [agent] Een video die alleen gelínkt is, zonder speler op de pagina, valt buiten dit
   criterium -- ook als hij van de organisatie zelf is. Dan `niet_aanwezig`, met die reden.
3. [agent] Is dit een formulierstap uit de formuliergenerator? Dan `niet_aanwezig`, zonder
   verder te zoeken. Zie `Shift2_Scope_Per_Sample.md`, "Een formulierstap heeft nooit video".

#### Stap 2 -- Is er een audiodescriptiespoor?

4. [agent] Lees de audiosporen met `get-videosporen`. Meer dan één `audioTrack` betekent een
   apart spoor. Bij een andere speler: is er een knop of menu-optie "audiodescriptie"?
5. [agent] Is er maar één audiospoor, kijk dan of er bij de video een link staat naar een
   versie met audiodescriptie (G173), en of de vertelstem beschrijft wat er in beeld staat
   (G226). Allebei voldoen. Schrijf wat je vond bij gebied 2, ook als het geen apart spoor is.
   Besluit Frits 2026-10-11: volg W3C. Daarna door naar stap 3.

#### Stap 3 -- Wat is er te zien dat niet te horen is?

6. [agent] Bekijk beeldjes verspreid over de video, zoals bij 1.2.3. Is er visuele informatie
   zonder hoorbaar alternatief (naambalkje, tekst in beeld, een handeling zonder woorden) en
   is er geen audiodescriptie in een van de vormen uit stap 2, dan is dat een afkeuring --
   zonder iets te hoeven vragen. Uitzondering: één pratend persoon voor een vaste achtergrond,
   met een korte tekst bij de video die naam, functie en setting noemt (G203). Dan geen
   bevinding.
7. [agent] Vind je niets dat hoorbaar gemaakt moet worden, zet het criterium dan zelf op
   `voldoet`. Schrijf in de toelichting bij het deelgebied waaróp je dat baseert: hoeveel
   beeldjes, met welk interval, wat je wél zag.

#### Stap 4 -- De ruimte-vraag

8. [jij] Bij een afkeuring: is er in het audiospoor ruimte voor audiodescriptie (natuurlijke
   pauzes), of wordt er continu gesproken? Dat verandert niet OF er een bevinding is, alleen
   de vorm van het advies. Kun je het niet horen, stel de vraag dan aan de onderzoeker samen
   met een eventuele 1.2.3-vraag over dezelfde video.
9. [jij] Volledig ruimte: korte samenvatter-stijl die naar de 1.2.3-bevinding verwijst. Deels
   ruimte: vierdelig advies (zie de mengvorm-regel hierboven). Helemaal geen ruimte: toch een
   1.2.5-bevinding, met als advies uitgebreide audiodescriptie (G8). Een transcript dekt 1.2.5
   niet. Besluit Frits 2026-10-11: volg W3C. Gebruik je QuickFinding 50baed61, meld dan dat de
   transcript-zin in dat advies botst.

#### Stap 5 -- Wegschrijven

10. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht. Zonder een complete lijst wordt het oordeel geweigerd. Staat er
    geen ingesloten video op de pagina, gebruik dan `nvt` bij alle vier, met de zin waaróp je
    hebt gezocht.
11. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was --
    kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie -- en
    verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Deelgebieden

1. Ingesloten video met beeld
2. Audiodescriptiespoor: aanwezig of niet
3. Tekst in beeld zonder hoorbaar alternatief
4. Ruimte voor audiodescriptie in het audiospoor

### Zo is het vastgesteld

`get-videosporen` leest de audiosporen per video en legt drie beeldjes vast, verspreid over
de duur. Dat is het middel voor deelgebied 2 en 3. Voor deelgebied 2 ziet het alleen een
tweede spoor: een gelinkte versie met audiodescriptie (G173) of beschrijving die in het enige
spoor is ingesproken (G226) zoek je op de pagina en hoor je in de video.

Wat het niet doet: het beoordeelt niet wat er in beeld gebeurt, en het hoort niet of er
natuurlijke pauzes in het audiospoor zitten -- dat laatste is iets om zelf te beluisteren.
Drie beeldjes over een video van vijf minuten zijn een steekproef, geen dekking.
