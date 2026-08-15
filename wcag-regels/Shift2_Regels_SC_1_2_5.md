# Shift2-beoordelingsregels SC 1.2.5

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_5.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen

Dit criterium vereist een test in de browser. Zet het altijd op `niet_te_bepalen`
(of `niet_aanwezig` als het aantoonbaar niet van toepassing is) en noteer de vraag in `reden`.

**Vraag voor de onderzoeker:**

> Is er in de videos op [pagina] ruimte in het audiospoor voor audiodescriptie (natuurlijke pauzes), of wordt er continu gesproken? Graag per video, met tijdstip.

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
