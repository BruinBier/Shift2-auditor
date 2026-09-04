# Shift2-beoordelingsregels SC 1.2.5

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_5.md` als ze elkaar tegenspreken.

## Meestal zelf te bepalen

De voorbeelden met tijdstip verzamel je zelf met een videoscan, net als bij 1.2.3. Zie
`Shift2_Werkwijze_Video.md`.

1.2.5 is strenger dan 1.2.3: hier telt **alleen audiodescriptie**, een transcript volstaat niet.
En of er audiodescriptie is, stel je zelf vast: lees de `adaptiveFormats` uit
`ytInitialPlayerResponse` en kijk of er meer dan één `audioTrack` is. Bij een andere speler: is
er een knop of menu-optie "audiodescriptie"?

Is er maar één audiospoor **en** staat er visuele informatie in beeld die niet hoorbaar is (zie
1.2.3 voor hoe je dat laatste vaststelt via de open ondertiteling), dan is dat een **afkeuring**.
Daar hoef je niets voor te vragen.

### De ruimte-vraag bepaalt het ADVIES, niet of er een bevinding is

Of er natuurlijke pauzes in het audiospoor zitten, kun je niet zien; daarvoor moet je luisteren.
Maar dat antwoord verandert de bevinding niet, alleen de vorm van het advies:

| Ruimte in het audiospoor | Gevolg |
|---|---|
| Volledig ruimte | Kortere samenvatter-stijl die naar de 1.2.3-bevinding verwijst |
| Deels wel, deels niet | Vierdelig advies (zie de mengvorm-regel hieronder) |
| Helemaal geen ruimte | Geen 1.2.5-bevinding nodig; het transcript onder 1.2.3 dekt het volledig |

Alleen dat laatste geval laat de bevinding vervallen. Zet 1.2.5 dus niet op `niet_te_bepalen`
omdat je de pauzes niet kunt horen: schrijf de bevinding, en stel de ruimte-vraag erbij zodat de
onderzoeker het advies kan aanscherpen.

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

- Altijd samen met 1.2.3 als er visuele informatie zonder hoorbaar alternatief is. Twee aparte bevindingen, want de eisen verschillen: 1.2.3 staat transcript OF audiodescriptie toe, 1.2.5 alleen audiodescriptie als er ruimte is.
- Gebruik QuickFinding 50baed61-a658-4b18-8286-9b2104fdd43c. Zelfde beschrijvingsopzet als 1.2.3 (probleem, doelgroep, voorbeelden met tijdstip).
- MENGVORM (video heeft deels wel en deels geen ruimte voor audiodescriptie): een 1.2.5-bevinding per pagina met een vierdelig advies. 1) audiodescriptie als algemene oplossing, 2) concreet tijdstip noemen waar WEL ruimte is ("audiodescriptie is dan verplicht"), 3) momenten zonder ruimte benoemen ("volstaat een transcript onder dit succescriterium"), 4) verwijzing naar 1.2.3 voor het transcript.
- Video met VOLLEDIG ruimte voor audiodescriptie: kortere samenvatter-stijl die naar de 1.2.3-bevinding verwijst.
- Video met HELEMAAL GEEN ruimte voor audiodescriptie: geen 1.2.5-bevinding nodig, het transcript onder 1.2.3 dekt het volledig.
- Impact matig, responsibility redacteur, status open.

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

Strenger dan 1.2.3: hier telt alleen een apart audiodescriptiespoor, een transcript volstaat
hier niet. Is er visuele informatie die niet hoorbaar wordt gemaakt -- een naambalkje, een
handeling zonder woorden -- en is er maar één audiospoor, dan is dat een afkeuring, zonder
iets te hoeven vragen.

De vraag die je wél moet stellen gaat niet over de bevinding maar over het advies: zit er
ruimte in het audiospoor (natuurlijke pauzes)? Bij volledige ruimte is het advies kort en
verwijst naar de 1.2.3-bevinding; bij deels ruimte krijgt het advies vier onderdelen; alleen
bij helemaal géén ruimte vervalt de 1.2.5-bevinding en dekt het transcript onder 1.2.3 alles.

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
5. [agent] Is er maar één audiospoor, ga dan door naar stap 3 -- daar valt de beslissing.

#### Stap 3 -- Wat is er te zien dat niet te horen is?

6. [agent] Bekijk beeldjes verspreid over de video, zoals bij 1.2.3. Is er visuele informatie
   zonder hoorbaar alternatief (naambalkje, tekst in beeld, een handeling zonder woorden) en
   is er maar één audiospoor, dan is dat een afkeuring -- zonder iets te hoeven vragen.
7. [agent] Vind je niets dat hoorbaar gemaakt moet worden, zet het criterium dan zelf op
   `voldoet`. Schrijf in de toelichting bij het deelgebied waaróp je dat baseert: hoeveel
   beeldjes, met welk interval, wat je wél zag.

#### Stap 4 -- De ruimte-vraag

8. [jij] Bij een afkeuring: is er in het audiospoor ruimte voor audiodescriptie (natuurlijke
   pauzes), of wordt er continu gesproken? Dat verandert niet OF er een bevinding is, alleen
   de vorm van het advies. Kun je het niet horen, stel de vraag dan aan de onderzoeker samen
   met een eventuele 1.2.3-vraag over dezelfde video.
9. [jij] Volledig ruimte: korte samenvatter-stijl die naar de 1.2.3-bevinding verwijst. Deels
   ruimte: vierdelig advies (zie de mengvorm-regel hierboven). Helemaal geen ruimte: geen
   1.2.5-bevinding nodig, het transcript onder 1.2.3 dekt het al.

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
de duur. Dat is het middel voor deelgebied 2 en 3.

Wat het niet doet: het beoordeelt niet wat er in beeld gebeurt, en het hoort niet of er
natuurlijke pauzes in het audiospoor zitten -- dat laatste is iets om zelf te beluisteren.
Drie beeldjes over een video van vijf minuten zijn een steekproef, geen dekking.
