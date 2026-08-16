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
